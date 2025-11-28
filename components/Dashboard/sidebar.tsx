'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Importar Image do Next.js
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, Users, BarChart2, Settings, 
  Calendar as CalendarIcon, Download, ChevronLeft, 
  LifeBuoy, Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Visão Geral' },
  { href: '/dashboard/leads', icon: Users, label: 'Meus Leads' },
  { href: '/dashboard/agenda', icon: CalendarIcon, label: 'Agenda Inteligente' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/export', icon: Download, label: 'Exportar' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-screen sticky top-0 border-r bg-card/50 backdrop-blur-xl z-50 shadow-sm"
    >
      {/* Header da Sidebar com Logo */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-border/50">
        <div className="flex items-center gap-3 overflow-hidden w-full">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-32 h-10" // Ajuste as dimensões conforme a proporção da sua logo
              >
                <Image 
                  src="/davi_logo.png" 
                  alt="Davi Logo" 
                  fill
                  className="object-contain object-left"
                  priority
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative w-8 h-8 mx-auto"
              >
                {/* Versão ícone da logo ou a mesma logo reduzida */}
                <Image 
                  src="/davi_logo.png" 
                  alt="Davi Icon" 
                  fill
                  className="object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Botão de Colapso (Apenas visível se expandido ou no hover) */}
        {!isCollapsed && (
            <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-muted-foreground hover:text-foreground ml-auto" 
            onClick={() => setIsCollapsed(true)}
            >
            <ChevronLeft className="h-4 w-4" />
            </Button>
        )}
      </div>
      
      {/* Botão de Expandir (Quando colapsado) */}
      {isCollapsed && (
        <div className="w-full flex justify-center py-2 border-b border-border/50">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground" 
                onClick={() => setIsCollapsed(false)}
            >
                <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
        </div>
      )}

      {/* Navegação Principal */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="relative block group">
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-lg border-l-2 border-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                isActive ? "" : "hover:bg-muted/50"
              )}>
                <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-colors duration-300", 
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                        "text-sm font-medium whitespace-nowrap transition-all duration-300",
                        // AQUI ESTÁ O DEGRADÊ NOS TÍTULOS
                        isActive 
                            ? "bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 font-bold" 
                            : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Card de Upgrade (Feature Visual) */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 mx-4 mb-4 rounded-xl bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/10 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-primary to-purple-600 rounded-full shadow-lg shadow-primary/20">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                Davi Pro
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
              Desbloqueie IA avançada e suporte prioritário 24/7.
            </p>
            <Button size="sm" className="w-full text-xs h-7 bg-primary/90 hover:bg-primary shadow-sm">
              Fazer Upgrade
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer da Sidebar */}
      <div className="p-2 mt-auto border-t border-border/50 bg-muted/10">
        <Link href="/help" className={cn(
          "flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors group",
          isCollapsed && "justify-center"
        )}>
          <LifeBuoy className="h-5 w-5 group-hover:text-blue-500 transition-colors" />
          {!isCollapsed && <span className="text-sm font-medium">Ajuda & Suporte</span>}
        </Link>
      </div>
    </motion.aside>
  );
}