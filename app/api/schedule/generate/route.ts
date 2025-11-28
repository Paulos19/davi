// app/api/schedule/generate/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { instructions, mode } = await request.json(); // mode: 'add' ou 'remove'

    // 1. Configurar contexto de tempo (Brasília)
    const now = new Date();
    const todayBR = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // 2. Prompt Refinado e Rígido (Wall Clock Time)
    const prompt = `
      Você é um assistente de agendamento preciso.
      
      CONTEXTO TEMPORAL:
      - Data e Hora Atual (Brasília/São Paulo): ${todayBR}
      - Ano Atual: ${now.getFullYear()}
      
      INSTRUÇÃO DO USUÁRIO: "${instructions}"
      
      TAREFA:
      Interprete a instrução e gere uma lista de "AvailabilitySlots" (horários disponíveis).
      
      REGRAS RÍGIDAS DE FUSO HORÁRIO (CRÍTICO):
      1. **Wall Clock Time:** Se o usuário pedir "14:00", você DEVE gerar o JSON com "14:00:00.000Z" (UTC).
      2. **NÃO converta fuso:** Ignore a diferença de GMT-3. Mantenha o número da hora exatamente como pedido pelo usuário.
      3. **Formato:** Use ISO 8601 com 'Z' no final para garantir que o banco salve sem alterações.
      
      REGRAS DE LÓGICA:
      4. **Intervalos:** Se o usuário disser um intervalo (ex: "13h às 15h"), quebre em slots de 1 hora (ex: um slot 13:00-14:00 e outro 14:00-15:00).
      5. **Datas Específicas:** Se o usuário der uma data exata (ex: "30/11"), gere APENAS para essa data. NÃO gere para o mês todo.
      6. **Recorrência:** APENAS se o usuário disser "todo", "toda" ou "sempre", gere slots para os próximos 30 dias.
      
      EXEMPLO CORRETO:
      Usuario: "Dia 30 às 14h"
      Saída: [{"start": "2025-11-30T14:00:00.000Z", "end": "2025-11-30T15:00:00.000Z"}]
      *(Note que 14h virou T14:00:00Z)*
      
      SAÍDA ESPERADA (JSON Puro, sem markdown):
      [
        { "start": "...", "end": "..." } 
      ]
    `;
  
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
        // Lógica de remoção simplificada: remove slots que conflitam com os horários gerados
        for (const slot of slots) {
            const start = new Date(slot.start);
            const end = new Date(slot.end);
            
            await prisma.availabilitySlot.deleteMany({
                where: {
                    userId: session.user.id,
                    startTime: { gte: start },
                    endTime: { lte: end },
                    isBooked: false // Segurança: Só deleta se não tiver agendado
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