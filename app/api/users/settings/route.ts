import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Busca as configurações atuais
export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { qualificationConfig: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Retorna as perguntas ou um array vazio se não tiver nada
    const questions = (user.qualificationConfig as any)?.questions || [];
    return NextResponse.json({ questions });

  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// PUT: Atualiza as configurações
export async function PUT(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { questions } = await request.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'A lista de perguntas não pode estar vazia.' }, { status: 400 });
    }

    // Validação simples: remove perguntas vazias
    const cleanQuestions = questions.filter(q => q && q.trim() !== '');

    if (cleanQuestions.length === 0) {
       return NextResponse.json({ error: 'Defina pelo menos uma pergunta válida.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        qualificationConfig: { questions: cleanQuestions }
      }
    });

    return NextResponse.json({ success: true, questions: cleanQuestions });

  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 });
  }
}