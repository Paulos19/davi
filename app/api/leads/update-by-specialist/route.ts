// app/api/leads/update-by-specialist/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Esta API será protegida por uma chave secreta no header,
// para garantir que apenas o n8n possa chamá-la.
const N8N_API_KEY = process.env.N8N_INTERNAL_API_KEY;

export async function PATCH(request: Request) {
  // 1. Validar a chave da API
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== N8N_API_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { specialistPhone, leadName, faturamentoEstimado, atividadePrincipal } = await request.json();

    // 2. Encontrar o especialista pelo telefone
    const specialist = await prisma.user.findUnique({
      where: { phone: specialistPhone },
    });

    if (!specialist) {
      return NextResponse.json({ error: 'Especialista não encontrado.' }, { status: 404 });
    }

    // 3. Encontrar o lead pelo nome, que pertence a esse especialista
    // Usamos `findFirst` pois pode haver nomes duplicados, pegamos o mais recente
    const lead = await prisma.lead.findFirst({
      where: {
        nome: {
          contains: leadName,
          mode: 'insensitive', // Ignora maiúsculas/minúsculas
        },
        userId: specialist.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lead) {
      return NextResponse.json({ error: `Lead com o nome "${leadName}" não encontrado.` }, { status: 404 });
    }

    // 4. Atualizar o lead com os novos dados
    const updatedLead = await prisma.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        faturamentoEstimado,
        atividadePrincipal,
        // Podemos também atualizar o status aqui, se quisermos
        status: 'ATENDIDO',
      },
    });

    return NextResponse.json(updatedLead);

  } catch (error) {
    console.error("Erro na atualização pelo especialista:", error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar a requisição.' },
      { status: 500 }
    );
  }
}