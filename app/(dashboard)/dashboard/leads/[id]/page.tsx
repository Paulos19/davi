'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Lead, LeadStatus } from '@prisma/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MessageCircle, Phone, Calendar, 
  DollarSign, Tag, Clock, CheckCircle2, 
  AlertCircle, Bot, User, Briefcase, 
  MoreVertical, Copy, ExternalLink,
  Send
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShinyButton } from '@/components/ui/shiny-button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mapeamento de Estilos
const statusColors: Record<string, string> = {
  ENTRANTE: "bg-blue-100 text-blue-700 border-blue-200",
  QUALIFICADO: "bg-purple-100 text-purple-700 border-purple-200",
  ATENDIDO: "bg-yellow-100 text-yellow-700 border-yellow-200",
  VENDA_REALIZADA: "bg-green-100 text-green-700 border-green-200",
  PERDIDO: "bg-red-100 text-red-700 border-red-200",
};

const segmentColors: Record<string, string> = {
  GRANDE: "text-purple-600 bg-purple-50 border-purple-200",
  MEDIO: "text-blue-600 bg-blue-50 border-blue-200",
  PEQUENO: "text-slate-600 bg-slate-50 border-slate-200",
  DESQUALIFICADO: "text-red-600 bg-red-50 border-red-200",
};

export default function LeadDetailPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  useEffect(() => {
    if (!leadId) return;
    const fetchLead = async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}`);
        if (!response.ok) throw new Error('Lead não encontrado');
        setLead(await response.json());
      } catch (error) {
        console.error(error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    fetchLead();
  }, [leadId]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    // Otimistic Update
    const oldStatus = lead.status;
    setLead({ ...lead, status: newStatus });

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error();
      toast.success(`Status atualizado para ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      setLead({ ...lead, status: oldStatus }); // Reverte em caso de erro
      toast.error('Erro ao atualizar status.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Carregando dossiê do lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) return notFound();

  // Tratamento seguro do histórico
  const history = Array.isArray(lead.historicoCompleto) ? lead.historicoCompleto : [];
  const initials = lead.nome.slice(0, 2).toUpperCase();
  const cleanPhone = lead.contato.replace(/\D/g, '');

  return (
    <div className="container mx-auto py-6 max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- HEADER DE NAVEGAÇÃO E AÇÕES --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold flex items-center gap-2">
              {lead.nome}
              <Badge variant="outline" className={cn("text-[10px]", segmentColors[lead.segmentacao || 'PEQUENO'])}>
                {lead.segmentacao || 'N/A'}
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              ID: <span className="font-mono">{lead.id.slice(-6)}</span> • Criado em {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           {/* Seletor de Status Moderno */}
           <div className="relative">
              <Select value={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger className={cn("w-[180px] font-medium border-2", statusColors[lead.status])}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LeadStatus).map(s => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", s === 'VENDA_REALIZADA' ? "bg-green-500" : "bg-slate-400")} />
                        {s.replace('_', ' ')}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>

           {/* Botão de Ação Principal */}
           <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer">
             <ShinyButton icon={<MessageCircle className="w-4 h-4"/>}>
               Abrir WhatsApp
             </ShinyButton>
           </a>

           {/* Menu de Mais Ações */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="outline" size="icon">
                 <MoreVertical className="h-4 w-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={() => copyToClipboard(lead.contato)}>
                 <Copy className="mr-2 h-4 w-4" /> Copiar Telefone
               </DropdownMenuItem>
               <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                 Deletar Lead
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      <Separator />

      {/* --- GRID DE CONTEÚDO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* COLUNA ESQUERDA: DADOS E PERFIL */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Card de Perfil */}
          <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm">
            <CardHeader className="bg-muted/20 pb-8 pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3 border-4 border-background shadow-md">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{lead.nome}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" /> {lead.contato}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Faturamento Est.</p>
                  <div className="flex items-center gap-1 font-semibold">
                    <DollarSign className="h-3.5 w-3.5 text-green-600" />
                    {lead.faturamentoEstimado || '-'}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Segmento</p>
                  <div className="flex items-center gap-1 font-semibold">
                    <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                    {lead.atividadePrincipal || '-'}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><Tag className="h-3.5 w-3.5"/> Produto</span>
                  <span className="font-medium text-right">{lead.produtoDeInteresse || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5"/> Prazo</span>
                  <span className="font-medium text-right">{lead.prazo || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5"/> Entrada</span>
                  <span className="font-medium text-right">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de IA Insight (Resumo) - Movido para lateral para visibilidade constante */}
          <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 dark:border-indigo-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <SparklesIcon className="h-4 w-4" /> Análise da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                "{lead.resumoDaConversa || 'Ainda não há dados suficientes para uma análise completa.'}"
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-white/50 dark:bg-black/20 text-xs font-normal">
                  Classificação: {lead.classificacao || 'N/A'}
                </Badge>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* COLUNA DIREITA: TABS E HISTÓRICO */}
        <div className="lg:col-span-2 h-[calc(100vh-200px)] min-h-[500px] flex flex-col">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList className="w-full justify-start border-b rounded-none p-0 h-12 bg-transparent space-x-6">
              <TabsTrigger 
                value="chat" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3 pt-2 font-medium"
              >
                Histórico de Conversa
              </TabsTrigger>
              <TabsTrigger 
                value="raw" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3 pt-2 font-medium"
              >
                Dados Técnicos
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
                {/* ABA CHAT */}
                <TabsContent value="chat" className="h-full m-0 p-0 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
                        {history.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <MessageCircle className="h-12 w-12 mb-2" />
                                <p>Nenhum histórico de mensagem.</p>
                            </div>
                        ) : (
                            history.map((msg: any, index: number) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <motion.div 
                                        key={index} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn("flex w-full", isUser ? "justify-start" : "justify-end")}
                                    >
                                        <div className={cn(
                                            "flex max-w-[80%] gap-3",
                                            isUser ? "flex-row" : "flex-row-reverse"
                                        )}>
                                            <Avatar className="h-8 w-8 mt-1 border shadow-sm shrink-0">
                                                {isUser ? (
                                                    <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-600"><User className="h-4 w-4"/></AvatarFallback>
                                                ) : (
                                                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4"/></AvatarFallback>
                                                )}
                                            </Avatar>
                                            
                                            <div className={cn(
                                                "p-3 rounded-2xl text-sm shadow-sm",
                                                isUser 
                                                    ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none" 
                                                    : "bg-primary text-primary-foreground rounded-tr-none"
                                            )}>
                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <span className={cn(
                                                    "text-[10px] mt-1 block opacity-70",
                                                    isUser ? "text-right" : "text-left"
                                                )}>
                                                    {isUser ? 'Cliente' : 'Davi'}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                    {/* Fake Input Area (Visual Only - já que o bot é automático) */}
                    <div className="p-4 border-t bg-background flex gap-2 items-center">
                        <div className="flex-1 h-10 bg-muted/50 rounded-full px-4 flex items-center text-sm text-muted-foreground cursor-not-allowed">
                            Apenas o Davi pode responder neste canal...
                        </div>
                        <Button size="icon" disabled className="rounded-full h-10 w-10">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </TabsContent>

                {/* ABA DADOS RAW */}
                <TabsContent value="raw" className="h-full m-0 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
                            <pre className="text-xs text-green-400 font-mono">
                                {JSON.stringify(lead, null, 2)}
                            </pre>
                        </div>
                    </div>
                </TabsContent>
            </div>
          </Tabs>
        </div>

      </div>
    </div>
  );
}

// Ícone auxiliar
function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
        </svg>
    )
}