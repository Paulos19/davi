// app/api/leads/[id]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, LeadStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// O tipo `Context` nos dá acesso ao `params` da URL
type Context = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, context: Context) {
  const session = await auth();
  const { id } = context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { status } = (await request.json()) as { status: LeadStatus };

    // Valida se o status enviado é um valor válido do Enum
    if (!Object.values(LeadStatus).includes(status)) {
        return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: id,
        // Garante que um usuário só pode atualizar os próprios leads
        userId: session.user.id,
      },
      data: {
        status: status,
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Erro ao atualizar o lead:", error);
    // Retorna um erro mais específico se o lead não for encontrado
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        return NextResponse.json({ error: 'Lead não encontrado ou não pertence a este usuário.' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Ocorreu um erro ao atualizar o lead.' },
      { status: 500 }
    );
  }
}