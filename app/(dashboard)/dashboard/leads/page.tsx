import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { getLeadsByUserId } from '@/lib/data';
import { Users } from 'lucide-react';
// Importe o novo componente
import { AddLeadDialog } from '@/components/Dashboard/add-lead-dialog';

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Busca os dados atualizados (o refresh do router no client fará isso re-executar)
  const data = await getLeadsByUserId(session.user.id);

  return (
    <div className="container mx-auto py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                    <Users className="h-6 w-6 text-primary" />
                </div>
                Gestão de Leads
            </h1>
            <p className="text-muted-foreground mt-2 ml-1">
                Visualize, filtre e gerencie seus contatos e oportunidades de venda.
            </p>
        </div>
        
        {/* Ação Principal: Modal de Adicionar Lead */}
        <AddLeadDialog userId={session.user.id} />
      </div>

      {/* Tabela de Dados */}
      <DataTable columns={columns} data={data} />
      
    </div>
  );
}