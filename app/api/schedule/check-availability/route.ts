import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // ... validação API Key ...
  const { userId, targetDateISO } = await request.json(); // n8n manda "2025-11-29T14:00:00"

  const target = new Date(targetDateISO);
  
  // Busca se existe um slot livre naquele horário (com margem de erro de minutos se quiser)
  const slot = await prisma.availabilitySlot.findFirst({
    where: {
      userId,
      isBooked: false,
      startTime: target
    }
  });

  if (slot) {
    return NextResponse.json({ available: true, slotId: slot.id, slotDetails: slot });
  } else {
    // Se não achou, retorna os próximos 3 como sugestão
    // (Reaproveite a lógica do endpoint anterior ou faça um redirect interno)
    return NextResponse.json({ available: false, recommendation: "..." });
  }
}