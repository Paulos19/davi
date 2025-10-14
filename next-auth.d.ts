// next-auth.d.ts

import 'next-auth';

declare module 'next-auth' {
  /**
   * Estende o tipo padrão da sessão para incluir nossas propriedades customizadas.
   */
  interface Session {
    user: {
      id: string;
      phone: string;
    } & DefaultSession['user']; // Mantém as propriedades padrão como name, email, image
  }

  /**
   * Estende o tipo de usuário padrão.
   */
  interface User {
    id: string;
    phone: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Estende o token JWT para que possamos adicionar o id a ele.
   */
  interface JWT {
    id?: string;
  }
}