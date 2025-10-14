// app/(dashboard)/dashboard/leads/page.tsx

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { getLeadsByUserId } from '@/lib/data'; // 1. Importe a nova função

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // 2. Chame a função diretamente, passando o ID do usuário
  const data = await getLeadsByUserId(session.user.id);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Leads</h1>
      <p className="text-muted-foreground mb-6">
        Visualize e atualize o status dos seus leads.
      </p>
      {/* 3. Passe os dados para a DataTable como antes */}
      <DataTable columns={columns} data={data} />
    </div>
  );
}