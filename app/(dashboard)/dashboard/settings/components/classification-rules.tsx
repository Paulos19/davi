'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Tags, Target, ShieldAlert, Star, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ShinyButton } from '@/components/ui/shiny-button';

export function ClassificationRules() {
  const [rules, setRules] = useState({ tier1: '', tier2: '', tier3: '', tier4: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/users/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.classification) setRules(data.classification);
        }
      } catch (error) {
        toast.error("Erro ao carregar regras.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification: rules }),
      });

      if (!response.ok) throw new Error();
      toast.success("Regras de classificação atualizadas!");
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card className="border-t-4 border-t-purple-500 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
          <Tags className="h-5 w-5" />
          <CardTitle>Regras de Segmentação (IA)</CardTitle>
        </div>
        <CardDescription>
          Ensine a IA a classificar seus leads automaticamente com base nas respostas.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
            
        {/* TIER 1 - Desqualificado */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="space-y-3">
            <div className="flex items-center gap-2 p-2 rounded-md bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 w-fit">
                <ShieldAlert className="h-4 w-4" />
                <span className="font-bold text-sm">Tier 1: Desqualificado</span>
            </div>
            <Textarea 
                placeholder="Ex: Sem orçamento, apenas curioso, estudante..." 
                value={rules.tier1}
                onChange={(e) => setRules({...rules, tier1: e.target.value})}
                className="min-h-[100px] border-red-200 focus-visible:ring-red-500"
            />
        </motion.div>

        {/* TIER 2 - Pequeno */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="space-y-3">
            <div className="flex items-center gap-2 p-2 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 w-fit">
                <DollarSign className="h-4 w-4" />
                <span className="font-bold text-sm">Tier 2: Pequeno</span>
            </div>
            <Textarea 
                placeholder="Ex: Faturamento até 30k, produto de entrada..." 
                value={rules.tier2}
                onChange={(e) => setRules({...rules, tier2: e.target.value})}
                className="min-h-[100px] border-blue-200 focus-visible:ring-blue-500"
            />
        </motion.div>

        {/* TIER 3 - Médio */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="space-y-3">
            <div className="flex items-center gap-2 p-2 rounded-md bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 w-fit">
                <Target className="h-4 w-4" />
                <span className="font-bold text-sm">Tier 3: Médio (Ideal)</span>
            </div>
            <Textarea 
                placeholder="Ex: Faturamento 30k-100k, perfil padrão..." 
                value={rules.tier3}
                onChange={(e) => setRules({...rules, tier3: e.target.value})}
                className="min-h-[100px] border-green-200 focus-visible:ring-green-500"
            />
        </motion.div>

        {/* TIER 4 - Grande */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="space-y-3">
            <div className="flex items-center gap-2 p-2 rounded-md bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 w-fit">
                <Star className="h-4 w-4 fill-purple-700 dark:fill-purple-400" />
                <span className="font-bold text-sm">Tier 4: Grande (VIP)</span>
            </div>
            <Textarea 
                placeholder="Ex: Faturamento > 100k, alta prioridade..." 
                value={rules.tier4}
                onChange={(e) => setRules({...rules, tier4: e.target.value})}
                className="min-h-[100px] border-purple-200 focus-visible:ring-purple-500 bg-purple-50/30 dark:bg-purple-950/10"
            />
        </motion.div>

      </CardContent>
      <Separator />
      <CardFooter className="py-4 flex justify-end bg-muted/5">
        <ShinyButton 
            onClick={handleSave} 
            disabled={isSaving}
            icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
         >
            {isSaving ? "Salvando..." : "Atualizar Regras"}
         </ShinyButton>
      </CardFooter>
    </Card>
  );
}