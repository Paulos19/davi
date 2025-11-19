// app/api/users/by-phone/[phone]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

const prisma = new PrismaClient();
const N8N_API_KEY = process.env.N8N_INTERNAL_API_KEY; 

type Context = {
  params: {
    phone: string;
  };
};

export async function GET(request: Request, context: Context) {
  // 1. Validação de Segurança (Chave n8n)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== N8N_API_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { phone } = context.params;

  if (!phone) {
    return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 });
  }

  try {
    const incomingNormalized = normalizePhoneNumber(phone);

    // 2. Busca o usuário com as configurações necessárias
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        qualificationConfig: true,
        ragKnowledgeBaseCondensed: true // Busca o campo condensado pela IA
      }
    });

    const specialist = users.find(u => normalizePhoneNumber(u.phone) === incomingNormalized);

    if (specialist) {
      // Tenta pegar o valor do campo condensado (chave: condensed_knowledge)
      const condensedRAG = (specialist.ragKnowledgeBaseCondensed as any)?.condensed_knowledge || '';

      return NextResponse.json({
        isSpecialist: true,
        specialist: {
          id: specialist.id,
          name: specialist.name,
          // Retorna as perguntas configuradas (fallback se vazio)
          questions: (specialist.qualificationConfig as any)?.questions || [
            "Qual o seu nome?",
            "Qual o faturamento mensal da sua empresa?"
          ],
          ragKnowledge: condensedRAG // O prompt final condensado para o n8n
        }
      });
    } else {
      return NextResponse.json({ isSpecialist: false });
    }

  } catch (error) {
    console.error("Erro ao buscar especialista:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}