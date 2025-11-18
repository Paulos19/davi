import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Buscar totais gerais
    const totalLeads = await prisma.lead.count({ where: { userId } });
    
    // 2. Buscar leads por Segmentação (Tiers)
    const leadsPequenos = await prisma.lead.count({ where: { userId, segmentacao: 'PEQUENO' } });
    const leadsMedios = await prisma.lead.count({ where: { userId, segmentacao: 'MEDIO' } });
    const leadsGrandes = await prisma.lead.count({ where: { userId, segmentacao: 'GRANDE' } });

    // 3. Buscar Agendamentos Pendentes (Tier 3 e 4)
    const agendamentosPendentes = await prisma.agendamento.count({
      where: { 
        userId, 
        status: 'PENDENTE' 
      }
    });

    // 4. Calcular vendas (já existente)
    const vendasRealizadas = await prisma.lead.count({ where: { userId, status: 'VENDA_REALIZADA' } });
    const conversao = totalLeads > 0 ? (vendasRealizadas / totalLeads) * 100 : 0;

    return NextResponse.json({
      totalLeads,
      segmentacao: {
        pequeno: leadsPequenos,
        medio: leadsMedios,
        grande: leadsGrandes
      },
      agendamentosPendentes,
      vendasRealizadas,
      conversao: `${conversao.toFixed(1)}%`,
    });

  } catch (error) {
    console.error("Erro stats:", error);
    return NextResponse.json({ error: 'Erro ao buscar estatísticas.' }, { status: 500 });
  }
}