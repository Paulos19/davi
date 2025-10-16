// app/api/export/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Pega o parâmetro de formato da URL
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv'; // CSV como padrão

  try {
    const leads = await prisma.lead.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    if (leads.length === 0) {
      return new Response("Nenhum lead para exportar.", { status: 204 }); // 204 No Content
    }
    
    // Formata os dados para garantir que tudo seja texto e legível
    const formattedLeads = leads.map(lead => ({
      ID: lead.id,
      Status: lead.status,
      Nome: lead.nome,
      Contato: lead.contato,
      'Produto de Interesse': lead.produtoDeInteresse,
      'Necessidade Principal': lead.necessidadePrincipal,
      Orcamento: lead.orcamento,
      Prazo: lead.prazo,
      'Classificação (IA)': lead.classificacao,
      'Faturamento Estimado': lead.faturamentoEstimado,
      'Atividade Principal': lead.atividadePrincipal,
      'Venda Realizada': lead.vendaRealizada ? 'Sim' : 'Não',
      'Valor da Venda': lead.valorVenda,
      'Data de Criação': lead.createdAt.toISOString(),
      'Última Atualização': lead.updatedAt.toISOString(),
      'Resumo da Conversa': lead.resumoDaConversa,
      'Histórico Completo': JSON.stringify(lead.historicoCompleto, null, 2), // Stringify para legibilidade
    }));

    const filename = `leads_davi_${new Date().toISOString().split('T')[0]}`;

    if (format === 'xlsx') {
      // Lógica para gerar XLSX
      const worksheet = xlsx.utils.json_to_sheet(formattedLeads);
      
      // Ajuste automático da largura das colunas para melhor formatação
      const colWidths = Object.keys(formattedLeads[0]).map(key => ({
        wch: Math.max(key.length, ...formattedLeads.map(row => row[key as keyof typeof row]?.toString().length ?? 0))
      }));
      worksheet['!cols'] = colWidths;

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Leads');
      
      const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      const headers = new Headers();
      headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      headers.set('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      
      return new Response(buffer, { headers });

    } else {
      // Lógica para gerar CSV (a que já tínhamos)
      const csv = Papa.unparse(formattedLeads);
      const headers = new Headers();
      headers.set('Content-Type', 'text/csv');
      headers.set('Content-Disposition', `attachment; filename="${filename}.csv"`);
      
      return new Response(csv, { headers });
    }

  } catch (error) {
    console.error("Erro ao exportar leads:", error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao exportar os dados.' },
      { status: 500 }
    );
  }
}