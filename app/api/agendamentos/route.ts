import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chave de segurança interna (a mesma usada nas outras rotas internas)
const N8N_API_KEY = process.env.N8N_INTERNAL_API_KEY;

export async function POST(request: Request) {
  // 1. Segurança: Valida se a requisição vem do n8n
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== N8N_API_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      contatoLead, // Vamos buscar o lead pelo telefone para facilitar
      dataHoraISO, // A IA deve mandar em formato ISO 8601 (ex: 2023-10-25T14:00:00Z)
      tipo,        // 'GESTAO_FINANCEIRA' ou 'BPO_PREMIUM'
      resumo,      // Notas da IA sobre o que será tratado
      userId       // ID do especialista
    } = body;

    if (!contatoLead || !dataHoraISO || !userId) {
      return NextResponse.json({ error: 'Dados incompletos para agendamento.' }, { status: 400 });
    }

    // 2. Encontra o Lead pelo contato (que já deve ter sido criado no passo anterior do fluxo)
    const lead = await prisma.lead.findUnique({
      where: { contato: contatoLead }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado para agendamento.' }, { status: 404 });
    }

    // 3. Cria o Agendamento
    const agendamento = await prisma.agendamento.create({
      data: {
        dataHora: new Date(dataHoraISO),
        tipo,
        resumo,
        status: 'PENDENTE',
        userId,
        leadId: lead.id
      }
    });
    
    // 4. Atualiza o status do Lead para ATENDIDO ou mantém QUALIFICADO
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'ATENDIDO' } // Indica que já avançou para reunião
    });

    return NextResponse.json(agendamento, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json({ error: 'Erro interno ao criar agendamento.' }, { status: 500 });
  }
}