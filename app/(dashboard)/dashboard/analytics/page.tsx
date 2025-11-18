'use client';

import { useEffect, useState } from 'react';
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  Pie, 
  PieChart, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

// Interfaces atualizadas para os dados flexíveis
interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface AnalyticsData {
  leadsOverTimeData: ChartData[];
  segmentacaoData: ChartData[]; // Dados dos Tiers (Pequeno, Médio, Grande)
  produtosData: ChartData[];
  atividadesData: ChartData[];
  // statusDistributionData?: ChartData[]; // (Opcional se quiser manter o funil antigo)
}

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

// Componente de Carregamento
function ChartSkeleton() {
  return (
    <div className="w-full h-[350px] bg-muted/20 rounded-lg animate-pulse flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Componente para quando não há dados
const NoData = () => (
  <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
    Nenhum dado disponível para este gráfico.
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/analytics');
        if (!response.ok) throw new Error('Falha ao buscar dados');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Erro ao carregar analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader><CardTitle>Carregando...</CardTitle></CardHeader>
            <CardContent><ChartSkeleton /></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Carregando...</CardTitle></CardHeader>
            <CardContent><ChartSkeleton /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Análise de Dados</h2>
        <p className="text-muted-foreground">Acompanhe a performance e o perfil dos seus leads.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="profile">Perfil do Cliente</TabsTrigger>
        </TabsList>

        {/* --- ABA: VISÃO GERAL --- */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            
            {/* 1. Gráfico de Qualificação (NOVO) */}
            <Card>
              <CardHeader>
                <CardTitle>Qualificação de Leads (Tiers)</CardTitle>
                <CardDescription>Distribuição baseada no faturamento declarado.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  {data?.segmentacaoData && data.segmentacaoData.length > 0 ? (
                    <PieChart>
                      <Pie 
                        data={data.segmentacaoData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.segmentacaoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  ) : <NoData />}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 2. Gráfico de Volume Temporal */}
            <Card>
              <CardHeader>
                <CardTitle>Volume de Leads</CardTitle>
                <CardDescription>Entrada de novos leads nos últimos dias.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  {data?.leadsOverTimeData && data.leadsOverTimeData.length > 0 ? (
                    <LineChart data={data.leadsOverTimeData}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth()+1}`;
                        }}
                      />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                      />
                      <Line type="monotone" dataKey="value" name="Novos Leads" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                  ) : <NoData />}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- ABA: PERFIL DO CLIENTE --- */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            
            {/* 3. Produtos de Interesse */}
            <Card>
              <CardHeader>
                <CardTitle>Interesse por Produto</CardTitle>
                <CardDescription>O que seus leads estão buscando.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  {data?.produtosData && data.produtosData.length > 0 ? (
                    <BarChart data={data.produtosData} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} interval={0} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="value" name="Leads" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  ) : <NoData />}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 4. Atividade Principal */}
            <Card>
              <CardHeader>
                <CardTitle>Ramo de Atividade</CardTitle>
                <CardDescription>Setores de atuação dos seus clientes.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  {data?.atividadesData && data.atividadesData.length > 0 ? (
                    <BarChart data={data.atividadesData}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Leads" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : <NoData />}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}