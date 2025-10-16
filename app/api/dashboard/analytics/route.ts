// app/api/dashboard/analytics/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, LeadStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const leads = await prisma.lead.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    // 1. DADOS PARA GRÁFICO DE LINHA: Leads ao longo do tempo
    const leadsOverTime = leads.reduce((acc, lead) => {
      const date = lead.createdAt.toISOString().split('T')[0]; // Agrupa por dia
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leadsOverTimeData = Object.entries(leadsOverTime).map(([name, value]) => ({ name, value }));

    // 2. DADOS PARA GRÁFICO DE PIZZA: Distribuição de status (Funil)
    const statusDistribution = Object.values(LeadStatus).reduce((acc, status) => {
        acc[status] = 0; // Inicializa todos os status com 0
        return acc;
    }, {} as Record<string, number>);
    
    leads.forEach(lead => {
        statusDistribution[lead.status]++;
    });

    const statusDistributionData = Object.entries(statusDistribution)
      .map(([name, value]) => ({ name: name.replace('_', ' '), value }))
      .filter(item => item.value > 0); // Mostra apenas status que têm leads

    // 3. DADOS PARA GRÁFICOS DE BARRAS (já existentes)
    const countOccurrences = (arr: (string | null)[]) => arr.reduce((acc, v) => v ? (acc[v] = (acc[v] || 0) + 1, acc) : acc, {} as Record<string, number>);
    
    const produtosData = Object.entries(countOccurrences(leads.map(l => l.produtoDeInteresse))).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const atividadesData = Object.entries(countOccurrences(leads.map(l => l.atividadePrincipal))).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return NextResponse.json({
      leadsOverTimeData,
      statusDistributionData,
      produtosData,
      atividadesData,
    });

  } catch (error) {
    console.error("Erro ao buscar dados para análise:", error);
    return NextResponse.json({ error: 'Ocorreu um erro ao processar os dados.' }, { status: 500 });
  }
}