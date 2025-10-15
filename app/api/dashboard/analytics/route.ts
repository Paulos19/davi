// app/api/dashboard/analytics/route.ts

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
      select: {
        produtoDeInteresse: true,
        atividadePrincipal: true,
      },
    });

    // Função auxiliar para contar ocorrências
    const countOccurrences = (arr: (string | null)[]) => {
      return arr.reduce((acc, value) => {
        if (value) {
          acc[value] = (acc[value] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
    };

    const produtosData = Object.entries(countOccurrences(leads.map(lead => lead.produtoDeInteresse)))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Ordena do mais popular para o menos

    const atividadesData = Object.entries(countOccurrences(leads.map(lead => lead.atividadePrincipal)))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      produtosData,
      atividadesData,
    });

  } catch (error) {
    console.error("Erro ao buscar dados para análise:", error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar os dados para análise.' },
      { status: 500 }
    );
  }
}