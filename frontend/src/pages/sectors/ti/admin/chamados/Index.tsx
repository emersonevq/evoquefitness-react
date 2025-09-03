import { useMemo, useState } from "react";
import { ticketsMock, TicketStatus } from "../mock";
import { Link, NavLink, useParams } from "react-router-dom";

const statusMap = [
  { key: "todos", label: "Todos" },
  { key: "abertos", label: "Abertos" },
  { key: "aguardando", label: "Aguardando" },
  { key: "concluidos", label: "Concluídos" },
  { key: "cancelados", label: "Cancelados" },
] as const;

function Card({
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
        <Card
          title="Todos"
          value={counts.todos}
          color="linear-gradient(135deg,#64748b,#475569)"
        />
        <Card
          title="Abertos"
          value={counts.abertos}
          color="linear-gradient(135deg,#fa6400,#f97316)"
        />
        <Card
          title="Aguardando"
          value={counts.aguardando}
          color="linear-gradient(135deg,#eab308,#ca8a04)"
        />
        <Card
          title="Concluídos"
          value={counts.concluidos}
          color="linear-gradient(135deg,#22c55e,#16a34a)"
        />
        <Card
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

      <div className="mt-2 overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Título</th>
              <th className="px-4 py-3 font-semibold">Solicitante</th>
              <th className="px-4 py-3 font-semibold">Unidade</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-t border-border/60">
                <td className="px-4 py-3">{t.id}</td>
                <td className="px-4 py-3">{t.titulo}</td>
                <td className="px-4 py-3">{t.solicitante}</td>
                <td className="px-4 py-3">{t.unidade}</td>
                <td className="px-4 py-3">{t.categoria}</td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3">
                  {new Date(t.criadoEm).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
