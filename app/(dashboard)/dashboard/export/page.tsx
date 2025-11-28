'use client';

import { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Columns3, 
  Download, 
  Loader2, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShinyButton } from '@/components/ui/shiny-button';
import { cn } from '@/lib/utils';

// Tipos de dados e estrutura para os campos
interface FieldOption {
  key: string;
  label: string;
}

interface FieldGroup {
  groupName: string;
  fields: FieldOption[];
}

const ALL_FIELDS: FieldGroup[] = [
  {
    groupName: 'Informações Básicas',
    fields: [
      { key: 'id', label: 'ID do Lead' },
      { key: 'name', label: 'Nome' },
      { key: 'phone', label: 'Telefone' },
      { key: 'email', label: 'Email' },
    ],
  },
  {
    groupName: 'Qualificação e Status',
    fields: [
      { key: 'status', label: 'Status Atual' },
      { key: 'segmentacao', label: 'Segmentação (Tier)' },
      { key: 'atividadePrincipal', label: 'Atividade Principal' },
      { key: 'produtoDeInteresse', label: 'Produto de Interesse' },
    ],
  },
  {
    groupName: 'Interação e Vendas',
    fields: [
      { key: 'createdAt', label: 'Data de Criação' },
      { key: 'agendamento', label: 'Agendamento' },
      { key: 'valorVenda', label: 'Valor da Venda' },
      { key: 'lastMessage', label: 'Última Mensagem' },
    ],
  },
];

export default function ExportPage() {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    ALL_FIELDS.flatMap(g => g.fields).map(f => f.key) // Seleciona todos por padrão
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportTime, setLastExportTime] = useState<Date | null>(null);

  const totalFields = ALL_FIELDS.flatMap(g => g.fields).length;

  const handleFieldToggle = (key: string) => {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleGroupToggle = (groupName: string, selectAll: boolean) => {
    const groupFields = ALL_FIELDS.find(g => g.groupName === groupName)?.fields.map(f => f.key) || [];
    
    if (selectAll) {
        // Adiciona todos do grupo que ainda não estão
        setSelectedFields(prev => [...new Set([...prev, ...groupFields])]);
    } else {
        // Remove todos do grupo
        setSelectedFields(prev => prev.filter(k => !groupFields.includes(k)));
    }
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Selecione pelo menos um campo para exportar.');
      return;
    }

    if (!startDate || !endDate) {
        toast.error('Defina um intervalo de datas.');
        return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Preparando sua exportação de dados...");

    try {
      // 1. Enviar parâmetros para a API
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          fields: selectedFields,
          format,
        }),
      });

      if (!res.ok) throw new Error("Falha na geração do arquivo.");

      // 2. Baixar o arquivo
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `davi-export-${dateStr}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Exportação concluída! O download foi iniciado.", { id: toastId });
      setLastExportTime(new Date());

    } catch (error) {
      toast.error("Erro ao realizar a exportação.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
                    <FileText className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                Exportar Dados
            </h1>
            <p className="text-muted-foreground mt-2 ml-1 max-w-xl">
                Gere arquivos CSV dos seus leads. Personalize o período e os campos que deseja incluir.
            </p>
        </div>
        
        {/* Última Exportação Rápida */}
        {lastExportTime && (
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-800/50 p-3 rounded-lg"
            >
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Última exportação: {lastExportTime.toLocaleTimeString('pt-BR')}</span>
            </motion.div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* --- COLUNA ESQUERDA: CONTROLES E AÇÃO --- */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* 1. Seleção de Período */}
            <Card className="border-t-4 border-t-blue-500 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                        <Calendar className="h-5 w-5" />
                        1. Intervalo de Datas
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Início</Label>
                            <Input 
                                id="start-date" 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Fim</Label>
                            <Input 
                                id="end-date" 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {/* Presets Rápidos */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => {/* Lógica para 7 dias */}}>Últimos 7 dias</Button>
                        <Button variant="outline" size="sm" onClick={() => {/* Lógica para 30 dias */}}>Últimos 30 dias</Button>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Formato e Ação */}
            <Card className="border-t-4 border-t-pink-500 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-pink-600">
                        <Columns3 className="h-5 w-5" />
                        2. Formato e Exportar
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="format-select">Formato do Arquivo</Label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger id="format-select" className="w-full">
                                <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                                <SelectItem value="json" disabled>JSON (Em breve)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <ShinyButton 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full"
                        icon={isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                    >
                        {isExporting ? "Gerando Arquivo..." : "Iniciar Exportação"}
                    </ShinyButton>
                    
                    <div className="text-xs text-center text-muted-foreground pt-1">
                        {selectedFields.length} de {totalFields} campos selecionados.
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* --- COLUNA DIREITA: SELEÇÃO DE CAMPOS --- */}
        <div className="lg:col-span-2">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Columns3 className="h-5 w-5 text-purple-600" />
                        3. Seleção de Campos ({selectedFields.length} / {totalFields})
                    </CardTitle>
                    <CardDescription>
                        Escolha quais colunas de dados serão incluídas no arquivo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {ALL_FIELDS.map((group, groupIndex) => {
                        const allSelected = group.fields.every(f => selectedFields.includes(f.key));
                        const groupSelectedCount = group.fields.filter(f => selectedFields.includes(f.key)).length;

                        return (
                            <motion.div 
                                key={group.groupName} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: groupIndex * 0.1 }}
                                className="border rounded-lg p-4 bg-muted/10"
                            >
                                <div className="flex items-center justify-between pb-3 border-b mb-3">
                                    <h3 className="font-semibold text-sm uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                        {group.groupName}
                                    </h3>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleGroupToggle(group.groupName, !allSelected)}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        {allSelected ? `Desmarcar Todos (${groupSelectedCount})` : `Selecionar Todos (${groupSelectedCount})`}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {group.fields.map((field) => (
                                        <div 
                                            key={field.key} 
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={field.key}
                                                checked={selectedFields.includes(field.key)}
                                                onCheckedChange={() => handleFieldToggle(field.key)}
                                                className="border-purple-400 data-[state=checked]:bg-purple-500"
                                            />
                                            <Label 
                                                htmlFor={field.key} 
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {field.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}