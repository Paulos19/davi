// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AnimatedBorderCard } from '@/components/ui/animated-border-card';
import { Users, CheckCircle, Handshake, DollarSign, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Stats {
  totalLeads: number;
  leadsQualificados: number;
  leadsAtendidos: number;
  vendasRealizadas: number;
  conversao: string;
}

// Componente de esqueleto para o estado de carregamento
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="h-5 w-3/4 bg-muted rounded-md animate-pulse mb-2"></div>
        <div className="h-8 w-1/2 bg-muted rounded-md animate-pulse"></div>
        <div className="h-4 w-full bg-muted rounded-md animate-pulse mt-1"></div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Falha ao buscar dados');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <AnimatedBorderCard
        title="Leads Entrantes"
        value={stats?.totalLeads ?? 0}
        description="Total de contatos iniciados"
        icon={Users}
        href="/dashboard/leads"
      />
      <AnimatedBorderCard
        title="Leads Qualificados"
        value={stats?.leadsQualificados ?? 0}
        description="Leads que completaram o fluxo"
        icon={CheckCircle}
        href="/dashboard/leads?status=QUALIFICADO"
      />
      <AnimatedBorderCard
        title="Leads Atendidos"
        value={stats?.leadsAtendidos ?? 0}
        description="Leads contactados pelo especialista"
        icon={Handshake}
        href="/dashboard/leads?status=ATENDIDO"
      />
      <AnimatedBorderCard
        title="Vendas Realizadas"
        value={stats?.vendasRealizadas ?? 0}
        description="Conversões bem-sucedidas"
        icon={DollarSign}
        href="/dashboard/leads?status=VENDA_REALIZADA"
      />
       {/* Card especial para conversão */}
       <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between pb-2">
                <h3 className="text-sm font-medium">Taxa de Conversão</h3>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats?.conversao ?? '0.0%'}</div>
              <p className="text-xs text-muted-foreground">De lead entrante para venda</p>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}