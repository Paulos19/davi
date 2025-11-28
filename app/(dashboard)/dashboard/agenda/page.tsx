'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Importando Tabs
import { toast } from 'sonner';
import { Loader2, Sparkles, Trash2, Calendar as CalendarIcon, Clock, PlusCircle } from 'lucide-react';

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export default function AgendaPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para IA
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Estados para Manual
  const [manualDate, setManualDate] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

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

  // Handler: IA
  const handleAIAction = async (mode: 'add' | 'remove') => {
    if (!instructions.trim()) {
      toast.error("Digite uma instrução para a IA.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions, mode }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro na IA');

      toast.success(mode === 'add' 
        ? `${data.count} horários adicionados!` 
        : "Agenda atualizada com bloqueios!");
      
      setInstructions('');
      fetchSlots();
    } catch (error) {
      toast.error("Falha ao processar com IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Manual
  const handleManualAdd = async () => {
    if (!manualDate || !manualStart || !manualEnd) {
      toast.error("Preencha data e horários.");
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
      // Limpar campos
      setManualStart('');
      setManualEnd('');
      fetchSlots();
    } catch (error) {
      toast.error("Erro ao adicionar horário.");
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await fetch(`/api/schedule/my-slots?id=${id}`, { method: 'DELETE' });
      setSlots(slots.filter(s => s.id !== id));
      toast.success("Horário removido.");
    } catch (error) {
      toast.error("Erro ao remover.");
    }
  };

  // Agrupamento por dia
  const groupedSlots = slots.reduce((acc, slot) => {
    const date = new Date(slot.startTime).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  return (
    <div className="space-y-6 container mx-auto py-10 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Agenda</h1>
          <p className="text-muted-foreground">Gerencie seus horários disponíveis para o Davi oferecer aos leads.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        
        {/* COLUNA 1: Controles (Ocupa 5 colunas) */}
        <div className="md:col-span-5">
            <Card className="h-full">
            <CardHeader>
                <CardTitle>Adicionar Disponibilidade</CardTitle>
                <CardDescription>Escolha como deseja configurar sua agenda.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="ai" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="ai">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Com IA
                        </TabsTrigger>
                        <TabsTrigger value="manual">
                            <Clock className="w-4 h-4 mr-2" />
                            Manual
                        </TabsTrigger>
                    </TabsList>

                    {/* ABA: INTELIGÊNCIA ARTIFICIAL */}
                    <TabsContent value="ai" className="space-y-4">
                        <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground mb-2">
                            <p>Escreva naturalmente. A IA detecta datas e recorrências.</p>
                        </div>
                        <Textarea
                            placeholder="Ex: Estou disponível toda segunda e quarta das 09h às 12h.&#10;Ou: Vou tirar férias do dia 15 ao dia 20, bloqueie esses dias."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="min-h-[150px] resize-none"
                        />
                        <div className="flex flex-col gap-2">
                            <Button 
                                onClick={() => handleAIAction('add')} 
                                disabled={isGenerating} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Gerar Horários Disponíveis"}
                            </Button>
                            <Button 
                                onClick={() => handleAIAction('remove')} 
                                disabled={isGenerating} 
                                variant="outline"
                                className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Bloquear Dias/Horários"}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ABA: MANUAL */}
                    <TabsContent value="manual" className="space-y-4">
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label>Data</Label>
                                <Input 
                                    type="date" 
                                    value={manualDate} 
                                    onChange={(e) => setManualDate(e.target.value)} 
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Início</Label>
                                    <Input 
                                        type="time" 
                                        value={manualStart} 
                                        onChange={(e) => setManualStart(e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Fim</Label>
                                    <Input 
                                        type="time" 
                                        value={manualEnd} 
                                        onChange={(e) => setManualEnd(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <Button 
                                onClick={handleManualAdd} 
                                disabled={isSavingManual} 
                                className="w-full mt-4"
                            >
                                {isSavingManual ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                                Adicionar Slot
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
            </Card>
        </div>

        {/* COLUNA 2: Visualização da Agenda (Ocupa 7 colunas) */}
        <div className="md:col-span-7">
            <Card className="h-full min-h-[500px]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Próximos Horários Livres
                    </CardTitle>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {slots.filter(s => !s.isBooked).length} vagas
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : slots.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg flex flex-col items-center gap-2">
                    <CalendarIcon className="h-10 w-10 opacity-20" />
                    <p>Nenhum horário disponível.</p>
                    <p className="text-xs">Use a IA ou o modo manual para abrir sua agenda.</p>
                </div>
                ) : (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                    {Object.entries(groupedSlots).map(([date, daySlots]) => (
                    <div key={date} className="space-y-2">
                        <h3 className="font-semibold text-sm bg-muted/50 p-2 rounded-md capitalize sticky top-0 backdrop-blur-sm z-10 border border-border/50">
                        {date}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {daySlots.map((slot) => (
                            <div 
                            key={slot.id} 
                            className={`flex flex-col p-2 rounded border text-xs relative group transition-all ${
                                slot.isBooked 
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 opacity-60' 
                                : 'bg-card hover:border-primary/50 hover:shadow-sm'
                            }`}
                            >
                            <div className="flex items-center gap-2 font-mono text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {new Date(slot.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                <span className="text-muted-foreground">-</span>
                                {new Date(slot.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            
                            {slot.isBooked ? (
                                <span className="mt-1 w-full text-center text-[10px] bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-1 rounded font-medium">
                                    Ocupado
                                </span>
                            ) : (
                                <span className="mt-1 w-full text-center text-[10px] text-green-600 dark:text-green-400 font-medium">
                                    Livre
                                </span>
                            )}

                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-6 w-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-sm"
                                onClick={() => handleDeleteSlot(slot.id)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                            </div>
                        ))}
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}