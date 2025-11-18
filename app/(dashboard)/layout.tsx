// app/(dashboard)/layout.tsx

import Header from "@/components/Dashboard/header";
import { Sidebar } from "@/components/Dashboard/sidebar";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { OnboardingModal } from "@/components/Dashboard/OnboardingModal"; // Importe o modal

const prisma = new PrismaClient();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // Busca o status atualizado do onboarding
  let showOnboarding = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true }
    });
    // Se onboardingCompleted for false, mostramos o modal
    showOnboarding = !user?.onboardingCompleted;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header user={session?.user} />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </div>
      
      {/* Modal condicional */}
      {showOnboarding && <OnboardingModal isOpen={true} />}
    </div>
  );
}