import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Briefcase,
  AlertCircle 
} from 'lucide-react';
import { AnimatedBorderCard } from '@/components/ui/animated-border-card';

const prisma = new PrismaClient();

// Função de busca de dados otimizada (Server-side)
async function getDashboardData(userId: string) {
  const now = new Date();

  // 1. Métricas de Leads
  const [totalLeads, leadsVip, leadsQualificados] = await Promise.all([
    prisma.lead.count({ where: { userId } }),
    prisma.lead.count({ where: { userId, segmentacao: 'GRANDE' } }),
    prisma.lead.count({ where: { userId, status: { not: 'ENTRANTE' } } }),
  ]);

  // 2. Métricas de Agenda (Saúde da Disponibilidade)
  const totalFutureSlots = await prisma.availabilitySlot.count({
    where: { userId, startTime: { gte: now } }
  });
  
  const bookedFutureSlots = await prisma.availabilitySlot.count({
    where: { userId, startTime: { gte: now }, isBooked: true }
  });

  const occupancyRate = totalFutureSlots > 0 
    ? Math.round((bookedFutureSlots / totalFutureSlots) * 100) 
    : 0;

  // 3. Próximos Agendamentos (Confirmados)
  const nextAppointments = await prisma.agendamento.findMany({
    where: { 
      userId, 
      dataHora: { gte: now },
    },
    include: { lead: true },
    orderBy: { dataHora: 'asc' },
    take: 5
  });

  // 4. Leads Recentes (Feed de Entrada)
  const recentLeads = await prisma.lead.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return {
    kpis: {
      totalLeads,
      leadsVip,
      conversionRate: totalLeads > 0 ? Math.round((leadsQualificados / totalLeads) * 100) : 0,
      occupancyRate,
      bookedFutureSlots
    },
    nextAppointments,
    recentLeads
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { kpis, nextAppointments, recentLeads } = await getDashboardData(session.user.id);

  return (
    <div className="space-y-8">
      {/* Cabeçalho com Data e Saudação */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
            <p className="text-muted-foreground">
              Bem-vindo de volta. Você tem <span className="font-semibold text-primary">{kpis.bookedFutureSlots} reuniões</span> agendadas para o futuro.
            </p>
         </div>
         <div className="flex gap-2">
            <Link href="/dashboard/agenda">
              <Button>
                <Calendar className="mr-2 h-4 w-4" /> Gerenciar Agenda
              </Button>
            </Link>
         </div>
      </div>

      {/* --- SEÇÃO 1: CARDS DE KPI (Alta Performance) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Ocupação da Agenda (Crítico para o Especialista) */}
        <AnimatedBorderCard
          title="Ocupação da Agenda"
          value={`${kpis.occupancyRate}%`}
          description={`${kpis.bookedFutureSlots} horários reservados`}
          iconName="Calendar" // Ícone de Calendário
          href="/dashboard/agenda"
        />
        
        {/* Card 2: Pipeline VIP (Dinheiro na Mesa) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline VIP (+ 100k)</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.leadsVip}</div>
            <p className="text-xs text-muted-foreground">Leads de alto valor em negociação</p>
          </CardContent>
        </Card>

        {/* Card 3: Taxa de Qualificação */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualificação da IA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Dos leads são qualificados</p>
          </CardContent>
        </Card>

        {/* Card 4: Volume Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Total de contatos capturados</p>
          </CardContent>
        </Card>
      </div>

      {/* --- SEÇÃO 2: PAINEL DE OPERAÇÃO (Listas Lado a Lado) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* LISTA 1: Próximas Reuniões (Ocupa 4 colunas) */}
        <Card className="col-span-4 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Próximas Reuniões
            </CardTitle>
            <CardDescription>
              Seus compromissos confirmados pelo Davi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {nextAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border-dashed border rounded-lg">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p>Nenhuma reunião agendada.</p>
                  <p className="text-xs">Verifique se sua agenda tem horários livres.</p>
                </div>
              ) : (
                nextAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-start justify-between group">
                    <div className="flex items-start gap-4">
                      {/* Data Box */}
                      <div className="flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded-lg bg-primary/5 border border-primary/10">
                        <span className="text-xs font-bold text-primary uppercase">
                          {/* CORREÇÃO DE FUSO: timeZone: 'UTC' */}
                          {new Date(apt.dataHora).toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')}
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          {/* CORREÇÃO DE FUSO: getUTCDate() em vez de getDate() */}
                          {new Date(apt.dataHora).getUTCDate()}
                        </span>
                      </div>
                      
                      {/* Detalhes */}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-none flex items-center gap-2">
                          {apt.lead.nome}
                          {apt.tipo === 'BPO_PREMIUM' && (
                            <Badge variant="default" className="text-[10px] h-5 px-1.5 bg-purple-600 hover:bg-purple-700">VIP</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {/* CORREÇÃO DE FUSO: timeZone: 'UTC' */}
                          {new Date(apt.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                          <span className="mx-1">•</span>
                          <span className="capitalize">{apt.tipo.replace('_', ' ').toLowerCase()}</span>
                        </p>
                        {apt.resumo && (
                          <p className="text-xs text-muted-foreground line-clamp-1 italic">
                            "{apt.resumo}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Link href={`/dashboard/leads/${apt.leadId}`}>
                       <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                         Ver Lead <ArrowUpRight className="ml-2 h-3 w-3" />
                       </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* LISTA 2: Feed de Leads Recentes (Ocupa 3 colunas) */}
        <Card className="col-span-3 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Entrada Recente
            </CardTitle>
            <CardDescription>
              Últimos leads qualificados pelo bot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                        lead.status === 'VENDA_REALIZADA' ? 'bg-green-500' : 
                        lead.status === 'PERDIDO' ? 'bg-red-500' : 
                        lead.segmentacao === 'GRANDE' ? 'bg-purple-500' : 'bg-blue-500'
                    }`} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{lead.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.segmentacao ? lead.segmentacao.replace('_', ' ') : 'Não classificado'} • {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-[10px] font-normal">
                        {lead.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
              
              <div className="pt-4">
                <Link href="/dashboard/leads">
                    <Button variant="outline" className="w-full text-xs">
                        Ver Todos os Leads
                    </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}