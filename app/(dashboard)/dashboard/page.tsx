import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  ArrowUpRight, Calendar, Users, TrendingUp, 
  Clock, Briefcase, Plus, Phone, MessageSquare
} from 'lucide-react';
import { StatsCard } from '@/components/ui/stats-card';
// Importe o novo componente
import { GenerateReportButton } from '@/components/Dashboard/generate-report-button';

const prisma = new PrismaClient();

// ... (Mantenha a função getDashboardData exatamente como estava) ...
async function getDashboardData(userId: string) {
  const now = new Date();

  const [totalLeads, leadsVip, leadsQualificados] = await Promise.all([
    prisma.lead.count({ where: { userId } }),
    prisma.lead.count({ where: { userId, segmentacao: 'GRANDE' } }),
    prisma.lead.count({ where: { userId, status: { not: 'ENTRANTE' } } }),
  ]);

  const totalFutureSlots = await prisma.availabilitySlot.count({
    where: { userId, startTime: { gte: now } }
  });
  
  const bookedFutureSlots = await prisma.availabilitySlot.count({
    where: { userId, startTime: { gte: now }, isBooked: true }
  });

  const occupancyRate = totalFutureSlots > 0 
    ? Math.round((bookedFutureSlots / totalFutureSlots) * 100) 
    : 0;

  const nextAppointments = await prisma.agendamento.findMany({
    where: { 
      userId, 
      dataHora: { gte: now },
    },
    include: { lead: true },
    orderBy: { dataHora: 'asc' },
    take: 4
  });

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
  const firstName = session.user.name?.split(' ')[0] || 'Especialista';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-background border border-primary/5">
         <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Olá, {firstName} 👋
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Você tem <span className="font-semibold text-foreground">{kpis.bookedFutureSlots} reuniões</span> confirmadas para os próximos dias. Sua taxa de ocupação está em <span className="text-green-600 font-medium">{kpis.occupancyRate}%</span>.
            </p>
         </div>
         <div className="flex flex-wrap gap-3">
            {/* NOVO: Usando o botão com funcionalidade */}
            <GenerateReportButton />
            
            <Link href="/dashboard/agenda">
              <Button variant="outline" className="shadow-sm hover:bg-muted/80">
                <Calendar className="mr-2 h-4 w-4" /> Gerenciar Agenda
              </Button>
            </Link>
         </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ocupação da Agenda"
          value={`${kpis.occupancyRate}%`}
          description="Baseado nos horários abertos"
          icon={<Calendar className="h-4 w-4" />}
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        <StatsCard
          title="Pipeline VIP (+100k)"
          value={kpis.leadsVip}
          description="Oportunidades de alto valor"
          icon={<Briefcase className="h-4 w-4" />}
          trend="neutral"
          trendValue="Estável"
          color="purple"
        />
        <StatsCard
          title="Taxa de Qualificação"
          value={`${kpis.conversionRate}%`}
          description="Leads qualificados pelo Bot"
          icon={<TrendingUp className="h-4 w-4" />}
          trend="up"
          trendValue="+5%"
          color="green"
        />
        <StatsCard
          title="Total de Leads"
          value={kpis.totalLeads}
          description="Base de contatos total"
          icon={<Users className="h-4 w-4" />}
          color="orange"
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7 h-full">
        
        {/* Left Column: Appointments */}
        <div className="col-span-7 lg:col-span-4 flex flex-col gap-6">
          <Card className="flex-1 shadow-md border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Próximas Reuniões
                </CardTitle>
                <CardDescription>Agenda confirmada pelo Davi.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">Ver todas</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nextAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <div className="p-3 bg-muted rounded-full mb-3">
                      <Calendar className="h-6 w-6 opacity-50" />
                    </div>
                    <p>Sua agenda está livre.</p>
                    <p className="text-xs mt-1">Use a IA para abrir novos horários.</p>
                  </div>
                ) : (
                  nextAppointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="group flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                    >
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center min-w-[52px] h-[52px] rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          {new Date(apt.dataHora).toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')}
                        </span>
                        <span className="text-xl font-bold text-foreground leading-none">
                          {new Date(apt.dataHora).getUTCDate()}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold truncate flex items-center gap-2">
                            {apt.lead.nome}
                            {apt.tipo === 'BPO_PREMIUM' && (
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">VIP</Badge>
                            )}
                          </p>
                          <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                            {new Date(apt.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {apt.tipo.replace('_', ' ').toLowerCase()}
                          </span>
                          {apt.resumo && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]" title={apt.resumo}>
                              <MessageSquare className="h-3 w-3" /> "{apt.resumo}"
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Link href={`/dashboard/leads/${apt.leadId}`}>
                         <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                           <ArrowUpRight className="h-4 w-4" />
                         </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Leads & Actions */}
        <div className="col-span-7 lg:col-span-3 flex flex-col gap-6">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/leads" className="col-span-1">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed border-2 shadow-none hover:shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center p-4 py-6 gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full text-blue-600">
                            <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">Novo Lead</span>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/dashboard/agenda" className="col-span-1">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed border-2 shadow-none hover:shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center p-4 py-6 gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">Bloquear Data</span>
                    </CardContent>
                </Card>
            </Link>
          </div>

          <Card className="flex-1 shadow-md border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Feed de Entrada
              </CardTitle>
              <CardDescription>Últimos leads qualificados.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white shadow-sm ${
                          lead.status === 'VENDA_REALIZADA' ? 'bg-green-500' : 
                          lead.status === 'PERDIDO' ? 'bg-red-500' : 
                          lead.segmentacao === 'GRANDE' ? 'bg-purple-500' : 'bg-blue-500'
                      }`}>
                        {lead.nome.charAt(0).toUpperCase()}
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-background rounded-full flex items-center justify-center">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                lead.status === 'VENDA_REALIZADA' ? 'bg-green-500' : 'bg-blue-500'
                            }`} />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{lead.nome}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{lead.segmentacao ? lead.segmentacao.toLowerCase() : 'novo'}</span>
                            <span className="text-[10px]">•</span>
                            <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-normal h-5">
                        {lead.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <Link href="/dashboard/leads">
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground">
                        Ver todos os leads <ArrowUpRight className="ml-2 h-3 w-3" />
                    </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}