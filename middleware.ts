// middleware.ts

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  // Se o usuário não estiver logado e tentar acessar uma rota que não seja de autenticação
  if (!req.auth && req.nextUrl.pathname !== '/login' && req.nextUrl.pathname !== '/register') {
    // Redireciona para a página de login, mantendo a URL original como um callback
    const newUrl = new URL('/login', req.nextUrl.origin);
    newUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(newUrl);
  }
  
  // Se o usuário estiver logado e tentar acessar as páginas de login/register, redireciona para o dashboard
  if (req.auth && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  // Permite o acesso se nenhuma das condições acima for atendida
  return NextResponse.next();
});

// O matcher define quais rotas serão protegidas pelo middleware
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de requisição, exceto para aqueles que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

// Adicione esta linha para forçar o uso do runtime Node.js
export const runtime = "nodejs";