// app/api/users/rag-condense/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
// Para uso real, você precisará instalar e descomentar o SDK:
import { GoogleGenerativeAI } from "@google/generative-ai"; 

const prisma = new PrismaClient();
const MODEL_NAME = 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Simula (ou executa) a chamada ao Gemini API para condensar as instruções.
 * @param instructions Array de strings com os fatos/instruções do usuário.
 * @returns O prompt condensado como uma string.
 */
async function callGeminiCondense(instructions: string[]): Promise<string> {
    const rawText = instructions.join('\n- ');
    
    // 2. Define o prompt de Sistema/Instrução para o Gemini
    const PROMPT = `Você é um condensador de conhecimento especialista para chatbots. Sua missão é pegar a lista de fatos e instruções abaixo e transformá-la em um único parágrafo de texto coeso, claro e otimizado para ser usado como contexto (RAG) para um chatbot que responde a clientes. O texto condensado deve ser a fonte de verdade.

REGRAS OBRIGATÓRIAS:
1. Mantenha o tom profissional e direto.
2. Não adicione informações novas. Apenas condense o que foi fornecido.
3. Use o separador " ||| " entre ideias principais.
4. O resultado deve ser apenas o texto condensado, sem introduções ou explicações.

FATOS A CONDENSAR:
- ${rawText}`;

    // --- CÓDIGO REAL PARA CHAMAR O GEMINI (Corrigido) ---
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY não está configurada.");
    }
    const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    // A resposta da API moderna possui um getter .text.
    const response = await model.generateContent(PROMPT);
    
    // CORREÇÃO: Usar response.text, que é o acesso direto.
    const condensedText = response.response.text();
    
    if (!condensedText) {
        // Lidar com falha na geração (e.g., conteúdo bloqueado)
        throw new Error('Gemini API não retornou texto condensado. Resposta vazia ou bloqueada.');
    }

    return condensedText.trim();
    
    // --- SIMULAÇÃO PARA AMBIENTE DE DESENVOLVIMENTO (ATIVO) ---
    const simulatedCondensedText = instructions.map(i => i.trim()).join(' ||| ').replace(/\s+/g, ' ').trim();
    return simulatedCondensedText;
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const instructions = body.instructions as string[];
    
    const validInstructions = (instructions || []).filter((i: string) => i && i.trim() !== '');

    if (validInstructions.length === 0) {
      return NextResponse.json({ error: 'A lista de instruções não pode estar vazia.' }, { status: 400 });
    }
    
    // 1. Chama o Gemini (ou simula a chamada)
    const condensedText = await callGeminiCondense(validInstructions);
    
    // Objeto final a ser salvo no campo JSON
    const condensedData = { 
        condensed_knowledge: condensedText 
    };

    // 2. Atualiza o banco de dados com o JSON condensado
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Este campo será lido pela API de telefone
        ragKnowledgeBaseCondensed: condensedData,
        // Mantém as instruções cruas sincronizadas
        ragKnowledgeBaseRaw: { instructions: validInstructions } 
      }
    });

    return NextResponse.json(condensedData, { status: 200 });

  } catch (error) {
    console.error("Erro ao condensar Base RAG com Gemini:", error);
    // Retorna a mensagem de erro detalhada para o frontend
    return NextResponse.json({ error: `Erro na condensação: ${error instanceof Error ? error.message : "Erro desconhecido"}` }, { status: 500 });
  }
}