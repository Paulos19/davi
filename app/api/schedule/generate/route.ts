import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { instructions, mode } = await request.json(); // mode: 'add' ou 'remove'

  // 1. Configurar contexto de tempo (Brasília)
  const now = new Date();
  const todayBR = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  // 2. Prompt Refinado e Rígido
  const prompt = `
    Você é um assistente de agendamento preciso.
    
    CONTEXTO TEMPORAL:
    - Data e Hora Atual (Brasília/São Paulo): ${todayBR}
    - Ano Atual: ${now.getFullYear()}
    
    INSTRUÇÃO DO USUÁRIO: "${instructions}"
    
    TAREFA:
    Interprete a instrução e gere uma lista de "AvailabilitySlots" (horários disponíveis).
    
    REGRAS RÍGIDAS:
    1. **Fuso Horário:** Assuma que o usuário está falando no fuso horário 'America/Sao_Paulo' (GMT-3).
    2. **Conversão:** Converta os horários resultantes para **UTC** (formato ISO 8601 com 'Z' no final) na saída.
    3. **Intervalos:** Se o usuário disser um intervalo (ex: "13h às 15h"), quebre em slots de 1 hora (ex: um slot 13:00-14:00 e outro 14:00-15:00).
    4. **Datas Específicas:** Se o usuário der uma data exata (ex: "30/11"), gere APENAS para essa data. NÃO gere para o mês todo.
    5. **Recorrência:** APENAS se o usuário disser "todo", "toda" ou "sempre", gere slots para os próximos 30 dias.
    6. **Precisão:** Respeite exatamente os horários de início e fim. Não adicione horários aleatórios.
    
    SAÍDA ESPERADA (JSON Puro, sem markdown):
    [
      { "start": "2025-11-30T16:00:00.000Z", "end": "2025-11-30T17:00:00.000Z" } 
    ]
    *(Nota: No exemplo acima, 13h Brasil virou 16h UTC)*
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpeza de segurança para garantir JSON válido
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const slots = JSON.parse(cleanJson);

    // Validação básica do array
    if (!Array.isArray(slots)) {
        throw new Error("Formato inválido retornado pela IA");
    }

    // 3. Salvar no Banco
    if (mode === 'add') {
      const dataToInsert = slots.map((s: any) => ({
        userId: session.user.id,
        startTime: new Date(s.start),
        endTime: new Date(s.end),
        isBooked: false
      }));
      
      if (dataToInsert.length > 0) {
        await prisma.availabilitySlot.createMany({ data: dataToInsert });
      }
    } else if (mode === 'remove') {
        // Lógica de remoção: A IA deve retornar os ranges que o usuário quer remover
        // Para simplificar, neste MVP, o 'remove' pode deletar slots que colidam com os horários gerados pela IA
        for (const slot of slots) {
            const start = new Date(slot.start);
            const end = new Date(slot.end);
            
            await prisma.availabilitySlot.deleteMany({
                where: {
                    userId: session.user.id,
                    startTime: { gte: start },
                    endTime: { lte: end },
                    isBooked: false // Só deleta se não tiver agendado
                }
            });
        }
    }
    
    return NextResponse.json({ success: true, count: slots.length });

  } catch (error) {
    console.error("Erro na geração de agenda:", error);
    return NextResponse.json({ error: 'Falha ao interpretar disponibilidade.' }, { status: 500 });
  }
}