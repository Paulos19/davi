// app/api/export/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import Papa from 'papaparse';

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const leads = await prisma.lead.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'asc', // Do mais antigo para o mais recente no CSV
      },
    });

    // Se não houver leads, retorna uma resposta vazia
    if (leads.length === 0) {
      return new Response("Nenhum lead para exportar.", { status: 200 });
    }
    
    // O campo 'historicoCompleto' é um objeto JSON, vamos convertê-lo para uma string
    const formattedLeads = leads.map(lead => ({
        ...lead,
        historicoCompleto: JSON.stringify(lead.historicoCompleto)
    }));

    // Converte os dados JSON para CSV usando papaparse
    const csv = Papa.unparse(formattedLeads);

    // Configura os headers para forçar o download do arquivo no navegador
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="leads_davi_${new Date().toISOString().split('T')[0]}.csv"`);

    return new Response(csv, { headers });

  } catch (error) {
    console.error("Erro ao exportar leads:", error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao exportar os dados.' },
      { status: 500 }
    );
  }
}