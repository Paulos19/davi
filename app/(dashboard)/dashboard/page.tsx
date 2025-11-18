import { getDashboardOverview } from '@/lib/data'; // Vamos manter a importação, mas usar fetch no client ou atualizar a lib se preferir Server Component puro. 
// Para simplificar e usar os dados atualizados da API que acabamos de criar, vamos transformar em Client Component ou fazer o fetch direto aqui se for Server Component.
// MANTENDO SERVER COMPONENT (Ideal do Next.js):

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { AnimatedBorderCard } from '@/components/ui/animated-border-card';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função auxiliar para buscar dados (Server-side)
async function getData(userId: string) {
  const totalLeads = await prisma.lead.count({ where: { userId } });
  const leadsVip = await prisma.lead.count({ where: { userId, segmentacao: 'GRANDE' } });
  const leadsMedio = await prisma.lead.count({ where: { userId, segmentacao: 'MEDIO' } });
  
  const agendamentos = await prisma.agendamento.count({ 
    where: { userId, status: 'PENDENTE' } 
  });

  // Próximos agendamentos para a lista
  const nextAppointments = await prisma.agendamento.findMany({
    where: { userId, status: 'PENDENTE' },
    include: { lead: true },
    orderBy: { dataHora: 'asc' },
    take: 3
  });

  return {
    stats: { totalLeads, leadsVip, leadsMedio, agendamentos },
    nextAppointments
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { stats, nextAppointments } = await getData(session.user.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
      </div>

      {/* --- CARDS DE KPI (FOCADOS EM QUALIDADE) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Agenda (Prioridade Máxima) */}
        <AnimatedBorderCard
          title="Reuniões Pendentes"
          value={stats.agendamentos}
          description="Agendamentos confirmados pela IA"
          iconName="Calendar"
          href="/dashboard/agenda" // Futura página de agenda
        />
        
        {/* Card 2: Pipeline VIP (Tier 4) */}
        <AnimatedBorderCard
          title="Leads VIP (>100k)"
          value={stats.leadsVip}
          description="Requer atenção do Rodrigo"
          iconName="DollarSign"
          href="/dashboard/leads?segmentacao=GRANDE"
        />

        {/* Card 3: Pipeline Médio (Tier 3) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestão (30k-100k)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadsMedio}</div>
            <p className="text-xs text-muted-foreground">Potenciais clientes de consultoria</p>
          </CardContent>
        </Card>

        {/* Card 4: Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Volume total capturado</p>
          </CardContent>
        </Card>
      </div>

      {/* --- SEÇÃO DE AGENDA E ATALHOS --- */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Lista de Próximas Reuniões (Ocupa 4 colunas) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Próximas Reuniões</CardTitle>
            <CardDescription>
              Agendamentos realizados pela IA aguardando atendimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {nextAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma reunião agendada.</p>
              ) : (
                nextAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {new Date(apt.dataHora).getDate()}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {apt.lead.nome} 
                        <Badge variant={apt.tipo === 'BPO_PREMIUM' ? 'default' : 'secondary'} className="ml-2 text-[10px]">
                           {apt.tipo === 'BPO_PREMIUM' ? 'VIP' : 'GESTÃO'}
                        </Badge>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(apt.dataHora).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                        <Link href={`/dashboard/leads/${apt.leadId}`}>
                            <Button size="sm" variant="outline">Ver Lead</Button>
                        </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Atalhos Rápidos (Ocupa 3 colunas) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Gerencie sua operação.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/dashboard/leads?segmentacao=PEQUENO">
                <Button variant="outline" className="w-full justify-between">
                    <span>Ver Vendas de Produtos</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Tier 2</span>
                </Button>
            </Link>
            <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full justify-between">
                    <span>Análise de Segmentação</span>
                    <TrendingUp className="h-4 w-4" />
                </Button>
            </Link>
            <Link href="/dashboard/export">
                <Button variant="secondary" className="w-full">
                    Exportar Relatório Completo
                </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}