// app/(dashboard)/dashboard/leads/[id]/page.tsx

import { getLeadsByUserId } from '@/lib/data'; // Vamos criar esta função
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para buscar um único lead
async function getLeadById(leadId: string, userId: string) {
    // Reutilizando a lógica da API diretamente no Server Component
    const lead = await prisma.lead.findUnique({
      where: { id: leadId, userId: userId },
    });
    return lead;
}


export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Busca os dados do lead específico
  const lead = await getLeadById(params.id, session.user.id);

  if (!lead) {
    notFound(); // Se o lead não for encontrado, mostra uma página 404
  }
  
  // Helper para formatar a data
  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(date);

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{lead.nome}</CardTitle>
                <CardDescription>ID: {lead.id}</CardDescription>
              </div>
              <Badge>{lead.status.replace('_', ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Contato" value={lead.contato} />
            <InfoItem label="Produto de Interesse" value={lead.produtoDeInteresse} />
            <InfoItem label="Prazo" value={lead.prazo} />
            <InfoItem label="Orçamento" value={lead.orcamento} />
            <InfoItem label="Faturamento Estimado" value={lead.faturamentoEstimado} />
            <InfoItem label="Atividade Principal" value={lead.atividadePrincipal} />
            <InfoItem label="Classificação (IA)" value={lead.classificacao} />
            <InfoItem label="Venda Realizada?" value={lead.vendaRealizada ? 'Sim' : 'Não'} />
            <InfoItem label="Data de Criação" value={formatDate(lead.createdAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo e Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Resumo da Conversa (IA)</h3>
              <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                {lead.resumoDaConversa || 'Nenhum resumo gerado.'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Histórico Completo</h3>
              <div className="space-y-2 text-sm max-h-96 overflow-y-auto p-4 bg-muted/50 rounded-lg">
                 {/* O Prisma pode retornar um objeto ou uma string, então precisamos tratar ambos */}
                 {lead.historicoCompleto && typeof lead.historicoCompleto === 'object' && Array.isArray(lead.historicoCompleto) ? (
                    lead.historicoCompleto.map((msg: any, index: number) => (
                        <p key={index} className={msg.role === 'user' ? 'text-foreground' : 'text-blue-500'}>
                            <strong>{msg.role === 'user' ? 'Cliente:' : 'Davi:'}</strong> {msg.content}
                        </p>
                    ))
                 ) : (
                    <p className="text-muted-foreground">Histórico não disponível no formato esperado.</p>
                 )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente auxiliar para exibir os itens de informação
function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold">{value || 'Não informado'}</span>
    </div>
  );
}