import { useMemo } from "react";
import { ticketsMock, TicketStatus } from "../mock";
import { NavLink, useParams } from "react-router-dom";

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
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl p-4 text-white" style={{ background: color }}>
      <div className="text-sm/5 opacity-90">{title}</div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  const styles =
    status === "ABERTO"
      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
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
          color="linear-gradient(135deg,#64748b,#475569)"
        />
        <SummaryCard
          title="Abertos"
          value={counts.abertos}
          color="linear-gradient(135deg,#fa6400,#f97316)"
        />
        <SummaryCard
          title="Aguardando"
          value={counts.aguardando}
          color="linear-gradient(135deg,#eab308,#ca8a04)"
        />
        <SummaryCard
          title="Concluídos"
          value={counts.concluidos}
          color="linear-gradient(135deg,#22c55e,#16a34a)"
        />
        <SummaryCard
          title="Cancelados"
          value={counts.cancelados}
          color="linear-gradient(135deg,#ef4444,#b91c1c)"
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
          <div
            key={t.id}
            className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">{t.id}</div>
                <div className="font-semibold mt-0.5">{t.titulo}</div>
              </div>
              <StatusPill status={t.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Solicitante</div>
                <div>{t.solicitante}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Unidade</div>
                <div>{t.unidade}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Categoria</div>
                <div>{t.categoria}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Criado em</div>
                <div>{new Date(t.criadoEm).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
