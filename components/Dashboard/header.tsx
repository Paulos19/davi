'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { User } from 'next-auth';
import { MobileSidebar } from './mobile-sidebar';
import { 
  Bell, Search, LogOut, User as UserIcon, Clock, 
  AlertCircle, CloudSun, CloudRain, Sun, Cloud, 
  Wind, Droplets, Umbrella, Snowflake, Moon
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- COMPONENTE: WEATHER WIDGET ---
function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`
        );
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(-23.5505, -46.6333) // Fallback SP
      );
    } else {
      fetchWeather(-23.5505, -46.6333);
    }
  }, []);

  if (loading || !weather) return (
    <div className="hidden xl:flex h-10 w-40 bg-muted/50 animate-pulse rounded-lg" />
  );

  const current = weather.current;
  const daily = weather.daily;
  const isDay = current.is_day === 1;

  const getWeatherIcon = (code: number) => {
    if (code === 0) return isDay ? <Sun className="h-8 w-8 text-yellow-400 animate-spin-slow" /> : <Moon className="h-8 w-8 text-slate-200" />;
    if (code >= 1 && code <= 3) return <CloudSun className="h-8 w-8 text-orange-300" />;
    if (code >= 51 && code <= 67) return <CloudRain className="h-8 w-8 text-blue-400" />;
    if (code >= 71) return <Snowflake className="h-8 w-8 text-cyan-200" />;
    return <Cloud className="h-8 w-8 text-gray-300" />;
  };

  const getWeatherDesc = (code: number) => {
    if (code === 0) return "Céu Limpo";
    if (code <= 3) return "Parc. Nublado";
    if (code <= 67) return "Chuvoso";
    return "Nublado";
  };

  return (
    <div className={cn(
      "hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-xl border shadow-sm transition-all hover:shadow-md",
      isDay 
        ? "bg-gradient-to-br from-sky-100 via-blue-50 to-white border-blue-100 text-blue-900" 
        : "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-900 text-slate-100"
    )}>
      <div className="flex items-center gap-3 pr-3 border-r border-black/5 dark:border-white/10">
        <div className="filter drop-shadow-md">
           {getWeatherIcon(current.weather_code)}
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-bold tracking-tighter">
            {Math.round(current.temperature_2m)}°
          </span>
          <span className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
            {getWeatherDesc(current.weather_code)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-medium opacity-90">
        <div className="flex items-center gap-1.5" title="Chance de Chuva Hoje">
          <Umbrella className="h-3 w-3 text-blue-500" />
          <span>{daily.precipitation_probability_max[0]}%</span>
        </div>
        <div className="flex items-center gap-1.5" title="Umidade Relativa">
          <Droplets className="h-3 w-3 text-cyan-500" />
          <span>{current.relative_humidity_2m}%</span>
        </div>
        <div className="flex items-center gap-1.5" title="Velocidade do Vento">
          <Wind className="h-3 w-3 text-slate-500 dark:text-slate-400" />
          <span>{Math.round(current.wind_speed_10m)} km/h</span>
        </div>
        <div className="flex items-center gap-1.5" title="Mínima e Máxima">
          <span className="text-blue-600 dark:text-blue-300">↓{Math.round(daily.temperature_2m_min[0])}°</span>
          <span className="text-red-500 dark:text-red-300">↑{Math.round(daily.temperature_2m_max[0])}°</span>
        </div>
      </div>
    </div>
  );
}

// --- RELÓGIO DE BRASÍLIA ---
function BrasiliaClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      });
      setTime(timeString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/60 text-xs font-semibold text-muted-foreground shadow-sm">
      <Clock className="h-3.5 w-3.5 text-primary" />
      <span>{time}</span>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
interface HeaderProps {
  user: User | undefined;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'lead' | 'agenda' | 'system';
  read: boolean;
}

export default function Header({ user }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const lastStatsRef = useRef<{ leads: number; appointments: number } | null>(null);
  
  // Estado para busca funcional
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Função de busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/leads?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) return;
        const data = await res.json();

        if (!lastStatsRef.current) {
          lastStatsRef.current = { 
            leads: data.totalLeads, 
            appointments: data.agendamentosPendentes 
          };
          return;
        }

        const prev = lastStatsRef.current;
        const newNotifications: Notification[] = [];

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

        if (newNotifications.length > 0) {
          setNotifications(prevNotifs => [...newNotifications, ...prevNotifs]);
          setHasNew(true);
          lastStatsRef.current = { 
            leads: data.totalLeads, 
            appointments: data.agendamentosPendentes 
          };
        }
      } catch (error) {
        console.error(error);
      }
    };

    const interval = setInterval(checkUpdates, 30000);
    checkUpdates();
    return () => clearInterval(interval);
  }, []);

  const markAsRead = () => {
    setHasNew(false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setHasNew(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 shadow-sm transition-all">
      <div className="md:hidden">
        <MobileSidebar />
      </div>
      
      {/* Barra de Pesquisa Funcional */}
      <div className="flex-1 flex items-center max-w-md gap-4">
        <form onSubmit={handleSearch} className="relative w-full hidden md:flex items-center group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar leads (Enter)..." 
            className="pl-9 h-10 bg-muted/40 border-transparent focus:border-primary/20 focus:bg-background rounded-xl transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        <WeatherWidget />
        <div className="h-8 w-px bg-border/60 hidden lg:block" />
        <BrasiliaClock />

        <Popover onOpenChange={(open) => open && markAsRead()}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-muted/80">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {hasNew && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4 shadow-xl border-border/60" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
              <h4 className="font-semibold text-sm">Notificações</h4>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearNotifications} className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-destructive">
                  Limpar
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-2">
                  <Bell className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Tudo tranquilo por aqui.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={processNotificationStyle(notif.type, notif.read)}>
                      <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.description}</p>
                        <p className="text-[10px] text-muted-foreground/70">{notif.time}</p>
                      </div>
                      {!notif.read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

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

function getNotificationIcon(type: string) {
  switch (type) {
    case 'lead': return <UserIcon className="h-4 w-4 text-blue-500" />;
    case 'agenda': return <Clock className="h-4 w-4 text-purple-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
}

function processNotificationStyle(type: string, read: boolean) {
  const base = "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 cursor-default";
  const bg = read ? "" : "bg-blue-50/30 dark:bg-blue-900/10";
  return `${base} ${bg}`;
}