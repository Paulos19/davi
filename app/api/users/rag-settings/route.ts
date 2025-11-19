// app/api/users/rag-settings/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Busca a Base de Conhecimento RAG crua para edição
export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ragKnowledgeBaseRaw: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Retorna as instruções cruas ou um array vazio
    const instructions = (user.ragKnowledgeBaseRaw as any)?.instructions || [];
    return NextResponse.json({ instructions });

  } catch (error) {
    console.error("Erro ao buscar Base RAG crua:", error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// PUT: Salva a Base de Conhecimento RAG crua (sem condensação)
export async function PUT(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { instructions } = await request.json();

    if (!Array.isArray(instructions)) {
      return NextResponse.json({ error: 'Formato de instruções inválido.' }, { status: 400 });
    }

    const cleanInstructions = instructions.filter((i: string) => i && i.trim() !== '');

    if (cleanInstructions.length === 0) {
       return NextResponse.json({ error: 'Defina pelo menos uma instrução válida.' }, { status: 400 });
    }

    // Salva o array de instruções no campo JSON 'ragKnowledgeBaseRaw'
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ragKnowledgeBaseRaw: { instructions: cleanInstructions }
      }
    });

    return NextResponse.json({ success: true, instructions: cleanInstructions });

  } catch (error) {
    console.error("Erro ao salvar Base RAG crua:", error);
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 });
  }
}