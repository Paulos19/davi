import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

// Mapa para formatar os campos corretamente
const FIELD_MAP: Record<string, (lead: any) => any> = {
  'id': (l) => l.id,
  'name': (l) => l.nome,
  'phone': (l) => l.contato,
  'email': (l) => 'N/A', // Ajuste se tiver campo de email
  'status': (l) => l.status,
  'segmentacao': (l) => l.segmentacao,
  'atividadePrincipal': (l) => l.atividadePrincipal,
  'produtoDeInteresse': (l) => l.produtoDeInteresse,
  'createdAt': (l) => new Date(l.createdAt).toLocaleDateString('pt-BR'),
  'agendamento': (l) => l.agendamento ? new Date(l.agendamento.dataHora).toLocaleString('pt-BR') : 'Não',
  'valorVenda': (l) => l.valorVenda ? `R$ ${l.valorVenda}` : '-',
  'lastMessage': (l) => {
    // Pega a última mensagem do histórico, se houver
    if (Array.isArray(l.historicoCompleto) && l.historicoCompleto.length > 0) {
      return l.historicoCompleto[l.historicoCompleto.length - 1].content;
    }
    return '-';
  }
};

// IMPORTANTE: Exportar a função com o nome POST
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { startDate, endDate, fields, format } = await request.json();

    // 1. Construir filtros
    const whereClause: any = {
      userId: session.user.id,
    };

    if (startDate && endDate) {
      // Ajusta o endDate para o final do dia (23:59:59)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: end,
      };
    }

    // 2. Buscar dados no banco
    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        agendamento: true, // Inclui dados de agendamento para exportar
      },
      orderBy: { createdAt: 'desc' },
    });

    if (leads.length === 0) {
      return NextResponse.json({ error: 'Nenhum dado encontrado para o período selecionado.' }, { status: 404 });
    }

    // 3. Processar dados (Selecionar apenas colunas pedidas)
    const processedData = leads.map(lead => {
      const row: Record<string, any> = {};
      fields.forEach((fieldKey: string) => {
        // Usa o mapa se existir função de formatação, senão pega direto
        const mapper = FIELD_MAP[fieldKey];
        if (mapper) {
          row[fieldKey] = mapper(lead);
        } else {
          // @ts-ignore
          row[fieldKey] = lead[fieldKey] || '';
        }
      });
      return row;
    });

    const filename = `leads_export_${new Date().toISOString().split('T')[0]}`;

    // 4. Gerar e Retornar Arquivo
    if (format === 'xlsx') {
      const worksheet = xlsx.utils.json_to_sheet(processedData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Leads');
      
      const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`
        }
      });

    } else {
      // CSV
      const csv = Papa.unparse(processedData);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    }

  } catch (error) {
    console.error("Erro na exportação:", error);
    return NextResponse.json({ error: 'Falha interna ao processar exportação.' }, { status: 500 });
  }
}