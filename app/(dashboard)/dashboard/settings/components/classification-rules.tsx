'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Tags } from 'lucide-react';
import { toast } from 'sonner';

export function ClassificationRules() {
  const [rules, setRules] = useState({
    tier1: '',
    tier2: '',
    tier3: '',
    tier4: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/users/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.classification) {
            setRules(data.classification);
          }
        }
      } catch (error) {
        toast.error("Erro ao carregar regras de classificação.");
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar');
      }
      
      toast.success("Regras de classificação atualizadas com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-blue-500" />
          <CardTitle>Regras de Classificação (Tiers)</CardTitle>
        </div>
        <CardDescription>
          Ensine a IA como classificar seus leads. Isso define para qual fluxo de atendimento o cliente será enviado.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-6">
            
            {/* TIER 1 */}
            <div className="space-y-2 p-4 rounded-lg border bg-red-50/50 dark:bg-red-950/10">
                <div className="flex items-center justify-between">
                    <Label className="text-red-600 dark:text-red-400 font-bold text-base">Tier 1: Desqualificado</Label>
                    <span className="text-xs font-mono text-muted-foreground">Rota: Educador / Dica Grátis</span>
                </div>
                <Textarea 
                    placeholder="Ex: Faturamento abaixo de R$1.000, estudantes, curiosos, sem orçamento..." 
                    value={rules.tier1}
                    onChange={(e) => setRules({...rules, tier1: e.target.value})}
                    className="bg-background"
                />
                <p className="text-xs text-muted-foreground">Critérios para descartar educadamente o lead.</p>
            </div>

            {/* TIER 2 */}
            <div className="space-y-2 p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/10">
                <div className="flex items-center justify-between">
                    <Label className="text-blue-600 dark:text-blue-400 font-bold text-base">Tier 2: Pequeno (Produto)</Label>
                    <span className="text-xs font-mono text-muted-foreground">Rota: Oferta Link Direto</span>
                </div>
                <Textarea 
                    placeholder="Ex: Faturamento até R$30k, precisa de organização básica, planilhas..." 
                    value={rules.tier2}
                    onChange={(e) => setRules({...rules, tier2: e.target.value})}
                    className="bg-background"
                />
                <p className="text-xs text-muted-foreground">Critérios para oferecer produtos de entrada (low-ticket).</p>
            </div>

            {/* TIER 3 */}
            <div className="space-y-2 p-4 rounded-lg border bg-green-50/50 dark:bg-green-950/10">
                <div className="flex items-center justify-between">
                    <Label className="text-green-600 dark:text-green-400 font-bold text-base">Tier 3: Médio (Ideal)</Label>
                    <span className="text-xs font-mono text-muted-foreground">Rota: Agendamento Automático</span>
                </div>
                <Textarea 
                    placeholder="Ex: Faturamento R$30k a R$100k, precisa de consultoria recorrente..." 
                    value={rules.tier3}
                    onChange={(e) => setRules({...rules, tier3: e.target.value})}
                    className="bg-background"
                />
                <p className="text-xs text-muted-foreground">Critérios para o seu cliente ideal padrão.</p>
            </div>

            {/* TIER 4 */}
            <div className="space-y-2 p-4 rounded-lg border bg-purple-50/50 dark:bg-purple-950/10">
                <div className="flex items-center justify-between">
                    <Label className="text-purple-600 dark:text-purple-400 font-bold text-base">Tier 4: Grande (VIP)</Label>
                    <span className="text-xs font-mono text-muted-foreground">Rota: Repasse para Humano/VIP</span>
                </div>
                <Textarea 
                    placeholder="Ex: Faturamento acima de R$100k, grandes empresas, BPO completo..." 
                    value={rules.tier4}
                    onChange={(e) => setRules({...rules, tier4: e.target.value})}
                    className="bg-background"
                />
                <p className="text-xs text-muted-foreground">Critérios para leads de alto valor (High Ticket).</p>
            </div>

        </div>
      </CardContent>
      <Separator />
      <CardFooter className="bg-muted/10 py-4 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-[150px]">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Regras
        </Button>
      </CardFooter>
    </Card>
  );
}