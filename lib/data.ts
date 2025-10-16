// lib/data.ts

import { LeadStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Esta função busca os leads diretamente no banco de dados
// e pode ser chamada de qualquer Server Component.
export async function getLeadsByUserId(userId: string) {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return leads;
  } catch (error) {
    console.error("Database Error: Falha ao buscar leads.", error);
    // Em um app de produção, você poderia logar este erro em um serviço externo
    throw new Error('Falha ao buscar os leads do banco de dados.');
  }
}

export async function getDashboardOverview(userId: string) {
  try {
    // Busca todos os leads do usuário de uma só vez
    const allLeads = await prisma.lead.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });

    // Calcula as estatísticas (como na API de stats)
    const totalLeads = allLeads.length;
    const leadsQualificados = allLeads.filter(
      (lead) => lead.status !== LeadStatus.ENTRANTE
    ).length;
    const vendasRealizadas = allLeads.filter(
      (lead) => lead.status === LeadStatus.VENDA_REALIZADA
    ).length;
    const conversao = totalLeads > 0 ? (vendasRealizadas / totalLeads) * 100 : 0;

    // Pega os 5 leads mais recentes
    const recentLeads = allLeads.slice(0, 5);

    return {
      stats: {
        totalLeads,
        leadsQualificados,
        vendasRealizadas,
        conversao: `${conversao.toFixed(1)}%`,
      },
      recentLeads,
    };
  } catch (error) {
    console.error("Database Error: Falha ao buscar dados do dashboard.", error);
    throw new Error('Falha ao buscar os dados do dashboard.');
  }
}