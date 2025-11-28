import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET: Lista os slots (Já existente)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        userId: session.user.id,
        startTime: { gte: new Date() }, // Apenas futuros
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(slots);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar agenda' }, { status: 500 });
  }
}

// POST: Cria um slot manualmente (NOVO)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { date, startTime, endTime } = await request.json();

    if (!date || !startTime || !endTime) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Combina data e hora para criar o objeto Date (ISO)
    // Ex: date="2025-11-28", startTime="14:00" -> "2025-11-28T14:00:00"
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }

    // Cria o slot
    const slot = await prisma.availabilitySlot.create({
      data: {
        userId: session.user.id,
        startTime: startDateTime,
        endTime: endDateTime,
        isBooked: false
      }
    });

    return NextResponse.json(slot, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar slot:", error);
    return NextResponse.json({ error: 'Erro ao criar horário.' }, { status: 500 });
  }
}

// DELETE: Remove um slot (Já existente)
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

  await prisma.availabilitySlot.deleteMany({
    where: {
      id,
      userId: session.user.id
    }
  });

  return NextResponse.json({ success: true });
}