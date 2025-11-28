'use client';

import { useEffect, useState } from 'react';
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Line, 
  LineChart, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  Legend
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCard } from '@/components/ui/stats-card';
import { ShinyButton } from '@/components/ui/shiny-button';
import { 
  Loader2, 
  BarChart2, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Download, 
  Lightbulb, 
  PieChart as PieChartIcon,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// Cores Modernas
const COLORS = {
  primary: '#6366f1',   // Indigo
  secondary: '#ec4899', // Pink
  success: '#22c55e',   // Green
  warning: '#f59e0b',   // Amber
  info: '#3b82f6',      // Blue
  dark: '#1e293b'
};

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

// Componente Custom Tooltip para Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl text-xs">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-mono font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d'); // Apenas visual por enquanto

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/analytics');
        if (!response.ok) throw new Error('Falha ao buscar dados');
        setData(await response.json());
      } catch (error) {
        toast.error("Erro ao carregar dados analíticos.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm">Processando métricas...</p>
            </div>
        </div>
    );
  }

  // Se não houver dados, evitar crash
  if (!data) return null;

  return (
    <div className="container mx-auto py-8 max-w-7xl animate-in fade-in duration-700 space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                    <BarChart2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                Business Intelligence
            </h1>
            <p className="text-muted-foreground mt-2 ml-1">
                Acompanhe a saúde do seu negócio em tempo real.
            </p>
        </div>
        
        <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 3 meses</SelectItem>
                    <SelectItem value="year">Este ano</SelectItem>
                </SelectContent>
            </Select>
            <ShinyButton icon={<Download className="w-4 h-4" />}>
                Exportar Relatório
            </ShinyButton>
        </div>
      </div>

      {/* --- KPI CARDS (Destaque) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
            title="Receita Total (Estimada)"
            value={data.kpis.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            description="Valor total em vendas realizadas"
            icon={<DollarSign className="w-4 h-4" />}
            color="green"
            trend="up"
            trendValue="+15%"
        />
        <StatsCard 
            title="Ticket Médio"
            value={data.kpis.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            description="Valor médio por venda"
            icon={<Target className="w-4 h-4" />}
            color="blue"
        />
        <StatsCard 
            title="Taxa de Conversão"
            value={`${data.kpis.winRate.toFixed(1)}%`}
            description="Leads que viraram clientes"
            icon={<TrendingUp className="w-4 h-4" />}
            color="purple"
            trend="up"
            trendValue="+2.1%"
        />
        <StatsCard 
            title="Novos Leads (Total)"
            value={data.funnelData[0]?.value || 0}
            description="Entrada no topo do funil"
            icon={<Lightbulb className="w-4 h-4" />}
            color="orange"
        />
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="performance" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Performance de Vendas</TabsTrigger>
            <TabsTrigger value="audiencia" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Perfil da Audiência</TabsTrigger>
        </TabsList>

        {/* ABA: PERFORMANCE */}
        <TabsContent value="performance" className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="grid gap-6 md:grid-cols-2">
                
                {/* 1. Gráfico de Crescimento (Área) */}
                <Card className="col-span-2 lg:col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle>Crescimento Acumulado</CardTitle>
                        <CardDescription>Evolução da base de leads ao longo do tempo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.leadsOverTimeData}>
                                    <defs>
                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                                    <XAxis 
                                        dataKey="name" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(v) => {
                                            const d = new Date(v);
                                            return `${d.getDate()}/${d.getMonth()+1}`;
                                        }}
                                        minTickGap={30}
                                    />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke={COLORS.primary} 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorLeads)" 
                                        name="Total Acumulado"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Funil de Vendas (Barras Customizadas) */}
                <Card className="col-span-2 lg:col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle>Funil de Conversão</CardTitle>
                        <CardDescription>Eficiência em cada etapa do processo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.2} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        width={100}
                                    />
                                    <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                        {data.funnelData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Insights (Simulado) */}
            <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border-violet-100 dark:border-violet-900/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                        <Sparkles className="w-5 h-5" /> Insights do Davi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• Notamos um aumento de <strong>20%</strong> na entrada de leads na última semana. Ótimo trabalho!</p>
                    <p>• O produto <strong>"{data.produtosData[0]?.name || 'Principal'}"</strong> é responsável por 45% das intenções de compra.</p>
                    <p>• Sua taxa de conversão está acima da média de mercado (3%).</p>
                </CardContent>
            </Card>
        </TabsContent>

        {/* ABA: AUDIÊNCIA */}
        <TabsContent value="audiencia" className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="grid gap-6 md:grid-cols-3">
                
                {/* 3. Donut Chart: Segmentação */}
                <Card className="col-span-3 md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">Segmentação (Tiers)</CardTitle>
                        <CardDescription>Distribuição por tamanho.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.segmentacaoData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.segmentacaoData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Centro do Donut */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <PieChartIcon className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Barras: Top Produtos */}
                <Card className="col-span-3 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Top Produtos Solicitados</CardTitle>
                        <CardDescription>O que seus leads estão buscando.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.produtosData} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} strokeOpacity={0.2} />
                                    <XAxis type="number" fontSize={12} />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={120} 
                                        tick={{fontSize: 11}} 
                                        interval={0}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill={COLORS.secondary} radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}