// app/api/users/by-phone/[phone]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chave para proteger a comunicação interna com o n8n
const N8N_API_KEY = process.env.N8N_INTERNAL_API_KEY;

type Context = {
  params: {
    phone: string;
  };
};

export async function GET(request: Request, context: Context) {
  // 1. Validar a chave da API
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== N8N_API_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { phone } = context.params;

  if (!phone) {
    return NextResponse.json({ error: 'Número de telefone é obrigatório.' }, { status: 400 });
  }

  try {
    // 2. Buscar o usuário pelo número de telefone
    const user = await prisma.user.findUnique({
      where: {
        phone: phone,
      },
    });

    // 3. Retornar se o especialista foi encontrado ou não
    if (user) {
      return NextResponse.json({ isSpecialist: true, specialist: user });
    } else {
      return NextResponse.json({ isSpecialist: false });
    }
  } catch (error) {
    console.error("Erro ao verificar especialista:", error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar a requisição.' },
      { status: 500 }
    );
  }
}