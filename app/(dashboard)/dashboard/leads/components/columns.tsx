// app/(dashboard)/dashboard/leads/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Lead, LeadStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const statusVariant: { [key in LeadStatus]: "default" | "secondary" | "destructive" | "outline" } = {
    ENTRANTE: "secondary",
    QUALIFICADO: "default",
    ATENDIDO: "outline",
    VENDA_REALIZADA: "default",
    PERDIDO: "destructive",
}

// Componente funcional interno para poder usar hooks
const ActionsCell = ({ lead }: { lead: Lead }) => {
    const router = useRouter();

    const updateLeadStatus = async (status: LeadStatus) => {
        try {
            await fetch(`/api/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            // Recarrega os dados da página para refletir a mudança
            router.refresh(); 
        } catch (error) {
            console.error("Falha ao atualizar status:", error);
            // Adicionar feedback para o usuário aqui (ex: um toast)
        }
    };
    
    return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(lead.contato)}>
              Copiar contato
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Alterar Status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {Object.values(LeadStatus).map((status) => (
                  <DropdownMenuItem key={status} onSelect={() => updateLeadStatus(status)}>
                    {status.replace("_", " ")}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem disabled>Ver detalhes</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    )
}


export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "contato",
    header: "Contato",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as LeadStatus;
      return <Badge 
              variant={statusVariant[status]}
              className={status === 'VENDA_REALIZADA' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
            >
              {status.replace("_", " ")}
            </Badge>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Data de Entrada",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <span className="text-sm text-muted-foreground">{date.toLocaleDateString('pt-BR')}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell lead={row.original} />,
  },
]