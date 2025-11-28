'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2, 
  Loader2, 
  Bot, 
  Settings2,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShinyButton } from '@/components/ui/shiny-button';
import { cn } from '@/lib/utils';

// Tipos
interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

// Sugestões de Prompts para a IA
const QUICK_PROMPTS = [
  "Liberar segunda e quarta das 09h às 12h",
  "Disponível dias 15, 16 e 17 à tarde",
  "Bloquear sexta-feira o dia todo",
  "Agenda livre semana que vem horário comercial"
];

export default function AgendaPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados IA
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Estados Manual
  const [manualDate, setManualDate] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Fetch Inicial
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/schedule/my-slots');
      if (res.ok) {
        setSlots(await res.json());
      }
    } catch (error) {
      toast.error("Erro ao carregar agenda.");
    } finally {
      setIsLoading(false);
    }
  };

  // Ação da IA
  const handleAIAction = async (mode: 'add' | 'remove') => {
    if (!instructions.trim()) {
      toast.error("Digite uma instrução para a IA.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Processando com Inteligência Artificial...");

    try {
      const res = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions, mode }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro na IA');

      toast.success(mode === 'add' 
        ? `${data.count} horários gerados com sucesso!` 
        : "Agenda atualizada conforme solicitado!", { id: toastId });
      
      setInstructions('');
      fetchSlots();
    } catch (error) {
      toast.error("Falha ao processar comando.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  // Ação Manual
  const handleManualAdd = async () => {
    if (!manualDate || !manualStart || !manualEnd) {
      toast.error("Preencha data, início e fim.");
      return;
    }

    setIsSavingManual(true);
    try {
      const res = await fetch('/api/schedule/my-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            date: manualDate, 
            startTime: manualStart, 
            endTime: manualEnd 
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Horário adicionado manualmente!");
      fetchSlots();
    } catch (error) {
      toast.error("Erro ao adicionar horário.");
    } finally {
      setIsSavingManual(false);
    }
  };

  // Deletar Slot
  const handleDeleteSlot = async (id: string) => {
    // Optimistic Update
    const previousSlots = [...slots];
    setSlots(slots.filter(s => s.id !== id));

    try {
      const res = await fetch(`/api/schedule/my-slots?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success("Horário removido.");
    } catch (error) {
      setSlots(previousSlots); // Reverte
      toast.error("Erro ao remover.");
    }
  };

  // Agrupamento e Ordenação
  const groupedSlots = slots.reduce((acc, slot) => {
    const dateObj = new Date(slot.startTime);
    // Formato: "Sexta-feira, 29/11"
    const dateKey = dateObj.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: '2-digit',
        timeZone: 'UTC' 
    });
    
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  // Ordenar as chaves (datas) cronologicamente seria ideal, mas como as chaves são strings formatadas,
  // confiamos que a API já traga ordenado ou a iteração respeite a ordem de inserção se a API ordenar.
  // (Para produção robusta, agruparia por timestamp e formataria apenas na view).

  return (
    <div className="container mx-auto py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                    <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                Gestão de Agenda
            </h1>
            <p className="text-muted-foreground mt-2 ml-1 max-w-xl">
                Gerencie sua disponibilidade para o Davi oferecer aos leads. Use a IA para criar múltiplos horários de uma vez.
            </p>
        </div>
        
        {/* Stats Rápidos */}
        <div className="flex gap-3">
            <div className="bg-card border rounded-lg px-4 py-2 text-center shadow-sm">
                <span className="text-2xl font-bold text-primary">{slots.filter(s => !s.isBooked).length}</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Livres</p>
            </div>
            <div className="bg-card border rounded-lg px-4 py-2 text-center shadow-sm">
                <span className="text-2xl font-bold text-purple-600">{slots.filter(s => s.isBooked).length}</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Agendados</p>
            </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* --- COLUNA ESQUERDA: CONTROLES --- */}
        <div className="lg:col-span-5 space-y-6">
            <Card className="border-t-4 border-t-primary shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        Configurar Disponibilidade
                    </CardTitle>
                    <CardDescription>Escolha o método de entrada.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="ai" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
                            <TabsTrigger value="ai" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                                Inteligência Artificial
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                <Plus className="w-4 h-4 mr-2 text-blue-500" />
                                Manual
                            </TabsTrigger>
                        </TabsList>

                        {/* ABA IA */}
                        <TabsContent value="ai" className="space-y-4 mt-0">
                            <div className="relative">
                                <div className="absolute top-3 left-3">
                                    <Bot className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                                <Textarea
                                    placeholder="Ex: Estou disponível toda terça e quinta das 14h às 18h.&#10;Ex: Libere a manhã do dia 25/12."
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    className="min-h-[140px] pl-10 resize-none bg-muted/20 focus:bg-background transition-colors text-base"
                                />
                            </div>
                            
                            {/* Chips de Sugestão */}
                            <div className="flex flex-wrap gap-2">
                                {QUICK_PROMPTS.map((prompt, i) => (
                                    <Badge 
                                        key={i} 
                                        variant="secondary" 
                                        className="cursor-pointer hover:bg-primary/10 transition-colors font-normal text-xs py-1"
                                        onClick={() => setInstructions(prompt)}
                                    >
                                        {prompt}
                                    </Badge>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <ShinyButton 
                                    onClick={() => handleAIAction('add')} 
                                    disabled={isGenerating}
                                    className="w-full"
                                    icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                >
                                    {isGenerating ? "Processando..." : "Gerar Horários com IA"}
                                </ShinyButton>
                                
                                <Button 
                                    onClick={() => handleAIAction('remove')} 
                                    disabled={isGenerating} 
                                    variant="outline"
                                    className="w-full text-destructive hover:bg-destructive/10 border-destructive/30"
                                >
                                    Bloquear / Remover Horários
                                </Button>
                            </div>
                        </TabsContent>

                        {/* ABA MANUAL */}
                        <TabsContent value="manual" className="space-y-5 mt-0">
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                                <div className="space-y-2">
                                    <Label>Data Específica</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            type="date" 
                                            className="pl-9"
                                            value={manualDate} 
                                            onChange={(e) => setManualDate(e.target.value)} 
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Início</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="time" 
                                                className="pl-9"
                                                value={manualStart} 
                                                onChange={(e) => setManualStart(e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fim</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="time" 
                                                className="pl-9"
                                                value={manualEnd} 
                                                onChange={(e) => setManualEnd(e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={handleManualAdd} 
                                disabled={isSavingManual} 
                                className="w-full"
                            >
                                {isSavingManual ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Adicionar Slot Manualmente
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>

        {/* --- COLUNA DIREITA: GRID DE SLOT --- */}
        <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    Calendário de Disponibilidade
                </h3>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>

            {slots.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/10 text-muted-foreground">
                    <div className="p-4 bg-muted/30 rounded-full mb-4">
                        <AlertCircle className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">Sua agenda está vazia.</p>
                    <p className="text-sm mt-1">Use a IA ao lado para gerar horários rapidamente.</p>
                </div>
            ) : (
                <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 pb-10 scrollbar-thin">
                    <AnimatePresence>
                        {Object.entries(groupedSlots).map(([date, daySlots], index) => (
                            <motion.div 
                                key={date}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="space-y-3"
                            >
                                <div className="sticky top-0 z-10 flex items-center gap-4 bg-background/95 backdrop-blur py-2">
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="text-sm font-semibold text-foreground bg-muted/30 px-3 py-1 rounded-full border">
                                        {date}
                                    </span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {daySlots.map((slot) => (
                                        <motion.div
                                            key={slot.id}
                                            layout
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.9, opacity: 0 }}
                                            className={cn(
                                                "relative group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                                                slot.isBooked 
                                                    ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50" 
                                                    : "bg-card hover:bg-accent/50 hover:border-primary/30 hover:shadow-sm"
                                            )}
                                        >
                                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                                {slot.isBooked ? "Ocupado" : "Livre"}
                                            </div>
                                            <div className={cn(
                                                "text-sm font-bold font-mono tracking-tight",
                                                slot.isBooked ? "text-red-700 dark:text-red-400" : "text-foreground"
                                            )}>
                                                {/* TIMEZONE UTC FORÇADO PARA VISUALIZAÇÃO */}
                                                {new Date(slot.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                                                <span className="mx-1 text-muted-foreground/50">-</span>
                                                {new Date(slot.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                                            </div>

                                            {/* Botão de Deletar (Só aparece no Hover) */}
                                            {!slot.isBooked && (
                                                <button
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                    className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                                    title="Remover horário"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}