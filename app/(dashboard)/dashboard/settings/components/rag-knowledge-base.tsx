'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; 
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, Loader2, BrainCircuit, Sparkles, FileText, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ShinyButton } from '@/components/ui/shiny-button';

interface Instruction { id: string; content: string; }

export function RAGKnowledgeBase() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCondensing, setIsCondensing] = useState(false);
  const [condensedText, setCondensedText] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const rawResponse = await fetch('/api/users/rag-settings');
        if (rawResponse.ok) {
          const rawData = await rawResponse.json();
          const loadedInstructions = (rawData.instructions || []).map((content: string, index: number) => ({
            id: index.toString(), content
          }));
          setInstructions(loadedInstructions.length > 0 ? loadedInstructions : [{ id: 'default', content: '' }]);
        }
        
        // Simulação de busca do condensed (em produção, use rota GET correta)
        // Aqui assumimos que já temos ou faremos uma rota para isso
        // Para simplificar, deixamos vazio até condensar ou o usuário pode já ter
      } catch (error) {
        toast.error("Erro ao carregar RAG.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const addInstruction = () => setInstructions([...instructions, { id: Date.now().toString(), content: '' }]);
  const removeInstruction = (id: string) => setInstructions(instructions.filter(inst => inst.id !== id));
  const updateInstruction = (id: string, content: string) => setInstructions(instructions.map(inst => inst.id === id ? { ...inst, content } : inst));

  const handleSaveRaw = async () => {
    const validContents = instructions.map(i => i.content.trim()).filter(c => c.length > 0);
    if (validContents.length === 0) return toast.error("Adicione pelo menos um fato.");

    setIsSaving(true);
    try {
      const response = await fetch('/api/users/rag-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: validContents }),
      });
      if (!response.ok) throw new Error();
      toast.success("Fatos salvos!");
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCondense = async () => {
    const validContents = instructions.map(i => i.content.trim()).filter(c => c.length > 0);
    if (validContents.length === 0) return toast.error("Salve fatos antes de condensar.");

    setIsCondensing(true);
    try {
      const response = await fetch('/api/users/rag-condense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions: validContents }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCondensedText(data.condensed_knowledge);
      toast.success("Cérebro atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro na IA.");
    } finally {
      setIsCondensing(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      
      {/* Coluna Esquerda: Fatos (Input) */}
      <Card className="border-t-4 border-t-emerald-500 shadow-sm flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <FileText className="h-5 w-5" />
                <CardTitle>Base de Fatos</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={addInstruction} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
          <CardDescription>Insira informações sobre seu negócio, preços e regras.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-2">
            <AnimatePresence>
            {instructions.map((inst, index) => (
                <motion.div 
                    key={inst.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 items-start"
                >
                    <Textarea 
                        value={inst.content} 
                        onChange={(e) => updateInstruction(inst.id, e.target.value)} 
                        placeholder="Ex: O horário de funcionamento é das 09h às 18h."
                        className="flex-1 min-h-[60px] bg-muted/20 focus-visible:ring-emerald-500"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeInstruction(inst.id)} className="mt-1 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </motion.div>
            ))}
            </AnimatePresence>
        </CardContent>
        <CardFooter className="bg-muted/5 py-4 flex justify-between">
            <span className="text-xs text-muted-foreground">{instructions.length} fatos listados</span>
            <Button onClick={handleSaveRaw} disabled={isSaving} variant="outline" className="border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Rascunho"}
            </Button>
        </CardFooter>
      </Card>

      {/* Coluna Direita: Memória IA (Output) */}
      <Card className="bg-slate-950 text-slate-100 border-slate-800 shadow-xl flex flex-col h-full">
        <CardHeader>
            <div className="flex items-center gap-2 text-indigo-400">
                <BrainCircuit className="h-5 w-5" />
                <CardTitle>Memória da IA (Condensada)</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
                Como o Davi "enxerga" suas informações após o processamento.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
            <div className="relative h-full min-h-[300px] bg-slate-900/50 rounded-lg p-4 border border-slate-800 font-mono text-xs text-green-400 overflow-y-auto shadow-inner">
                {condensedText ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{condensedText}</p>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                        <Cpu className="h-8 w-8 opacity-50" />
                        <p>Aguardando processamento...</p>
                    </div>
                )}
                
                {/* Efeito decorativo */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
            </div>
        </CardContent>
        <CardFooter className="py-4 flex justify-end bg-slate-900/50 border-t border-slate-800">
            <ShinyButton 
                onClick={handleCondense} 
                disabled={isCondensing}
                icon={isCondensing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
            >
                {isCondensing ? "Otimizando..." : "Condensar Conhecimento"}
            </ShinyButton>
        </CardFooter>
      </Card>

    </div>
  );
}