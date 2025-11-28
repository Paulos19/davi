import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude e Longitude necessárias' }, { status: 400 });
  }

  try {
    // Open-Meteo é excelente para dev (não precisa de chave).
    // Para IA "DeepMind", você usaria a API do Google aqui.
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`
    );

    if (!response.ok) throw new Error('Falha ao buscar clima');

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro Weather API:", error);
    return NextResponse.json({ error: 'Erro ao obter previsão' }, { status: 500 });
  }
}