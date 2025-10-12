import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Instancia o Prisma Client
const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Usamos um bloco try...catch para lidar com possíveis erros
  try {
    // Pega o corpo (body) da requisição que o n8n vai enviar
    const body = await request.json();

    // Extrai os campos do corpo da requisição
    const {
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

    // Cria um novo registro de lead no banco de dados
    const newLead = await prisma.lead.create({
      data: {
        nome,
        contato,
        produtoDeInteresse,
        necessidadePrincipal,
        orcamento,
        prazo,
        classificacao,
        resumoDaConversa,
        historicoCompleto,
      },
    });

    // Retorna o lead que acabamos de criar com o status HTTP 201 (Created)
    return NextResponse.json(newLead, { status: 201 });

  } catch (error) {
    // Se ocorrer um erro, imprime no console do servidor para debug
    console.error("Erro ao criar o lead:", error);
    
    // E retorna uma mensagem de erro genérica com status HTTP 500
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar a requisição.' },
      { status: 500 }
    );
  }
}