// app/(dashboard)/dashboard/settings/page.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { RAGKnowledgeBase } from './components/rag-knowledge-base'; // Importa o novo componente RAG (CRIAR ESTE ARQUIVO)
// Importar os componentes necessários para QualificationSettings
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, Loader2, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

// Componente Auxiliar para as configurações de Qualificação (Mantido para organização)
function QualificationSettings() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/users/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
          } else {
            setQuestions(['Qual o seu nome?', 'Qual o nome da sua empresa?']);
          }
        }
      } catch (error) {
        toast.error("Erro ao carregar configurações de qualificação.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const addQuestion = () => {
    if (questions.length >= 7) {
      toast.error("O limite recomendado é de 7 perguntas.");
      return;
    }
    setQuestions([...questions, '']);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    const validQuestions = questions.filter(q => q.trim() !== '');
    
    if (validQuestions.length === 0) {
      toast.error("Você precisa ter pelo menos uma pergunta.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: validQuestions }),
      });

      if (!response.ok) throw new Error();
      
      setQuestions(validQuestions);
      toast.success("Configurações de Qualificação atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full min-h-[500px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle>Fluxo de Qualificação (Perguntas)</CardTitle>
        </div>
        <CardDescription>
          Defina as perguntas iniciais que o Davi fará para coletar dados essenciais.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-6 pt-6">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Lista de Perguntas</Label>
            <Button variant="outline" size="sm" onClick={addQuestion} disabled={questions.length >= 7}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar Pergunta
            </Button>
          </div>

          <div className="space-y-3">
            {questions.map((q, index) => (
              <div key={index} className="flex gap-3 items-center group">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-medium border">
                  {index + 1}
                </div>
                {/* Usar Input padrão (simulando input from ui/input) */}
                <input
                  type="text"
                  value={q} 
                  onChange={(e) => updateQuestion(index, e.target.value)} 
                  placeholder={`Digite a pergunta ${index + 1}...`}
                  className="flex-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeQuestion(index)}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  disabled={questions.length <= 1}
                  title="Remover pergunta"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="py-4 flex justify-end bg-muted/10">
         <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto min-w-[150px]">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </CardFooter>
    </Card>
  );
}

// Página principal com as abas
export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações do Assistente Davi</h2>
        <p className="text-muted-foreground">Gerencie o comportamento e a base de conhecimento do seu assistente virtual.</p>
      </div>
      
      {/* Implementação das Abas */}
      <Tabs defaultValue="qualification">
        <TabsList>
          <TabsTrigger value="qualification">Perguntas Iniciais</TabsTrigger>
          <TabsTrigger value="knowledge">Base de Conhecimento (RAG)</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="qualification">
            <QualificationSettings />
          </TabsContent>
          <TabsContent value="knowledge">
            {/* O componente RAGKnowledgeBase deve ser criado e importado */}
            <RAGKnowledgeBase />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}