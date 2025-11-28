'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, Users, BarChart2, Settings, 
  Calendar as CalendarIcon, Download, ChevronLeft, 
  Bot, LifeBuoy, Zap
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
      {/* Header da Sidebar */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-lg tracking-tight"
              >
                Davi.ai
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 ml-auto shrink-0" 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="relative block group">
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
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
            className="p-4 mx-4 mb-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-primary/20 rounded-full">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary">Plano Pro</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Aumente suas vendas com IA avançada.
            </p>
            <Button size="sm" className="w-full text-xs h-8 bg-primary hover:bg-primary/90">
              Upgrade Agora
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer da Sidebar */}
      <div className="p-3 mt-auto border-t border-border/50">
        <Link href="/help" className={cn(
          "flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors",
          isCollapsed && "justify-center"
        )}>
          <LifeBuoy className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm font-medium">Suporte</span>}
        </Link>
      </div>
    </motion.aside>
  );
}