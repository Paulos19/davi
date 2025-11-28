'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, Loader2, MessageSquare, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
// Importação correta para Drag-and-Drop
import { Reorder, useDragControls } from 'framer-motion'; 
import { ShinyButton } from '@/components/ui/shiny-button';

// Interface local para controlar a lista com IDs únicos
interface QuestionItem {
  id: string;
  text: string;
}

export function QualificationSettings() {
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/users/settings');
        if (response.ok) {
          const data = await response.json();
          // Converte o array de strings simples para objetos com ID
          const fetchedQuestions: string[] = data.questions || [];
          
          if (fetchedQuestions.length > 0) {
            setItems(fetchedQuestions.map(q => ({ id: crypto.randomUUID(), text: q })));
          } else {
            setItems([
              { id: crypto.randomUUID(), text: 'Qual o seu nome?' },
              { id: crypto.randomUUID(), text: 'Qual o nome da sua empresa?' }
            ]);
          }
        }
      } catch (error) {
        toast.error("Erro ao carregar perguntas.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const addQuestion = () => {
    if (items.length >= 7) {
      toast.error("Limite de 7 perguntas atingido.");
      return;
    }
    // Adiciona com um novo ID único
    setItems([...items, { id: crypto.randomUUID(), text: '' }]);
  };

  const removeQuestion = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuestion = (id: string, newText: string) => {
    setItems(items.map(item => item.id === id ? { ...item, text: newText } : item));
  };

  const handleSave = async () => {
    // Extrai apenas o texto para salvar no banco
    const validQuestions = items.map(i => i.text).filter(q => q.trim() !== '');
    
    if (validQuestions.length === 0) return toast.error("Adicione pelo menos uma pergunta.");

    setIsSaving(true);
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: validQuestions }),
      });

      if (!response.ok) throw new Error();
      
      toast.success("Ordem e perguntas atualizadas!");
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card className="border-t-4 border-t-blue-500 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <MessageSquare className="h-5 w-5" /> Perguntas de Qualificação
                </CardTitle>
                <CardDescription>
                    Arraste os itens pelos pontinhos à esquerda para definir a ordem das perguntas.
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addQuestion} disabled={items.length >= 7}>
              <Plus className="w-4 h-4 mr-2" /> Nova Pergunta
            </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Componente Reorder.Group gerencia a lista */}
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-3">
            {items.map((item, index) => (
              <QuestionItemComponent 
                key={item.id} 
                item={item} 
                index={index} 
                onUpdate={updateQuestion} 
                onRemove={removeQuestion}
                disableRemove={items.length <= 1}
              />
            ))}
        </Reorder.Group>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="py-4 flex justify-end bg-muted/5">
         <ShinyButton 
            onClick={handleSave} 
            disabled={isSaving}
            icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
         >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
         </ShinyButton>
      </CardFooter>
    </Card>
  );
}

// Sub-componente para isolar o controle de Drag
function QuestionItemComponent({ item, index, onUpdate, onRemove, disableRemove }: { 
    item: QuestionItem, 
    index: number, 
    onUpdate: (id: string, text: string) => void,
    onRemove: (id: string) => void,
    disableRemove: boolean
}) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={item}
            id={item.id}
            dragListener={false} // Importante: Desativa o drag no card inteiro
            dragControls={dragControls} // Ativa o drag apenas no ícone
            className="flex gap-3 items-center group bg-muted/20 p-2 rounded-lg border border-transparent hover:border-border/50 transition-all relative"
            whileDrag={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.1)", zIndex: 10 }}
        >
            {/* Handle de Drag (Área clicável) */}
            <div 
                className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground p-2 touch-none"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <GripVertical className="h-4 w-4" />
            </div>
            
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold select-none">
                {index + 1}
            </span>
            
            <Input
                value={item.text} 
                onChange={(e) => onUpdate(item.id, e.target.value)} 
                placeholder={`Ex: Qual seu faturamento mensal?`}
                className="flex-1 bg-background border-none shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
            />
            
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                disabled={disableRemove}
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </Reorder.Item>
    );
}