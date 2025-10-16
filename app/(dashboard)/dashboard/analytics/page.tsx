// app/(dashboard)/dashboard/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// CORREÇÃO AQUI: Adicionamos uma assinatura de índice para tornar o tipo mais flexível.
interface ChartData {
  name: string;
  value: number;
  [key: string]: any; // Permite outras propriedades de qualquer tipo
}

interface AnalyticsData {
  leadsOverTimeData: ChartData[];
  statusDistributionData: ChartData[];
  produtosData: ChartData[];
  atividadesData: ChartData[];
}

// Cores para o gráfico de pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

function ChartSkeleton() {
  return <div className="w-full h-[350px] bg-muted rounded-lg animate-pulse" />;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/analytics');
        if (!response.ok) throw new Error('Falha ao buscar dados');
        setData(await response.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6">
        <Card><CardHeader><CardTitle>Carregando Análises...</CardTitle></CardHeader><CardContent><ChartSkeleton /></CardContent></Card>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="profile">Perfil do Cliente</TabsTrigger>
      </TabsList>

      {/* Aba de Visão Geral */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Vendas</CardTitle>
              <CardDescription>Distribuição de leads por status atual.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                {data?.statusDistributionData && data.statusDistributionData.length > 0 ? (
                  <PieChart>
                    <Pie data={data.statusDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                      {data.statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : <NoData />}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volume de Leads</CardTitle>
              <CardDescription>Quantidade de novos leads recebidos por dia.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                {data?.leadsOverTimeData && data.leadsOverTimeData.length > 0 ? (
                  <LineChart data={data.leadsOverTimeData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Novos Leads" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  </LineChart>
                ) : <NoData />}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Aba de Perfil do Cliente */}
      <TabsContent value="profile" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Principais Produtos de Interesse</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                {data?.produtosData && data.produtosData.length > 0 ? (
                  <BarChart data={data.produtosData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : <NoData />}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Principais Atividades dos Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                {data?.atividadesData && data.atividadesData.length > 0 ? (
                  <BarChart data={data.atividadesData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : <NoData />}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

const NoData = () => (
    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        Nenhum dado disponível para este gráfico.
    </div>
);