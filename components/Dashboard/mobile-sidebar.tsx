// components/mobile-sidebar.tsx
'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '../ui/button';
import { Menu, LayoutDashboard, Users, BarChart, Download, Settings } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { href: '/dashboard/leads', icon: Users, label: 'Leads' },
  { href: '/dashboard/analytics', icon: BarChart, label: 'Análises' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
  { href: '/dashboard/export', icon: Download, label: 'Exportar Dados' },
];

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="grid gap-6 text-lg font-medium mt-8">
          <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
            <span className="">Davi Leads</span>
          </Link>
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={label}
              href={href}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon className="h-5 w-5 inline-block mr-4" />
              {label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}