'use client';

import { signOut } from 'next-auth/react';
import { Button } from '../ui/button';
import { User } from 'next-auth';
import { MobileSidebar } from './mobile-sidebar';
import { Bell, Search, Command, LogOut, User as UserIcon } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  user: User | undefined;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 shadow-sm">
      <div className="md:hidden">
        <MobileSidebar />
      </div>
      
      {/* Barra de Pesquisa Global */}
      <div className="flex-1 flex items-center max-w-md">
        <div className="relative w-full hidden md:flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar leads, agendamentos..." 
            className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:bg-background transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
            <Command className="h-3 w-3" />
            <span className="text-[10px]">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
        </Button>

        {/* Menu do Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-2 pr-1 h-10 rounded-full gap-2 hover:bg-muted/60 transition-all">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src="" /> {/* Adicionar URL da imagem se tiver */}
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.name?.slice(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-xs mr-2">
                <span className="font-semibold">{user?.name?.split(' ')[0]}</span>
                <span className="text-muted-foreground opacity-80">Especialista</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2">
              <UserIcon className="h-4 w-4" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}