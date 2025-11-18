'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, Loader2, Bot, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Carrega as perguntas ao iniciar
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/users/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
          } else {
            // Fallback visual se não tiver nada salvo ainda
            setQuestions(['Qual o seu nome?', 'Qual o nome da sua empresa?']);
          }
        }
      } catch (error) {
        toast.error("Erro ao carregar configurações.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const addQuestion = () => {
    if (questions.length >= 7) {
      toast.error("O limite recomendado é de 7 perguntas para não cansar o lead.");
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
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: validQuestions }),
      });

      if (!response.ok) throw new Error();
      
      // Atualiza o estado com as perguntas limpas (sem vazios)
      setQuestions(validQuestions);
      toast.success("Configurações do Davi atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">Gerencie o comportamento do seu assistente virtual.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>Fluxo de Qualificação</CardTitle>
            </div>
            <CardDescription>
              Defina as perguntas que o Davi fará aos seus leads no WhatsApp.
              A ordem abaixo será a ordem de envio.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-6">
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Dica Importante</AlertTitle>
              <AlertDescription>
                Seja direto. Perguntas abertas como "Fale sobre sua empresa" funcionam melhor com a IA do que múltipla escolha.
              </AlertDescription>
            </Alert>

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
                    <Input 
                      value={q} 
                      onChange={(e) => updateQuestion(index, e.target.value)} 
                      placeholder={`Digite a pergunta ${index + 1}...`}
                      className="flex-1"
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
      </div>
    </div>
  );
}