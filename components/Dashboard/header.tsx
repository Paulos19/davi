'use client';

import { signOut } from 'next-auth/react';
import { Button } from '../ui/button';
import type { User } from 'next-auth';
import { MobileSidebar } from './mobile-sidebar';

interface HeaderProps {
  user: User | undefined;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="md:hidden">
        <MobileSidebar />
      </div>
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        {user && <p className="text-sm hidden sm:block">Olá, {user.name?.split(' ')[0]}</p>}
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
          Sair
        </Button>
      </div>
    </header>
  );
}