// app/api/register/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios.' },
        { status: 400 }
      );
    }

    // 1. Limpeza rigorosa do telefone (apenas números)
    // Isso garante consistência independente se o usuário digitou (11) 9... ou 11-9...
    const cleanPhone = phone.replace(/\D/g, '');

    // Opcional: Validar se tem DDI (55). Se não tiver, você pode decidir adicionar ou rejeitar.
    // Por enquanto, vamos assumir que o usuário digitou certo ou o frontend validou.

    // 2. Verificar duplicidade
    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email }, 
          { phone: cleanPhone } // Verifica pelo número limpo
        ] 
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'E-mail ou telefone já cadastrado.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    // 3. Criação do usuário com o telefone limpo
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone: cleanPhone,
        password: hashedPassword,
        // onboardingCompleted é false por padrão (definido no schema)
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar a requisição.' },
      { status: 500 }
    );
  }
}