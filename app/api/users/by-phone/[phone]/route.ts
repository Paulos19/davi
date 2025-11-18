// app/api/users/by-phone/[phone]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { normalizePhoneNumber } from '@/lib/phoneUtils'; // Importe a função que criamos

const prisma = new PrismaClient();
const N8N_API_KEY = process.env.N8N_INTERNAL_API_KEY;

type Context = {
  params: {
    phone: string;
  };
};

export async function GET(request: Request, context: Context) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== N8N_API_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { phone } = context.params; // Vem do n8n, ex: 5511999998888 (pode vir com ou sem 9)

  if (!phone) {
    return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 });
  }

  try {
    // 1. Normaliza o telefone que veio do n8n
    const incomingNormalized = normalizePhoneNumber(phone);

    // 2. Busca TODOS os usuários (ou otimizar com raw query se o banco for muito grande)
    // Infelizmente, o Prisma não tem "where function(column) = value", então precisamos buscar e filtrar
    // Como é um sistema de especialistas, não deve haver milhões, então filtrar em memória é ok por enquanto.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        qualificationConfig: true // IMPORTANTE: Retornar as perguntas
      }
    });

    // 3. Encontra o especialista comparando normalizações
    const specialist = users.find(u => normalizePhoneNumber(u.phone) === incomingNormalized);

    if (specialist) {
      return NextResponse.json({
        isSpecialist: true,
        specialist: {
          id: specialist.id,
          name: specialist.name,
          // Retorna as perguntas configuradas OU um padrão se não tiver
          questions: (specialist.qualificationConfig as any)?.questions || [
            "Qual o seu nome?",
            "Qual o faturamento mensal da sua empresa?"
          ]
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