// app/(dashboard)/dashboard/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ChartData {
  name: string;
  value: number;
}

interface AnalyticsData {
  produtosData: ChartData[];
  atividadesData: ChartData[];
}

// Componente de esqueleto para o gráfico
function ChartSkeleton() {
    return (
        <div className="w-full h-[350px] bg-muted rounded-lg animate-pulse p-6">
            <div className="h-full w-full bg-muted-foreground/10 rounded"></div>
        </div>
    )
}


export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/analytics');
        if (!response.ok) {
          throw new Error('Falha ao buscar dados');
        }
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
      return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader><CardContent><ChartSkeleton /></CardContent></Card>
            <Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader><CardContent><ChartSkeleton /></CardContent></Card>
        </div>
      )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Principais Produtos de Interesse</CardTitle>
          <CardDescription>
            Contagem de leads por produto ou serviço de interesse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            {data?.produtosData && data.produtosData.length > 0 ? (
                <BarChart data={data.produtosData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Leads" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
            ) : (
                <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">
                    Nenhum dado de produto disponível.
                </div>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Principais Atividades dos Clientes</CardTitle>
          <CardDescription>
            Contagem de leads por atividade principal informada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
          {data?.atividadesData && data.atividadesData.length > 0 ? (
            <BarChart data={data.atividadesData}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Leads" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
            ) : (
                <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">
                    Nenhuma dado de atividade disponível.
                </div>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}