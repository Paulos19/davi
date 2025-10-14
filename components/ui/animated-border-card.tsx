// components/ui/animated-border-card.tsx
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AnimatedBorderCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  href: string; // Link para a página de detalhes
}

export function AnimatedBorderCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}: AnimatedBorderCardProps) {
  return (
    <motion.div
      className="relative w-full h-full p-px rounded-lg"
      whileHover={{
        scale: 1.02,
        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Elemento para a borda animada */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: 'conic-gradient(from 180deg at 50% 50%, #a855f7 0deg, #3b82f6 50%, #a855f7 360deg)',
          zIndex: 0,
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />

      {/* Conteúdo do Card que fica por cima da borda */}
      <Card className="relative z-10 h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}