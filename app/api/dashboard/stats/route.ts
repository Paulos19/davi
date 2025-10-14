// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, LeadStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Busca todos os leads do usuário logado
    const leads = await prisma.lead.findMany({
      where: { userId: userId },
    });

    // Calcula as estatísticas
    const totalLeads = leads.length;
    const leadsQualificados = leads.filter(
      (lead) => lead.status === LeadStatus.QUALIFICADO || lead.status === LeadStatus.ATENDIDO || lead.status === LeadStatus.VENDA_REALIZADA
    ).length;
    const leadsAtendidos = leads.filter(
      (lead) => lead.status === LeadStatus.ATENDIDO || lead.status === LeadStatus.VENDA_REALIZADA
    ).length;
    const vendasRealizadas = leads.filter(
      (lead) => lead.status === LeadStatus.VENDA_REALIZADA
    ).length;

    // Calcula a conversão
    const conversao = totalLeads > 0 ? (vendasRealizadas / totalLeads) * 100 : 0;

    const stats = {
      totalLeads,
      leadsQualificados,
      leadsAtendidos,
      vendasRealizadas,
      conversao: `${conversao.toFixed(1)}%`,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar as estatísticas.' },
      { status: 500 }
    );
  }
}