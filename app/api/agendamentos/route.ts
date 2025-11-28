import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const N8N_API_KEY = process.env.N8N_INTERNAL_API_KEY;

export async function POST(request: Request) {
  // 1. Segurança
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== N8N_API_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      contatoLead,
      dataHoraISO,
      tipo,
      resumo,
      userId
    } = body;

    if (!contatoLead || !dataHoraISO || !userId) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const dataAgendamento = new Date(dataHoraISO);

    // 2. Encontra o Lead
    const lead = await prisma.lead.findUnique({
      where: { contato: contatoLead }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
    }

    // 3. Cria o Agendamento (Registro Histórico)
    const agendamento = await prisma.agendamento.create({
      data: {
        dataHora: dataAgendamento,
        tipo,
        resumo,
        status: 'PENDENTE',
        userId,
        leadId: lead.id
      }
    });

    // --- NOVA LÓGICA CRÍTICA: QUEIMAR O SLOT ---
    // Procura o slot exato que o usuário escolheu
    const slot = await prisma.availabilitySlot.findFirst({
        where: {
            userId,
            startTime: dataAgendamento, // Deve bater exato com o slot gerado
            isBooked: false // Segurança extra
        }
    });

    if (slot) {
        // Atualiza o slot para Ocupado
        await prisma.availabilitySlot.update({
            where: { id: slot.id },
            data: { 
                isBooked: true,
                leadId: lead.id // Opcional: vincula o lead ao slot também
            }
        });
        console.log(`Slot ${slot.id} marcado como ocupado.`);
    } else {
        console.warn(`AVISO: Agendamento criado em ${dataHoraISO} mas nenhum Slot correspondente foi encontrado para marcar.`);
    }
    // -------------------------------------------
    
    // 4. Atualiza o Lead
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'ATENDIDO' }
    });

    return NextResponse.json(agendamento, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}