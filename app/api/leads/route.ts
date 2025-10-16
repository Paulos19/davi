// app/api/leads/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// Handler para GET - Listar Leads
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  try {
    const leads = await prisma.lead.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json({ error: 'Ocorreu um erro ao buscar os leads.' }, { status: 500 });
  }
}

// Handler para POST - Criar/Atualizar Lead
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      nome,
      contato,
      produtoDeInteresse,
      necessidadePrincipal,
      orcamento,
      prazo,
      classificacao,
      resumoDaConversa,
      historicoCompleto,
    } = body;

    if (!userId || !nome || !contato) {
      return NextResponse.json({ error: 'userId, nome e contato são obrigatórios.' }, { status: 400 });
    }
    
    const userExists = await prisma.user.findUnique({ where: { id: userId }});
    if (!userExists) {
      return NextResponse.json({ error: 'Usuário especialista não encontrado.' }, { status: 404 });
    }

    const lead = await prisma.lead.upsert({
      where: { contato: contato },
      update: { // Se já existe, atualiza tudo e define como QUALIFICADO
        nome,
        produtoDeInteresse,
        necessidadePrincipal,
        orcamento,
        prazo,
        classificacao,
        resumoDaConversa,
        historicoCompleto,
        status: 'QUALIFICADO',
      },
      create: { // Se não existe, cria com todos os dados e define como QUALIFICADO
        userId,
        nome,
        contato,
        produtoDeInteresse,
        necessidadePrincipal,
        orcamento,
        prazo,
        classificacao,
        resumoDaConversa,
        historicoCompleto,
        status: 'QUALIFICADO', // Define o status correto na criação
      },
    });

    return NextResponse.json(lead, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar ou atualizar o lead:", error);
    return NextResponse.json({ error: 'Ocorreu um erro ao processar a requisição.' }, { status: 500 });
  }
}