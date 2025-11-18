// app/api/user/onboarding/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { questions } = await request.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Defina pelo menos uma pergunta.' }, { status: 400 });
    }

    // Salva as perguntas e marca onboarding como completo
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        qualificationConfig: { questions }, // Salva como JSON
        onboardingCompleted: true
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Erro no onboarding:", error);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}