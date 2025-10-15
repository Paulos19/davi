// app/api/leads/[id]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, LeadStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

type Context = {
  params: {
    id: string;
  };
};

// NOVO: Handler para GET - Buscar um Lead específico
export async function GET(request: Request, context: Context) {
  const session = await auth();
  const { id } = context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: {
        id: id,
        userId: session.user.id, // Garante que só pode ver o próprio lead
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao buscar o lead:", error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar os dados do lead.' },
      { status: 500 }
    );
  }
}


// Handler para PATCH (já existente)
export async function PATCH(request: Request, context: Context) {
  const session = await auth();
  const { id } = context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { status } = (await request.json()) as { status: LeadStatus };

    if (!Object.values(LeadStatus).includes(status)) {
        return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: id,
        userId: session.user.id,
      },
      data: {
        status: status,
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Erro ao atualizar o lead:", error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        return NextResponse.json({ error: 'Lead não encontrado ou não pertence a este usuário.' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Ocorreu um erro ao atualizar o lead.' },
      { status: 500 }
    );
  }
}