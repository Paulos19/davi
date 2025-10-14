// lib/auth.ts

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // Você pode definir os campos que aparecerão no formulário de login padrão (opcional)
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 1. Encontrar o usuário pelo e-mail
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Usuário não encontrado
          return null;
        }

        // 2. Verificar se a senha está correta
        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
          // Senha incorreta
          return null;
        }

        // 3. Retornar o objeto do usuário (sem a senha)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login", // Redireciona para uma página de login customizada
  },
  callbacks: {
    // Adiciona o ID do usuário e o telefone à sessão
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string; // sub é o ID do usuário no token JWT
        // Precisamos buscar o telefone aqui, pois ele não vem no token por padrão
        const userFromDb = await prisma.user.findUnique({
          where: { id: session.user.id },
        });
        if (userFromDb) {
          session.user.phone = userFromDb.phone;
        }
      }
      return session;
    },
    // Opcional: estende o token JWT se precisar de mais dados
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
});