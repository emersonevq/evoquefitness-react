import { useEffect, useMemo, useState } from "react";
type TicketStatus =
  | "ABERTO"
  | "EM_ANDAMENTO"
  | "EM_ANALISE"
  | "CONCLUIDO"
  | "CANCELADO";

interface UiTicket {
  id: string;
  protocolo: string;
  titulo: string;
  solicitante: string;
  unidade: string;
  categoria: string;
  status: TicketStatus;
  criadoEm: string;
  cargo: string;
  email: string;
  telefone: string;
  internetItem?: string | null;
  visita?: string | null;
  gerente?: string | null;
}
import { NavLink, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, Trash2, Ticket as TicketIcon, UserPlus } from "lucide-react";
import { ticketsMock } from "../mock";

const statusMap = [
  { key: "todos", label: "Todos" },
  { key: "abertos", label: "Abertos" },
  { key: "em-andamento", label: "Em andamento" },
  { key: "em-analise", label: "Em análise" },
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
      : status === "EM_ANDAMENTO"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
        : status === "EM_ANALISE"
          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
          : status === "CONCLUIDO"
            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300";
  const label =
    status === "ABERTO"
      ? "Aberto"
      : status === "EM_ANDAMENTO"
        ? "Em andamento"
        : status === "EM_ANALISE"
          ? "Em análise"
          : status === "CONCLUIDO"
            ? "Concluído"
            : "Cancelado";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {label}
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
  onTicket,
}: {
  id: string;
  titulo: string;
  solicitante: string;
  unidade: string;
  categoria: string;
  status: TicketStatus;
  criadoEm: string;
  onTicket: () => void;
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
          <div className="text-right">
            {new Date(criadoEm).toLocaleDateString()}
          </div>

          <div className="text-muted-foreground">Agente:</div>
          <div className="text-right">
            <Button
              size="sm"
              variant="success"
              onClick={(e) => e.stopPropagation()}
            >
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
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="EM_ANALISE">Em análise</SelectItem>
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
          <Button
            variant="info"
            onClick={(e) => {
              e.stopPropagation();
              onTicket();
            }}
          >
            <TicketIcon className="size-4" /> Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChamadosPage() {
  const { filtro } = useParams<{ filtro?: string }>();

  const [items, setItems] = useState<UiTicket[]>([]);

  useEffect(() => {
    function toUiStatus(s: string): TicketStatus {
      const n = s?.toUpperCase();
      if (n === "EM_ANDAMENTO" || n === "AGUARDANDO") return "EM_ANDAMENTO";
      if (n === "EM_ANALISE" || n === "EM ANÁLISE" || n === "EM ANALISE")
        return "EM_ANALISE";
      if (n === "CONCLUIDO" || n === "CONCLUÍDO") return "CONCLUIDO";
      if (n === "CANCELADO") return "CANCELADO";
      return "ABERTO";
    }

    function adapt(it: any): UiTicket {
      const titulo =
        it.problema === "Internet" && it.internet_item
          ? `Internet - ${it.internet_item}`
          : it.problema;
      return {
        id: String(it.id),
        protocolo: it.protocolo,
        titulo,
        solicitante: it.solicitante,
        unidade: it.unidade,
        categoria: it.problema,
        status: toUiStatus(it.status || "Aberto"),
        criadoEm: it.data_abertura || new Date().toISOString(),
        cargo: it.cargo,
        email: it.email,
        telefone: it.telefone,
        internetItem: it.internet_item ?? null,
        visita: it.data_visita ?? null,
        gerente: null,
      };
    }

    function adaptMock(m: (typeof ticketsMock)[number]): UiTicket {
      return {
        id: m.id,
        protocolo: m.protocolo,
        titulo: m.titulo,
        solicitante: m.solicitante,
        unidade: m.unidade,
        categoria: m.categoria,
        status: m.status,
        criadoEm: m.criadoEm,
        cargo: m.cargo,
        email: m.email,
        telefone: m.telefone,
        internetItem: m.internetItem ?? null,
        visita: m.visita ?? null,
        gerente: m.gerente ?? null,
      };
    }

    import("@/lib/api").then(({ apiFetch }) =>
      apiFetch("/chamados")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
        .then((data) =>
          setItems(
            Array.isArray(data) ? data.map(adapt) : ticketsMock.map(adaptMock),
          ),
        )
        .catch(() => setItems(ticketsMock.map(adaptMock))),
    );
  }, []);

  const counts = useMemo(
    () => ({
      todos: items.length,
      abertos: items.filter((t) => t.status === "ABERTO").length,
      aguardando: items.filter((t) => t.status === "EM_ANDAMENTO").length,
      concluidos: items.filter((t) => t.status === "CONCLUIDO").length,
      cancelados: items.filter((t) => t.status === "CANCELADO").length,
    }),
    [items],
  );

  const list = useMemo(() => {
    switch (filtro) {
      case "abertos":
        return items.filter((t) => t.status === "ABERTO");
      case "em-andamento":
        return items.filter((t) => t.status === "EM_ANDAMENTO");
      case "em-analise":
        return items.filter((t) => t.status === "EM_ANALISE");
      case "concluidos":
        return items.filter((t) => t.status === "CONCLUIDO");
      case "cancelados":
        return items.filter((t) => t.status === "CANCELADO");
      default:
        return items;
    }
  }, [filtro, items]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UiTicket | null>(null);
  const [tab, setTab] = useState<"resumo" | "historico" | "ticket">("resumo");
  const [history, setHistory] = useState<
    { t: number; label: string; attachments?: string[] }[]
  >([]);
  const [template, setTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState(false);
  const [ccMe, setCcMe] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  function initFromSelected(s: UiTicket) {
    setTab("resumo");
    setSubject(`Atualização do Chamado ${s.id}`);
    setMessage("");
    setTemplate("");
    setPriority(false);
    setCcMe(false);
    setFiles([]);

    const base = new Date(s.criadoEm).getTime();
    const arr: { t: number; label: string; attachments?: string[] }[] = [
      { t: base, label: "Chamado aberto" },
      { t: base + 45 * 60 * 1000, label: `Status: ${s.status === "ABERTO" ? "Aberto" : s.status === "EM_ANDAMENTO" ? "Em andamento" : s.status === "EM_ANALISE" ? "Em análise" : s.status === "CONCLUIDO" ? "Concluído" : "Cancelado"}` },
    ];
    if (s.visita)
      arr.push({
        t: base + 3 * 60 * 60 * 1000,
        label: `Visita técnica: ${s.visita}`,
      });
    setHistory(arr);
  }

  function handleSendTicket() {
    const now = Date.now();
    const names = files.map((f) => f.name);
    setHistory((h) => [
      ...h,
      {
        t: now,
        label: `Ticket enviado${priority ? " (prioritário)" : ""}`,
        attachments: names,
      },
    ]);
    setTab("historico");
  }

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
          title="Em andamento"
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
              initFromSelected(t);
              setOpen(true);
            }}
            className="cursor-pointer transition-shadow hover:shadow-md"
          >
            <TicketCard
              {...t}
              onTicket={() => {
                setSelected(t);
                initFromSelected(t);
                setTab("ticket");
                setOpen(true);
              }}
            />
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          {selected && (
            <div className="space-y-4">
              {/* Hidden title for a11y */}
              <div className="sr-only">
                <DialogHeader>
                  <DialogTitle>Detalhes do chamado {selected.id}</DialogTitle>
                </DialogHeader>
              </div>
              <div className="rounded-lg overflow-hidden border border-border/60">
                <div className="brand-gradient p-4 sm:p-5 flex items-start justify-between">
                  <div>
                    <div className="text-sm/5 text-primary-foreground/90">
                      {selected.protocolo}
                    </div>
                    <div className="mt-1 text-xl sm:text-2xl font-extrabold text-primary-foreground drop-shadow">
                      {selected.titulo}
                    </div>
                  </div>
                  <StatusPill status={selected.status} />
                </div>

                {/* Tabs */}
                <div className="px-4 pt-3">
                  <div className="flex gap-2">
                    {(["resumo", "historico", "ticket"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setTab(k)}
                        className={`rounded-full px-3 py-1.5 text-sm ${tab === k ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
                      >
                        {k === "resumo"
                          ? "Resumo"
                          : k === "historico"
                            ? "Histórico"
                            : "Ticket"}
                      </button>
                    ))}
                  </div>
                </div>

                {tab === "resumo" && (
                  <div className="p-4 grid gap-6 md:grid-cols-[1fr,320px]">
                    <div className="rounded-lg border border-border/60 bg-card p-4 h-max">
                      <div className="font-semibold mb-3">Ficha do chamado</div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="text-muted-foreground">Solicitante</div>
                        <div className="text-right">{selected.solicitante}</div>
                        <div className="text-muted-foreground">Cargo</div>
                        <div className="text-right">{selected.cargo}</div>
                        <div className="text-muted-foreground">Gerente</div>
                        <div className="text-right">
                          {selected.gerente || "—"}
                        </div>
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
                            <div className="text-muted-foreground">
                              Item Internet
                            </div>
                            <div className="text-right">
                              {selected.internetItem}
                            </div>
                          </>
                        )}
                        <div className="text-muted-foreground">
                          Data de abertura
                        </div>
                        <div className="text-right">
                          {new Date(selected.criadoEm).toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">
                          Visita técnica
                        </div>
                        <div className="text-right">
                          {selected.visita || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-card p-4 h-max">
                      <div className="font-semibold mb-3">Ações</div>
                      <div className="grid gap-3">
                        <Select defaultValue={selected.status}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ABERTO">Aberto</SelectItem>
                            <SelectItem value="EM_ANDAMENTO">
                              Em andamento
                            </SelectItem>
                            <SelectItem value="EM_ANALISE">
                              Em análise
                            </SelectItem>
                            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                            <SelectItem value="CANCELADO">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="success">
                          <UserPlus className="size-4" /> Atribuir
                        </Button>
                        <Button variant="warning">
                          <Save className="size-4" /> Atualizar
                        </Button>
                        <Button variant="destructive">
                          <Trash2 className="size-4" /> Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "historico" && (
                  <div className="p-4">
                    <div className="text-sm font-medium mb-3">
                      Linha do tempo
                    </div>
                    <div className="relative border-s">
                      {history.map((ev, idx) => (
                        <div key={idx} className="relative pl-6 mb-5 last:mb-0">
                          <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                          <div className="text-sm">{ev.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ev.t).toLocaleString()}
                          </div>
                          {ev.attachments && ev.attachments.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2">
                              {ev.attachments.map((a, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs"
                                >
                                  📎 {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "ticket" && (
                  <div className="p-4 grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm">Modelo de Mensagem</label>
                      <Select
                        value={template}
                        onValueChange={(v) =>
                          setTemplate(v === "none" ? "" : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um modelo (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem modelo</SelectItem>
                          <SelectItem value="atualizacao">
                            Atualização padrão
                          </SelectItem>
                          <SelectItem value="info">
                            Solicitar mais informações
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm">Assunto</label>
                      <input
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm">Mensagem</label>
                      <textarea
                        className="min-h-[120px] w-full rounded-md border border-input bg-background p-3 text-sm"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm">Anexos</label>
                      <input
                        type="file"
                        multiple
                        onChange={(e) =>
                          setFiles(Array.from(e.target.files || []))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={priority}
                          onChange={(e) => setPriority(e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                        Marcar como prioritário
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={ccMe}
                          onChange={(e) => setCcMe(e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                        Enviar cópia para mim
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSendTicket}>
                        <TicketIcon className="size-4" /> Enviar Ticket
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
