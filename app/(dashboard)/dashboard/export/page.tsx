// app/(dashboard)/dashboard/export/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // 1. Importado

export default function ExportPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);

    // 2. Usando toast.promise para gerir os estados
    const promise = fetch('/api/export');

    toast.promise(promise, {
      loading: 'A gerar o seu ficheiro CSV...',
      success: (response) => {
        if (!response.ok) {
          throw new Error('Falha na resposta do servidor.');
        }
        
        // Lógica de download movida para o 'success'
        response.blob().then(blob => {
          if (blob.size === 0) {
            throw new Error("Nenhum dado para exportar.");
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;

          const disposition = response.headers.get('content-disposition');
          let filename = `leads_davi_${new Date().toISOString().split('T')[0]}.csv`;
          if (disposition && disposition.includes('attachment')) {
            const filenameMatch = /filename="?([^"]+)"?/.exec(disposition);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
            }
          }

          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        });

        return 'O seu download irá começar em breve!';
      },
      error: (err) => err.message || 'Ocorreu um erro ao gerar o ficheiro.',
      finally: () => setIsLoading(false),
    });
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Exportar Dados Brutos</CardTitle>
          <CardDescription>
            Faça o download de todos os dados dos seus leads em formato CSV para
            análise em planilhas ou outras ferramentas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full justify-center">
            <Button onClick={handleDownload} disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A gerar...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Descarregar Ficheiro CSV
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}