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

    // 1. Leads ao longo do tempo (Mantido)
    const leadsOverTime = leads.reduce((acc, lead) => {
      const date = lead.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const leadsOverTimeData = Object.entries(leadsOverTime).map(([name, value]) => ({ name, value }));

    // 2. [NOVO] Distribuição por Segmentação (Tier)
    const segmentacaoCount = {
      'Desqualificado': 0,
      'Pequeno (Produto)': 0,
      'Médio (Gestão)': 0,
      'Grande (BPO/VIP)': 0
    };

    leads.forEach(lead => {
      if (lead.segmentacao === 'DESQUALIFICADO') segmentacaoCount['Desqualificado']++;
      else if (lead.segmentacao === 'PEQUENO') segmentacaoCount['Pequeno (Produto)']++;
      else if (lead.segmentacao === 'MEDIO') segmentacaoCount['Médio (Gestão)']++;
      else if (lead.segmentacao === 'GRANDE') segmentacaoCount['Grande (BPO/VIP)']++;
    });

    const segmentacaoData = Object.entries(segmentacaoCount)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    // 3. Produtos e Atividades (Mantido)
    const countOccurrences = (arr: (string | null)[]) => arr.reduce((acc, v) => v ? (acc[v] = (acc[v] || 0) + 1, acc) : acc, {} as Record<string, number>);
    const produtosData = Object.entries(countOccurrences(leads.map(l => l.produtoDeInteresse))).map(([name, value]) => ({ name, value }));
    const atividadesData = Object.entries(countOccurrences(leads.map(l => l.atividadePrincipal))).map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      leadsOverTimeData,
      segmentacaoData, // Dados novos
      produtosData,
      atividadesData,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro analytics' }, { status: 500 });
  }
}