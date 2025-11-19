// app/(dashboard)/dashboard/settings/components/rag-knowledge-base.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; 
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, Loader2, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Instruction {
  id: string;
  content: string;
}

export function RAGKnowledgeBase() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCondensing, setIsCondensing] = useState(false);
  const [condensedText, setCondensedText] = useState('');

  // --- Funções de Manipulação de Estado Local ---
  const addInstruction = () => {
    setInstructions([...instructions, { id: Date.now().toString(), content: '' }]);
  };

  const removeInstruction = (id: string) => {
    setInstructions(instructions.filter(inst => inst.id !== id));
  };

  const updateInstruction = (id: string, content: string) => {
    setInstructions(instructions.map(inst => inst.id === id ? { ...inst, content } : inst));
  };

  // --- Fetchers e Handlers ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // 1. Busca a lista crua para edição
        const rawResponse = await fetch('/api/users/rag-settings');
        if (rawResponse.ok) {
          const rawData = await rawResponse.json();
          const loadedInstructions: Instruction[] = (rawData.instructions || []).map((content: string, index: number) => ({
            id: index.toString(),
            content: content
          }));
          setInstructions(loadedInstructions.length > 0 ? loadedInstructions : [{ id: 'default', content: 'Ex: Faturamento mínimo é R$30.000,00.' }]);
        }

        // 2. Busca o texto condensado para pré-visualização (chama a API de POST com GET para fins de preview)
        // No mundo ideal, teríamos um GET separado para o campo condensed.
        // Vamos buscar o campo condensado para preview. Se a API de condense não tiver um GET,
        // vamos usar a API de settings PUT como GET para o condensed para simplificar, mas
        // como não criamos um GET para 'ragKnowledgeBaseCondensed' vamos buscar via uma rota auxiliar.
        
        // Simulação de busca do campo condensado
        const condensedResponse = await fetch('/api/users/rag-settings/condensed'); 
        if (condensedResponse.ok) {
            const condensedData = await condensedResponse.json();
            setCondensedText(condensedData.condensed_knowledge || '');
        }

      } catch (error) {
        toast.error("Erro ao carregar a Base de Conhecimento RAG.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveRaw = async () => {
    const validContents = instructions.map(i => i.content.trim()).filter(content => content.length > 0);
    
    if (validContents.length === 0) {
      toast.error("Adicione pelo menos uma instrução válida.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/users/rag-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: validContents }),
      });

      if (!response.ok) throw new Error();
      
      setInstructions(validContents.map((content, index) => ({ id: index.toString(), content })));
      toast.success("Instruções RAG salvas! Condense para atualizar o Davi.");
    } catch (error) {
      toast.error("Erro ao salvar instruções.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCondense = async () => {
    const validContents = instructions.map(i => i.content.trim()).filter(content => content.length > 0);
    
    if (validContents.length === 0) {
      toast.error("Adicione e salve as instruções primeiro.");
      return;
    }

    setIsCondensing(true);

    try {
      // Chama a nova API para condensar (chama o Gemini e salva o resultado)
      const response = await fetch('/api/users/rag-condense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: validContents }),
      });

      if (!response.ok) throw new Error();
      
      const data = await response.json();
      setCondensedText(data.condensed_knowledge); // Atualiza o preview

      toast.success("Condensação concluída! A Base RAG do Davi foi atualizada.");
    } catch (error) {
      toast.error("Erro ao condensar. Tente salvar novamente.");
    } finally {
      setIsCondensing(false);
    }
  };
  
  // ... (JSX de Loading) ...

  if (isLoading) {
    return <div className="flex items-center justify-center h-full min-h-[500px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-500" />
            <CardTitle>Base de Conhecimento RAG</CardTitle>
          </div>
          <CardDescription>
            Adicione fatos para que o Davi possa responder perguntas abertas do lead. Salve as instruções e depois use a IA para condensá-las no prompt final.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-6 pt-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Instruções/Fatos (Conteúdo Cru)</Label>
              <Button variant="outline" size="sm" onClick={addInstruction}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Fato
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {instructions.map((inst, index) => (
                <div key={inst.id} className="flex gap-3 items-start group">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 mt-1 rounded-full bg-muted text-muted-foreground text-sm font-medium border">
                    {index + 1}
                  </div>
                  <Textarea 
                    value={inst.content} 
                    onChange={(e) => updateInstruction(inst.id, e.target.value)} 
                    placeholder="Ex: A consultoria VIP inclui 4 sessões mensais e um dashboard personalizado."
                    className="flex-1 min-h-[80px]"
                  />
                  {instructions.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeInstruction(inst.id)}
                      className="flex-shrink-0 transition-opacity text-muted-foreground hover:text-destructive"
                      title="Remover instrução"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="py-4 flex justify-end gap-3 bg-muted/10">
           <Button onClick={handleSaveRaw} disabled={isSaving || isCondensing} className="sm:w-auto min-w-[150px]" variant="secondary">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Instruções
          </Button>
          <Button onClick={handleCondense} disabled={isCondensing || isSaving} className="sm:w-auto min-w-[150px]">
            {isCondensing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Condensar com IA
          </Button>
        </CardFooter>
      </Card>

      {/* Pré-visualização do Conteúdo Condensado */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt Final Enviado ao Davi (Preview)</CardTitle>
          <CardDescription>Esta é a versão condensada salva no banco de dados e usada pelo Davi.</CardDescription>
        </CardHeader>
        <CardContent>
           <Textarea 
             value={condensedText || "Clique em 'Condensar com IA' para gerar o prompt final."}
             readOnly
             className="min-h-[120px] bg-muted/50 font-mono text-xs"
           />
        </CardContent>
      </Card>

    </div>
  );
}