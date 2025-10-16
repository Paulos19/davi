// app/(dashboard)/dashboard/leads/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
// 1. Importar useParams
import { notFound, useRouter, useParams } from 'next/navigation';
import { Lead, LeadStatus } from '@prisma/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, MessageSquare, Loader2, Phone, Briefcase, Target, Calendar, DollarSign, Wallet, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';


// Helper para limpar o número de telefone para o link wa.me
const cleanPhoneNumber = (phone: string) => {
  return phone.replace(/[^0-9]/g, '');
};

// 2. Remover 'params' das props da função
export default function LeadDetailPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // 3. Usar o hook para obter os parâmetros da URL
  const params = useParams();
  const leadId = params.id as string; // Pegamos o ID daqui

  useEffect(() => {
    // Garantir que temos um ID antes de buscar
    if (!leadId) return;

    const fetchLead = async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}`);
        if (!response.ok) {
          throw new Error('Lead não encontrado');
        }
        const data = await response.json();
        setLead(data);
      } catch (error) {
        console.error(error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    fetchLead();
  }, [leadId]); // 4. Usar leadId na dependência do useEffect

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar status');

      const updatedLead = await response.json();
      setLead(updatedLead);
      toast.success(`Status alterado para "${newStatus.replace('_', ' ')}"`);
    } catch (error) {
      toast.error('Ocorreu um erro ao alterar o status.');
    }
  };

  // O resto do seu JSX permanece exatamente o mesmo...
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!lead) {
    return notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Coluna da Esquerda: Informações e Ações */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{lead.nome}</CardTitle>
            <CardDescription>
              Entrou em {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`https://wa.me/${cleanPhoneNumber(lead.contato)}`} target="_blank" className="w-full">
              <Button className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" /> Ir para WhatsApp
              </Button>
            </Link>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Alterar Status</Label>
              <Select value={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LeadStatus).map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Detalhes do Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <InfoItem icon={Phone} label="Contato" value={lead.contato} />
                <InfoItem icon={Briefcase} label="Produto de Interesse" value={lead.produtoDeInteresse} />
                <InfoItem icon={Target} label="Necessidade Principal" value={lead.necessidadePrincipal} />
                <InfoItem icon={Wallet} label="Orçamento" value={lead.orcamento} />
                <InfoItem icon={Calendar} label="Prazo" value={lead.prazo} />
                <InfoItem icon={DollarSign} label="Faturamento Estimado" value={lead.faturamentoEstimado} />
            </CardContent>
        </Card>
      </div>

      {/* Coluna da Direita: Contexto e Histórico */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Conversa (Análise de IA)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {lead.resumoDaConversa || 'Nenhum resumo gerado.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico da Conversa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm max-h-[60vh] overflow-y-auto">
            {lead.historicoCompleto && Array.isArray(lead.historicoCompleto) ? (
              lead.historicoCompleto.map((msg: any, index: number) => (
                <div key={index} className={cn('flex items-start gap-3', msg.role === 'user' ? '' : 'justify-end')}>
                  {msg.role === 'user' && <Badge variant="secondary">Cliente</Badge>}
                  <div className={cn('max-w-[75%] rounded-lg p-3', msg.role === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                    {msg.content}
                  </div>
                  {msg.role !== 'user' && <Badge>Davi</Badge>}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Histórico não disponível.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente auxiliar
function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon, label: string; value: string | null | undefined }) {
    return (
      <div className="flex items-center">
        <Icon className="h-4 w-4 text-muted-foreground mr-3" />
        <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="font-semibold text-sm">{value || '-'}</span>
        </div>
      </div>
    );
}