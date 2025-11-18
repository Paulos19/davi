'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function OnboardingModal({ isOpen }: { isOpen: boolean }) {
  const [questions, setQuestions] = useState<string[]>(['Qual o seu nome?', 'Qual o nome da sua empresa?']);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const addQuestion = () => {
    if (questions.length >= 5) {
      toast.error("Máximo de 5 perguntas iniciais.");
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
    // Validação simples
    if (questions.some(q => q.trim() === '')) {
      toast.error("Preencha todas as perguntas.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });

      if (!response.ok) throw new Error('Falha ao salvar.');

      toast.success("Configuração salva! O Davi está pronto.");
      router.refresh(); // Recarrega para atualizar a sessão/estado e fechar modal
      
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Bem-vindo ao Davi Leads! 👋</DialogTitle>
          <DialogDescription>
            Vamos configurar o seu agente. Defina quais perguntas o Davi deve fazer para qualificar seus leads automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Perguntas de Qualificação</Label>
            <Button variant="outline" size="sm" onClick={addQuestion} disabled={questions.length >= 5}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {questions.map((q, index) => (
              <div key={index} className="flex gap-2 items-center animate-in fade-in slide-in-from-left-5">
                <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}.</span>
                <Input 
                  value={q} 
                  onChange={(e) => updateQuestion(index, e.target.value)} 
                  placeholder="Ex: Qual seu faturamento mensal?"
                />
                {questions.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeQuestion(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar e Iniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}