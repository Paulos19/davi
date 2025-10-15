// app/(dashboard)/layout.tsx

import Header from "@/components/Dashboard/header";
import { Sidebar } from "@/components/Dashboard/sidebar";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    // 1. Trocamos 'grid' por 'flex' para ter um layout fluido
    <div className="flex min-h-screen w-full">
      <Sidebar />
      {/* 2. Este div agora agrupa o cabeçalho e o conteúdo principal */}
      <div className="flex flex-1 flex-col">
        <Header user={session?.user} />
        {/* 3. O 'main' agora é a única área com scroll vertical */}
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}