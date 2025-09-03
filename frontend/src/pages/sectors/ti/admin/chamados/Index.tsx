import { useMemo, useState } from "react";
import { ticketsMock, TicketStatus, TicketMock } from "../mock";
import { NavLink, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
            <Button size="sm" variant="success" onClick={(e) => e.stopPropagation()}>
              <UserPlus className="size-4" /> Atribuir
            </Button>
          </div>
        </div>

        <div className="mt-1 rounded-md border border-border/60 bg-background p-2">
          <Select value={sel} onValueChange={(v) => setSel(v as TicketStatus)}>
            <SelectTrigger onClick={(e) => e.stopPropagation()}>
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
          <Button variant="warning" onClick={(e) => e.stopPropagation()}>
            <Save className="size-4" /> Atualizar
          </Button>
          <Button variant="destructive" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="size-4" /> Excluir
          </Button>
          <Button variant="info" onClick={(e) => e.stopPropagation()}>
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

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TicketMock | null>(null);

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
          <div
            key={t.id}
            onClick={() => {
              setSelected(t);
              setOpen(true);
            }}
            className="cursor-pointer transition-shadow hover:shadow-md"
          >
            <TicketCard {...t} />
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-border/60">
                <div className="brand-gradient p-4 sm:p-5 flex items-start justify-between">
                  <div>
                    <div className="text-sm/5 text-primary-foreground/90">{selected.protocolo}</div>
                    <div className="mt-1 text-xl sm:text-2xl font-extrabold text-primary-foreground drop-shadow">
                      {selected.titulo}
                    </div>
                  </div>
                  <StatusPill status={selected.status} />
                </div>

                <div className="p-4 grid gap-6 md:grid-cols-[1fr,320px]">
                  {/* Timeline */}
                  <div>
                    <div className="text-sm font-medium mb-3">Linha do tempo</div>
                    <div className="relative border-s">
                      {[(() => {
                        const base = new Date(selected.criadoEm).getTime();
                        const pad = (ms: number) => new Date(base + ms);
                        const arr = [
                          { t: pad(0), label: "Chamado aberto" },
                          { t: pad(45 * 60 * 1000), label: `Status: ${selected.status}` },
                        ];
                        if (selected.visita) arr.push({ t: pad(3 * 60 * 60 * 1000), label: `Visita técnica: ${selected.visita}` });
                        return arr;
                      })()].flat().map((ev, idx) => (
                        <div key={idx} className="relative pl-6 mb-5 last:mb-0">
                          <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                          <div className="text-sm">{ev.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ev.t).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ficha */}
                  <div className="rounded-lg border border-border/60 bg-card p-4 h-max">
                    <div className="font-semibold mb-3">Ficha do chamado</div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="text-muted-foreground">Solicitante</div>
                      <div className="text-right">{selected.solicitante}</div>
                      <div className="text-muted-foreground">Cargo</div>
                      <div className="text-right">{selected.cargo}</div>
                      <div className="text-muted-foreground">Gerente</div>
                      <div className="text-right">{selected.gerente}</div>
                      <div className="text-muted-foreground">E-mail</div>
                      <div className="text-right">{selected.email}</div>
                      <div className="text-muted-foreground">Telefone</div>
                      <div className="text-right">{selected.telefone}</div>
                      <div className="text-muted-foreground">Unidade</div>
                      <div className="text-right">{selected.unidade}</div>
                      <div className="text-muted-foreground">Problema</div>
                      <div className="text-right">{selected.categoria}</div>
                      {selected.internetItem && (
                        <>
                          <div className="text-muted-foreground">Item Internet</div>
                          <div className="text-right">{selected.internetItem}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky footer actions */}
                <div className="border-t border-border/60 bg-background/50 p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <div className="w-full sm:w-64">
                    <Select defaultValue={selected.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABERTO">Aberto</SelectItem>
                        <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                        <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="success">
                      <UserPlus className="size-4" /> Atribuir
                    </Button>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
