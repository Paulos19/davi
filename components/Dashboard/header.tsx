'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { User } from 'next-auth';
import { MobileSidebar } from './mobile-sidebar';
import { 
  Bell, 
  Search, 
  Command, 
  LogOut, 
  User as UserIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface HeaderProps {
  user: User | undefined;
}

// Interfaces para Notificações
interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'lead' | 'agenda' | 'system';
  read: boolean;
}

// COMPONENTE: Relógio de Brasília
function BrasiliaClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Força o fuso horário de Brasília
      const timeString = now.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      });
      setTime(timeString);
    };

    updateTime(); // Chama imediatamente
    const interval = setInterval(updateTime, 1000); // Atualiza a cada segundo

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground">
      <Clock className="h-3.5 w-3.5 text-primary" />
      <span>{time} (Brasília)</span>
    </div>
  );
}

export default function Header({ user }: HeaderProps) {
  // Estado de Notificações
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNew, setHasNew] = useState(false);
  
  // Referência para armazenar o último estado e comparar mudanças
  const lastStatsRef = useRef<{ leads: number; appointments: number } | null>(null);

  // Efeito de Polling (Verificar novos dados a cada 30s)
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) return;
        const data = await res.json();

        // Primeira carga: Apenas salva o estado
        if (!lastStatsRef.current) {
          lastStatsRef.current = { 
            leads: data.totalLeads, 
            appointments: data.agendamentosPendentes 
          };
          return;
        }

        const prev = lastStatsRef.current;
        const newNotifications: Notification[] = [];

        // Verifica novos Leads
        if (data.totalLeads > prev.leads) {
          const diff = data.totalLeads - prev.leads;
          newNotifications.push({
            id: crypto.randomUUID(),
            title: 'Novo Lead Capturado!',
            description: `${diff} novo(s) contato(s) entraram no funil.`,
            time: 'Agora',
            type: 'lead',
            read: false
          });
          toast.success("Você tem novos leads!");
        }

        // Verifica novos Agendamentos
        if (data.agendamentosPendentes > prev.appointments) {
          newNotifications.push({
            id: crypto.randomUUID(),
            title: 'Novo Agendamento',
            description: 'Um cliente agendou uma reunião.',
            time: 'Agora',
            type: 'agenda',
            read: false
          });
          toast.info("Novo agendamento na sua agenda.");
        }

        // Atualiza a lista se houver novidades
        if (newNotifications.length > 0) {
          setNotifications(prevNotifs => [...newNotifications, ...prevNotifs]);
          setUnreadCount(prevCount => prevCount + newNotifications.length);
          setHasNew(true);
          
          // Atualiza a referência
          lastStatsRef.current = { 
            leads: data.totalLeads, 
            appointments: data.agendamentosPendentes 
          };
        }

      } catch (error) {
        console.error("Erro ao verificar notificações", error);
      }
    };

    // Executa a verificação a cada 30 segundos
    const interval = setInterval(checkUpdates, 30000);
    checkUpdates(); // Executa uma vez ao montar

    return () => clearInterval(interval);
  }, []);

  const markAsRead = () => {
    setUnreadCount(0);
    setHasNew(false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setHasNew(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 shadow-sm transition-all">
      <div className="md:hidden">
        <MobileSidebar />
      </div>
      
      {/* Barra de Pesquisa */}
      <div className="flex-1 flex items-center max-w-md gap-4">
        <div className="relative w-full hidden md:flex items-center group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar leads, agendamentos..." 
            className="pl-9 h-9 bg-muted/50 border-transparent focus:border-primary/20 focus:bg-background focus-visible:ring-0 focus-visible:ring-offset-0 transition-all rounded-xl"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Relógio de Brasília */}
        <BrasiliaClock />

        {/* Notificações */}
        <Popover onOpenChange={(open) => open && markAsRead()}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted/80">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {hasNew && (
                <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-semibold text-sm">Notificações</h4>
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={clearNotifications}
                >
                  Limpar
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-2">
                  <Bell className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Nenhuma notificação nova</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={processNotificationStyle(notif.type, notif.read)}
                    >
                      <div className="mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.description}</p>
                        <p className="text-[10px] text-muted-foreground/70">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Menu do Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-2 pr-1 h-10 rounded-full gap-2 hover:bg-muted/60 transition-all border border-transparent hover:border-border/50">
              <Avatar className="h-8 w-8 border border-border/50">
                <AvatarImage src="" /> 
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-xs">
                  {user?.name?.slice(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-xs mr-2">
                <span className="font-semibold text-foreground/90">{user?.name?.split(' ')[0]}</span>
                <span className="text-muted-foreground text-[10px]">Especialista</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 shadow-xl border-border/50">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Helpers para estilo de notificação
function getNotificationIcon(type: string) {
  switch (type) {
    case 'lead':
      return <UserIcon className="h-4 w-4 text-blue-500" />;
    case 'agenda':
      return <Clock className="h-4 w-4 text-purple-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
}

function processNotificationStyle(type: string, read: boolean) {
  const base = "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 cursor-default";
  const bg = read ? "" : "bg-blue-50/30 dark:bg-blue-900/10";
  return `${base} ${bg}`;
}