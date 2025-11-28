import Header from "@/components/Dashboard/header";
import { Sidebar } from "@/components/Dashboard/sidebar";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { OnboardingModal } from "@/components/Dashboard/OnboardingModal";

// CORREÇÃO: Força renderização dinâmica para evitar conflitos de headers estáticos/dinâmicos
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  let showOnboarding = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true }
    });
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
      
      {showOnboarding && <OnboardingModal isOpen={true} />}
    </div>
  );
}