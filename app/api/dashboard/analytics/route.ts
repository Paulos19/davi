import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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

    // 1. Leads ao longo do tempo (Crescimento)
    const leadsOverTime = leads.reduce((acc, lead) => {
      const date = lead.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Transforma em array acumulativo para gráfico de linha bonito
    let cumulative = 0;
    const leadsOverTimeData = Object.entries(leadsOverTime).map(([name, value]) => {
        cumulative += value;
        return { name, value: cumulative, daily: value };
    });

    // 2. Segmentação (Tiers)
    // CORREÇÃO: Adicionada a tipagem explícita Record<string, number>
    const segmentacaoCount: Record<string, number> = { 'Outros': 0 };
    
    leads.forEach(lead => {
      const seg = lead.segmentacao || 'Outros';
      segmentacaoCount[seg] = (segmentacaoCount[seg] || 0) + 1;
    });
    
    const segmentacaoData = Object.entries(segmentacaoCount)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    // 3. Produtos e Atividades
    const countOccurrences = (arr: (string | null)[]) => arr.reduce((acc, v) => v ? (acc[v] = (acc[v] || 0) + 1, acc) : acc, {} as Record<string, number>);
    const produtosData = Object.entries(countOccurrences(leads.map(l => l.produtoDeInteresse)))
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value) // Top produtos
        .slice(0, 5); // Top 5

    const atividadesData = Object.entries(countOccurrences(leads.map(l => l.atividadePrincipal)))
        .map(([name, value]) => ({ name, value }))
        .slice(0, 5);

    // 4. [NOVO] Funil de Vendas (Status)
    // CORREÇÃO: Adicionada a tipagem explícita Record<string, number>
    const statusCount: Record<string, number> = {
        'ENTRANTE': 0,
        'QUALIFICADO': 0,
        'ATENDIDO': 0,
        'VENDA_REALIZADA': 0,
        'PERDIDO': 0
    };
    
    leads.forEach(lead => {
        // Verifica se a chave existe ou inicializa (segurança extra)
        const status = lead.status;
        statusCount[status] = (statusCount[status] || 0) + 1;
    });

    // Funil lógico: Entrante -> Qualificado -> Atendido -> Venda
    const funnelData = [
        { name: 'Entrada', value: leads.length, fill: '#3b82f6' }, // Todos entraram
        { name: 'Qualificados', value: (statusCount['QUALIFICADO'] || 0) + (statusCount['ATENDIDO'] || 0) + (statusCount['VENDA_REALIZADA'] || 0), fill: '#8b5cf6' },
        { name: 'Em Negociação', value: (statusCount['ATENDIDO'] || 0) + (statusCount['VENDA_REALIZADA'] || 0), fill: '#f59e0b' },
        { name: 'Fechados', value: (statusCount['VENDA_REALIZADA'] || 0), fill: '#22c55e' },
    ];

    // KPIs Rápidos
    const totalRevenue = leads.reduce((acc, curr) => acc + (curr.valorVenda || 0), 0);
    const avgTicket = statusCount['VENDA_REALIZADA'] > 0 ? totalRevenue / statusCount['VENDA_REALIZADA'] : 0;

    return NextResponse.json({
      leadsOverTimeData,
      segmentacaoData,
      produtosData,
      atividadesData,
      funnelData,
      kpis: {
        totalRevenue,
        avgTicket,
        winRate: leads.length > 0 ? (statusCount['VENDA_REALIZADA'] / leads.length) * 100 : 0
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro analytics' }, { status: 500 });
  }
}