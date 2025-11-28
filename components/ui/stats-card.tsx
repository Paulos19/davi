'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// DEFINIÇÃO CORRIGIDA: icon é React.ReactNode
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode; 
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'default' | 'blue' | 'purple' | 'green' | 'orange';
}

const colorStyles = {
  default: "bg-card hover:border-slate-400/50",
  blue: "bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 hover:border-blue-400/50",
  purple: "bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 hover:border-purple-400/50",
  green: "bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 hover:border-green-400/50",
  orange: "bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-950/20 hover:border-orange-400/50",
};

const iconStyles = {
  default: "text-foreground",
  blue: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  purple: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  green: "text-green-500 bg-green-100 dark:bg-green-900/30",
  orange: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
};

export function StatsCard({ title, value, description, icon, trend, trendValue, color = 'default' }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={cn("transition-all duration-300 border-border/50 shadow-sm", colorStyles[color])}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn("p-2 rounded-lg", iconStyles[color])}>
            {/* Agora renderizamos o nó diretamente */}
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {trend && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded-full",
                trend === 'up' ? "text-green-600 bg-green-100 dark:bg-green-900/30" :
                trend === 'down' ? "text-red-600 bg-red-100 dark:bg-red-900/30" :
                "text-slate-600 bg-slate-100"
              )}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}