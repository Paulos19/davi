'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Plus, Loader2, User, Phone, Tag, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { LeadStatus } from '@prisma/client';

interface AddLeadDialogProps {
  userId: string;
}

export function AddLeadDialog({ userId }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    nome: '',
    contato: '',
    segmentacao: 'PEQUENO',
    status: 'ENTRANTE' as LeadStatus,
    produtoDeInteresse: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome || !formData.contato) {
      toast.error('Nome e Contato são obrigatórios.');
      return;
    }

    // Limpeza do telefone (mantém apenas números)
    const cleanPhone = formData.contato.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
        toast.error('Insira um número de telefone válido (com DDD).');
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, // Passado via props do Server Component
          nome: formData.nome,
          contato: cleanPhone, // Envia limpo
          segmentacao: formData.segmentacao,
          status: formData.status,
          produtoDeInteresse: formData.produtoDeInteresse,
          // Campos opcionais/padrão
          classificacao: 'Manual',
          necessidadePrincipal: 'Inserido manualmente',
          orcamento: 'Não informado',
          prazo: 'Não informado',
          resumoDaConversa: 'Lead adicionado manualmente pelo painel.',
          historicoCompleto: []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar lead.');
      }

      toast.success('Lead adicionado com sucesso!');
      setOpen(false);
      
      // Reseta o formulário
      setFormData({
        nome: '',
        contato: '',
        segmentacao: 'PEQUENO',
        status: 'ENTRANTE',
        produtoDeInteresse: ''
      });

      router.refresh(); // Atualiza a tabela de dados

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Usamos o ShinyButton como trigger */}
        <div className="inline-block">
            <ShinyButton icon={<Plus className="w-4 h-4"/>}>
                Adicionar Lead Manualmente
            </ShinyButton>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Adicione um contato manualmente à sua base. Ele entrará imediatamente no fluxo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          <div className="grid grid-cols-2 gap-4">
            {/* Nome */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" /> Nome *
              </Label>
              <Input 
                id="nome" 
                placeholder="Ex: Maria Oliveira" 
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
              />
            </div>

            {/* Contato */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="contato" className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" /> WhatsApp *
              </Label>
              <Input 
                id="contato" 
                placeholder="Ex: 11999998888" 
                value={formData.contato}
                onChange={(e) => handleChange('contato', e.target.value)}
                required
                type="tel"
              />
            </div>
          </div>

          {/* Produto de Interesse */}
          <div className="space-y-2">
            <Label htmlFor="produto" className="flex items-center gap-2">
               <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Produto / Interesse
            </Label>
            <Input 
              id="produto" 
              placeholder="Ex: Consultoria Financeira" 
              value={formData.produtoDeInteresse}
              onChange={(e) => handleChange('produtoDeInteresse', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Segmentação */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" /> Segmentação
              </Label>
              <Select 
                value={formData.segmentacao} 
                onValueChange={(val) => handleChange('segmentacao', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEQUENO">Pequeno</SelectItem>
                  <SelectItem value="MEDIO">Médio</SelectItem>
                  <SelectItem value="GRANDE">Grande (VIP)</SelectItem>
                  <SelectItem value="DESQUALIFICADO">Desqualificado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Inicial */}
            <div className="space-y-2">
              <Label>Status Inicial</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val) => handleChange('status', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRANTE">Entrante</SelectItem>
                  <SelectItem value="QUALIFICADO">Qualificado</SelectItem>
                  <SelectItem value="ATENDIDO">Atendido</SelectItem>
                  <SelectItem value="VENDA_REALIZADA">Venda Realizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Salvar Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}