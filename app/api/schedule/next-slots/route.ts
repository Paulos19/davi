import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const N8N_API_KEY = process.env.N8N_INTERNAL_API_KEY;

export async function GET(request: Request) {
  // Validação de segurança
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== N8N_API_KEY) return NextResponse.json({ error: '401' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      userId: userId!,
      isBooked: false,
      startTime: { gte: new Date() } // Apenas futuros
    },
    orderBy: { startTime: 'asc' },
    take: 3
  });

  // Formata para texto amigável para o prompt do Davi
  const formatted = slots.map(s => ({
    id: s.id,
    readable: s.startTime.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }),
    iso: s.startTime.toISOString()
  }));

  return NextResponse.json({ slots: formatted });
}