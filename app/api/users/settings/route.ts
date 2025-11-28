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
      select: { 
        qualificationConfig: true,
        classificationConfig: true // Busca as regras dinâmicas
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Retorna as perguntas ou um array vazio se não tiver nada
    const questions = (user.qualificationConfig as any)?.questions || [];
    
    // Retorna as regras de classificação ou um fallback padrão
    const classification = (user.classificationConfig as any) || {
        tier1: "Lead Desqualificado (sem fit, baixa renda ou curioso)",
        tier2: "Lead Pequeno (Produto de Entrada/Low Ticket)",
        tier3: "Lead Médio (Cliente Ideal/Serviço Padrão)",
        tier4: "Lead Grande (VIP/High Ticket/Prioridade)"
    };

    return NextResponse.json({ questions, classification });

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
    const body = await request.json();
    const dataToUpdate: any = {};

    // Atualização de Perguntas
    if (body.questions) {
        if (!Array.isArray(body.questions) || body.questions.length === 0) {
            return NextResponse.json({ error: 'A lista de perguntas não pode estar vazia.' }, { status: 400 });
        }
        const cleanQuestions = body.questions.filter((q: string) => q && q.trim() !== '');
        if (cleanQuestions.length === 0) {
            return NextResponse.json({ error: 'Defina pelo menos uma pergunta válida.' }, { status: 400 });
        }
        dataToUpdate.qualificationConfig = { questions: cleanQuestions };
    }

    // Atualização de Classificação (Tiers)
    if (body.classification) {
        const { tier1, tier2, tier3, tier4 } = body.classification;
        // Validação básica para garantir que o usuário não salve campos vazios por engano
        if (!tier1 || !tier2 || !tier3 || !tier4) {
             return NextResponse.json({ error: 'Todos os 4 critérios de classificação são obrigatórios.' }, { status: 400 });
        }
        dataToUpdate.classificationConfig = body.classification;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 });
  }
}