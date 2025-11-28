"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Lead, LeadStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ArrowUpDown, Phone, Calendar, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

// Cores para os Badges de Status
const statusStyles: Record<string, string> = {
  ENTRANTE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  QUALIFICADO: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  ATENDIDO: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  VENDA_REALIZADA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  PERDIDO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
}

// Cores para Segmentação
const segmentStyles: Record<string, string> = {
  GRANDE: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200",
  MEDIO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200",
  PEQUENO: "text-slate-600 bg-slate-50 dark:bg-slate-900/50 border-slate-200",
  DESQUALIFICADO: "text-red-600 bg-red-50 dark:bg-red-950/50 border-red-200",
}

const ActionsCell = ({ lead }: { lead: Lead }) => {
    const router = useRouter();

    const updateLeadStatus = async (status: LeadStatus) => {
        const promise = fetch(`/api/leads/${lead.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });

        toast.promise(promise, {
            loading: 'Atualizando status...',
            success: () => {
                router.refresh();
                return `Status alterado para ${status.replace("_", " ")}`;
            },
            error: 'Erro ao atualizar status.',
        });
    };
    
    return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/50">
              <span className="sr-only">Menu</span>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/leads/${lead.id}`)}>
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(lead.contato);
                toast.success("Telefone copiado!");
            }}>
              Copiar Contato
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Mudar Status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {Object.values(LeadStatus).map((status) => (
                  <DropdownMenuItem key={status} onClick={() => updateLeadStatus(status)}>
                    {status.replace("_", " ")}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: "nome",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-transparent"
        >
          Lead / Empresa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const nome = row.getValue("nome") as string;
      const initials = nome.slice(0, 2).toUpperCase();
      const email = "Sem e-mail"; // Placeholder, já que o schema atual não tem email no Lead

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">{nome}</span>
            {/* Opcional: Se tiver email no futuro */}
            {/* <span className="text-xs text-muted-foreground">{email}</span> */}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "segmentacao",
    header: "Segmentação",
    cell: ({ row }) => {
      const seg = (row.getValue("segmentacao") as string) || "N/A";
      // Normaliza para pegar a cor correta mesmo se vier do banco diferente
      const normalizedSeg = Object.keys(segmentStyles).find(k => seg.includes(k)) || "PEQUENO";
      
      return (
        <Badge variant="outline" className={`text-[10px] font-medium border ${segmentStyles[normalizedSeg] || segmentStyles["PEQUENO"]}`}>
          {seg}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant="outline" className={`border ${statusStyles[status]} hover:${statusStyles[status]}`}>
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "contato",
    header: "Contato",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Phone className="h-3 w-3" />
        {row.getValue("contato")}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Entrada",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Calendar className="h-3 w-3" />
          {date.toLocaleDateString('pt-BR')}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell lead={row.original} />,
  },
]