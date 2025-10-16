// app/(dashboard)/dashboard/page.tsx

import { getDashboardOverview } from '@/lib/data';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Percent, ArrowRight } from 'lucide-react';
import { AnimatedBorderCard } from '@/components/ui/animated-border-card';

// Certifique-se de que o componente Avatar foi adicionado ao seu projeto:
// npx shadcn-ui@latest add avatar

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Busca os dados de visão geral diretamente do servidor
  const { stats, recentLeads } = await getDashboardOverview(session.user.id);

  return (
    <div className="space-y-8">
      {/* Secção de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnimatedBorderCard
          title="Leads Entrantes"
          value={stats.totalLeads}
          description="Total de contatos iniciados"
          iconName="Users" // Passando o nome do ícone como string
          href="/dashboard/leads"
        />
        <AnimatedBorderCard
          title="Leads Qualificados"
          value={stats.leadsQualificados}
          description="Leads que completaram o fluxo"
          iconName="CheckCircle" // Passando o nome do ícone como string
          href="/dashboard/leads?status=QUALIFICADO"
        />
        <AnimatedBorderCard
          title="Vendas Realizadas"
          value={stats.vendasRealizadas}
          description="Conversões bem-sucedidas"
          iconName="DollarSign" // Passando o nome do ícone como string
          href="/dashboard/leads?status=VENDA_REALIZADA"
        />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.conversao}</div>
                <p className="text-xs text-muted-foreground">De lead entrante para venda</p>
            </CardContent>
        </Card>
      </div>

      {/* Secção de Atalhos e Leads Recentes */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Card de Leads Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leads Recentes</CardTitle>
              <CardDescription>
                Os últimos 5 leads que entraram em contato.
              </CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/leads">
                Ver todos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.length > 0 ? (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{lead.nome.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{lead.nome}</p>
                      <p className="text-sm text-muted-foreground">{lead.contato}</p>
                    </div>
                    <div className="ml-auto font-medium">
                      <Badge variant="outline">{lead.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ainda não há leads recentes.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Atalhos */}
        <Card>
          <CardHeader>
            <CardTitle>Atalhos</CardTitle>
            <CardDescription>Aceda rapidamente às principais áreas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/dashboard/analytics" className="w-full">
                <Button variant="outline" className="w-full justify-start">Ver Análises</Button>
            </Link>
            <Link href="/dashboard/export" className="w-full">
                <Button variant="outline" className="w-full justify-start">Exportar Dados</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}