import Layout from "@/components/layout/Layout";
import { sectors } from "@/data/sectors";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";

const sector = sectors.find((s) => s.slug === "ti")!;

interface Ticket {
  id: string;
  protocolo: string;
  data: string;
  problema: string;
  status: string;
}

export default function TiPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [open, setOpen] = useState(false);
  const [unidades, setUnidades] = useState<
    { id: number; nome: string; cidade: string }[]
  >([]);
  const [problemas, setProblemas] = useState<
    { id: number; nome: string; prioridade: string; requer_internet: boolean }[]
  >([]);

  useEffect(() => {
    fetch("/api/unidades")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((data) => Array.isArray(data) && setUnidades(data))
      .catch(() => setUnidades([]));
    fetch("/api/problemas")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((data) => Array.isArray(data) && setProblemas(data))
      .catch(() => setProblemas([]));
  }, []);

  return (
    <Layout>
      <section className="w-full">
        <div className="brand-gradient">
          <div className="container py-10 sm:py-14">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-foreground drop-shadow">
              {sector.title}
            </h1>
            <p className="mt-2 text-primary-foreground/90 max-w-2xl">
              {sector.description}
            </p>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="md:hidden">
            <Button asChild variant="secondary" className="rounded-full">
              <Link to="/setor/ti/admin">Painel administrativo</Link>
            </Button>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">
            Histórico de chamados
          </h2>
          <div className="hidden md:block">
            <Button asChild className="mr-2 rounded-full">
              <Link to="/setor/ti/admin">Painel administrativo</Link>
            </Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">Abrir novo chamado</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Abrir chamado</DialogTitle>
              </DialogHeader>
              <TicketForm
                problemas={problemas}
                unidades={unidades}
                onSubmit={async (payload) => {
                  try {
                    const res = await fetch("/api/chamados", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        solicitante: payload.nome,
                        cargo: payload.cargo,
                        gerente: payload.gerente,
                        email: payload.email,
                        telefone: payload.telefone,
                        unidade: payload.unidade,
                        problema: payload.problema,
                        internetItem: payload.internetItem || null,
                        visita: payload.visita || null,
                        descricao: null,
                      }),
                    });
                    if (!res.ok) throw new Error("Falha ao criar chamado");
                    const created: {
                      id: number;
                      protocolo: string;
                      data_abertura: string;
                      problema: string;
                      internet_item?: string | null;
                      status: string;
                    } = await res.json();

                    const problemaFmt =
                      created.problema === "Internet" && created.internet_item
                        ? `Internet - ${created.internet_item}`
                        : created.problema;

                    setTickets((prev) => [
                      {
                        id: String(created.id),
                        protocolo: created.protocolo,
                        data:
                          created.data_abertura?.slice(0, 10) ||
                          new Date().toISOString().slice(0, 10),
                        problema: problemaFmt,
                        status: created.status,
                      },
                      ...prev,
                    ]);
                    setOpen(false);
                  } catch (e) {
                    console.error(e);
                    alert("Não foi possível abrir o chamado. Tente novamente.");
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border/60 bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Protocolo</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Problema</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-muted-foreground"
                    colSpan={6}
                  >
                    Você ainda não abriu nenhum chamado.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="px-4 py-3">{t.id}</td>
                    <td className="px-4 py-3">{t.protocolo}</td>
                    <td className="px-4 py-3">
                      {new Date(t.data).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{t.problema}</td>
                    <td className="px-4 py-3">{t.status}</td>
                    <td className="px-4 py-3">
                      <Button variant="secondary" size="sm">
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}

function TicketForm(
  props: {
    problemas?: { id: number; nome: string; prioridade: string; requer_internet: boolean }[];
    unidades?: { id: number; nome: string; cidade: string }[];
    onSubmit: (payload: {
      nome: string;
      cargo: string;
      gerente: string;
      email: string;
      telefone: string;
      unidade: string;
      problema: string;
      internetItem?: string;
      visita: string;
    }) => void;
  },
) {
  const { onSubmit } = props;
  const listaProblemas = Array.isArray(props.problemas) ? props.problemas : [];
  const listaUnidades = Array.isArray(props.unidades) ? props.unidades : [];
  const [form, setForm] = useState({
    nome: "",
    cargo: "",
    gerente: "",
    email: "",
    telefone: "",
    unidade: "",
    problema: "",
    internetItem: "",
    visita: "",
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const selectedProblem = useMemo(
    () => listaProblemas.find((p) => p.nome === form.problema) || null,
    [listaProblemas, form.problema],
  );

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="nome">Nome do solicitante</Label>
        <Input
          id="nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cargo">Cargo</Label>
          <Select
            value={form.cargo}
            onValueChange={(v) => setForm({ ...form, cargo: v })}
          >
            <SelectTrigger id="cargo">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Coordenador">Coordenador</SelectItem>
              <SelectItem value="Funcionário">Funcionário</SelectItem>
              <SelectItem value="Gerente">Gerente</SelectItem>
              <SelectItem value="Gerente regional">Gerente regional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gerente">Gerente</Label>
          <Input
            id="gerente"
            placeholder="Nome do gerente"
            value={form.gerente}
            onChange={(e) => setForm({ ...form, gerente: e.target.value })}
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="11987654321"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Selecione a unidade</Label>
          <Select
            value={form.unidade}
            onValueChange={(v) => setForm({ ...form, unidade: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {listaUnidades.length === 0 ? (
                <>
                  <SelectItem value="Centro">Centro</SelectItem>
                  <SelectItem value="Zona Sul">Zona Sul</SelectItem>
                  <SelectItem value="Zona Norte">Zona Norte</SelectItem>
                  <SelectItem value="Zona Leste">Zona Leste</SelectItem>
                </>
              ) : (
                listaUnidades.map((u) => (
                  <SelectItem key={u.id} value={u.nome}>
                    {u.nome}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Problema Reportado</Label>
          <Select
            value={form.problema}
            onValueChange={(v) => setForm({ ...form, problema: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {listaProblemas.length === 0 ? (
                <>
                  <SelectItem value="Catraca">Catraca</SelectItem>
                  <SelectItem value="CFTV">CFTV</SelectItem>
                  <SelectItem value="Internet">Internet</SelectItem>
                  <SelectItem value="Notebook/Desktop">
                    Notebook/Desktop
                  </SelectItem>
                  <SelectItem value="Sistema EVO">Sistema EVO</SelectItem>
                  <SelectItem value="Som">Som</SelectItem>
                  <SelectItem value="Totalpass/Gympass">
                    Totalpass/Gympass
                  </SelectItem>
                  <SelectItem value="TVs">TVs</SelectItem>
                </>
              ) : (
                listaProblemas.map((p) => (
                  <SelectItem key={p.id} value={p.nome}>
                    {p.nome}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProblem?.requer_internet && (
        <div className="grid gap-2">
          <Label>Selecione o item de Internet</Label>
          <Select
            value={form.internetItem}
            onValueChange={(v) => setForm({ ...form, internetItem: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Antenas">Antenas</SelectItem>
              <SelectItem value="Cabo de rede">Cabo de rede</SelectItem>
              <SelectItem value="DVR">DVR</SelectItem>
              <SelectItem value="Roteador/Modem">Roteador/Modem</SelectItem>
              <SelectItem value="Switch">Switch</SelectItem>
              <SelectItem value="Wi-fi">Wi-fi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="visita">Visita Técnica</Label>
        <Input
          id="visita"
          type="date"
          placeholder="dd/mm/aaaa"
          value={form.visita}
          onChange={(e) => setForm({ ...form, visita: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
