// app/(dashboard)/dashboard/export/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportPage() {
  const [loadingFormat, setLoadingFormat] = useState<'csv' | 'xlsx' | null>(null);

  const handleDownload = async (format: 'csv' | 'xlsx') => {
    setLoadingFormat(format);

    const promise = fetch(`/api/export?format=${format}`);

    toast.promise(promise, {
      loading: `A gerar o seu ficheiro ${format.toUpperCase()}...`,
      success: async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha na resposta do servidor.');
        }

        if (response.status === 204) {
          return "Nenhum lead para exportar.";
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const disposition = response.headers.get('content-disposition');
        let filename = `leads.${format}`;
        if (disposition && disposition.includes('attachment')) {
            const filenameMatch = /filename="?([^"]+)"?/.exec(disposition);
            if (filenameMatch?.[1]) {
                filename = filenameMatch[1];
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
a.click();
a.remove();
        window.URL.revokeObjectURL(url);
        
        return `O seu ficheiro ${format.toUpperCase()} foi descarregado!`;
      },
      error: (err) => err.message || 'Ocorreu um erro ao gerar o ficheiro.',
      finally: () => setLoadingFormat(null),
    });
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Exportar Dados Brutos</CardTitle>
          <CardDescription>
            Faça o download de todos os dados dos seus leads. Escolha o formato desejado abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full justify-center gap-4">
            {/* Botão CSV */}
            <Button 
              onClick={() => handleDownload('csv')} 
              disabled={!!loadingFormat} 
              size="lg"
            >
              {loadingFormat === 'csv' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Exportar para CSV
            </Button>
            
            {/* Botão XLSX */}
            <Button 
              onClick={() => handleDownload('xlsx')} 
              disabled={!!loadingFormat} 
              size="lg"
            >
              {loadingFormat === 'xlsx' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Exportar para XLSX (Excel)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}