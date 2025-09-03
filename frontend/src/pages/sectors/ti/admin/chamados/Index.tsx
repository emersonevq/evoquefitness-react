import { useMemo, useState } from "react";
import { ticketsMock, TicketStatus } from "../mock";
import { NavLink, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Trash2, Ticket as TicketIcon, UserPlus } from "lucide-react";

const statusMap = [
  { key: "todos", label: "Todos" },
  { key: "abertos", label: "Abertos" },
  { key: "aguardando", label: "Aguardando" },
  { key: "concluidos", label: "Concluídos" },
  { key: "cancelados", label: "Cancelados" },
] as const;

function SummaryCard({
  title,
  value,
  bgClass,
}: {
  title: string;
  value: number;
  bgClass: string;
}) {
  return (
    <div className={`rounded-xl p-4 text-white ${bgClass}`}>
      <div className="text-sm/5 opacity-90">{title}</div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  const styles =
    status === "ABERTO"
      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300"
      : status === "AGUARDANDO"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
        : status === "CONCLUIDO"
          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}

function TicketCard({
  id,
  titulo,
  solicitante,
  unidade,
  categoria,
  status,
  criadoEm,
}: {
  id: string;
  titulo: string;
  solicitante: string;
  unidade: string;
  categoria: string;
  status: TicketStatus;
  criadoEm: string;
}) {
  const [sel, setSel] = useState<TicketStatus>(status);
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
        <div className="font-semibold text-orange-400">{id}</div>
        <StatusPill status={status} />
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="font-medium text-base">{titulo}</div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="text-muted-foreground">Solicitante:</div>
          <div className="text-right">{solicitante}</div>

          <div className="text-muted-foreground">Problema:</div>
          <div className="text-right">{categoria}</div>

          <div className="text-muted-foreground">Unidade:</div>
          <div className="text-right">{unidade}</div>

          <div className="text-muted-foreground">Data:</div>
          <div className="text-right">{new Date(criadoEm).toLocaleDateString()}</div>

          <div className="text-muted-foreground">Agente:</div>
          <div className="text-right">
            <Button size="sm" variant="success">
              <UserPlus className="size-4" /> Atribuir
            </Button>
          </div>
        </div>

        <div className="mt-1 rounded-md border border-border/60 bg-background p-2">
          <Select value={sel} onValueChange={(v) => setSel(v as TicketStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ABERTO">Aberto</SelectItem>
              <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
              <SelectItem value="CONCLUIDO">Concluído</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <Button variant="warning">
            <Save className="size-4" /> Atualizar
          </Button>
          <Button variant="destructive">
            <Trash2 className="size-4" /> Excluir
          </Button>
          <Button variant="info">
            <TicketIcon className="size-4" /> Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChamadosPage() {
  const { filtro } = useParams<{ filtro?: string }>();

  const counts = useMemo(
    () => ({
      todos: ticketsMock.length,
      abertos: ticketsMock.filter((t) => t.status === "ABERTO").length,
      aguardando: ticketsMock.filter((t) => t.status === "AGUARDANDO").length,
      concluidos: ticketsMock.filter((t) => t.status === "CONCLUIDO").length,
      cancelados: ticketsMock.filter((t) => t.status === "CANCELADO").length,
    }),
    [],
  );

  const list = useMemo(() => {
    switch (filtro) {
      case "abertos":
        return ticketsMock.filter((t) => t.status === "ABERTO");
      case "aguardando":
        return ticketsMock.filter((t) => t.status === "AGUARDANDO");
      case "concluidos":
        return ticketsMock.filter((t) => t.status === "CONCLUIDO");
      case "cancelados":
        return ticketsMock.filter((t) => t.status === "CANCELADO");
      default:
        return ticketsMock;
    }
  }, [filtro]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard
          title="Todos"
          value={counts.todos}
          bgClass="bg-gradient-to-br from-slate-500 to-slate-600"
        />
        <SummaryCard
          title="Abertos"
          value={counts.abertos}
          bgClass="bg-gradient-to-br from-orange-500 to-orange-400"
        />
        <SummaryCard
          title="Aguardando"
          value={counts.aguardando}
          bgClass="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <SummaryCard
          title="Concluídos"
          value={counts.concluidos}
          bgClass="bg-gradient-to-br from-green-500 to-green-600"
        />
        <SummaryCard
          title="Cancelados"
          value={counts.cancelados}
          bgClass="bg-gradient-to-br from-red-500 to-red-700"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {statusMap.map((s) => (
          <NavLink
            key={s.key}
            to={`/setor/ti/admin/chamados/${s.key}`}
            className={({ isActive }) =>
              `rounded-full px-3 py-1.5 text-sm border ${isActive ? "bg-primary text-primary-foreground border-transparent" : "bg-secondary hover:bg-secondary/80"}`
            }
          >
            {s.label}
          </NavLink>
        ))}
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((t) => (
          <TicketCard key={t.id} {...t} />
        ))}
      </div>
    </div>
  );
}
