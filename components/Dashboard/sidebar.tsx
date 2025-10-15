// components/sidebar.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { LayoutDashboard, Users, BarChart, Download, ChevronsLeft, ChevronsRight, BotMessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { href: '/dashboard/leads', icon: Users, label: 'Leads' },
  { href: '/dashboard/analytics', icon: BarChart, label: 'Análises' },
  { href: '/dashboard/export', icon: Download, label: 'Exportar Dados' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 250 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      // 1. Adicionamos classes para garantir que a sidebar ocupe toda a altura e fique fixa
      className="hidden md:flex flex-col border-r h-screen sticky top-0"
    >
      {/* 2. Novo cabeçalho da sidebar */}
      <div className="flex items-center justify-between p-4 border-b">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <BotMessageSquare className="h-6 w-6 text-primary" />
              <span className="font-bold">Davi Leads</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                { 'bg-muted text-primary': pathname === href },
                isCollapsed && 'justify-center' // Centraliza ícones quando recolhido
              )}
              title={isCollapsed ? label : undefined} // Mostra o nome no hover quando recolhido
            >
              <Icon className="h-5 w-5" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>
      </div>

      {/* 3. O botão que estava aqui no rodapé foi removido */}
    </motion.aside>
  );
}