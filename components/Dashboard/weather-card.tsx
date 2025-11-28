'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudSun, Loader2, Droplets, Thermometer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export function WeatherCard() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    // 1. Pega a localização do navegador
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        setLocation({ lat: coords.latitude, lon: coords.longitude });
      }, () => {
        // Fallback: São Paulo
        setLocation({ lat: -23.5505, lon: -46.6333 });
      });
    }
  }, []);

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`);
        if (res.ok) setData(await res.json());
      } catch (error) {
        console.error("Erro ao carregar clima");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[150px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900/50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <CloudSun className="h-5 w-5" />
            <CardTitle className="text-sm font-semibold">Previsão Local</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white/50 text-xs">Hoje</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold tracking-tighter">
              {Math.round(data.current.temperature_2m)}°
            </span>
            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Thermometer className="h-3 w-3" /> 
                {Math.round(data.daily.temperature_2m_min[0])}° / {Math.round(data.daily.temperature_2m_max[0])}°
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" /> {data.current.relative_humidity_2m}%
              </span>
            </div>
          </div>
          
          {/* Espaço para ícone dinâmico ou status */}
          <div className="text-right">
             <p className="text-xs text-muted-foreground mb-1">Sensação de IA</p>
             <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Estável</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}