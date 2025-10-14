// lib/data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Esta função busca os leads diretamente no banco de dados
// e pode ser chamada de qualquer Server Component.
export async function getLeadsByUserId(userId: string) {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return leads;
  } catch (error) {
    console.error("Database Error: Falha ao buscar leads.", error);
    // Em um app de produção, você poderia logar este erro em um serviço externo
    throw new Error('Falha ao buscar os leads do banco de dados.');
  }
}