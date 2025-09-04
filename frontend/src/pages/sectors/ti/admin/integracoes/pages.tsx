import { useEffect, useState } from "react";

export function AdicionarUnidade() {
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleAdd() {
    setMsg(null);
    if (!nome || !cidade) return;
    setSaving(true);
    try {
      const res = await fetch("/api/unidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cidade }),
      });
      if (!res.ok) throw new Error("Falha ao criar unidade");
      setNome("");
      setCidade("");
      setMsg("Unidade criada com sucesso.");
    } catch {
      setMsg("Não foi possível criar a unidade.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card-surface rounded-xl p-4 space-y-3 text-sm">
      <div className="font-semibold">Adicionar unidade</div>
      <div className="grid sm:grid-cols-3 gap-3">
        <input
          className="rounded-md bg-background border px-3 py-2"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className="rounded-md bg-background border px-3 py-2"
          placeholder="Cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
        />
        <button
          disabled={saving}
          onClick={handleAdd}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Adicionar"}
        </button>
      </div>
      {msg && <div className="text-xs text-muted-foreground">{msg}</div>}
    </div>
  );
}
export function ListarUnidades() {
  type Unidade = { id: number; nome: string; cidade: string };
  const [items, setItems] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/unidades")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((data: Unidade[]) => Array.isArray(data) && setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card-surface rounded-xl p-4">
      <div className="font-semibold mb-2">Unidades</div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">Nenhuma unidade.</div>
      ) : (
        <ul className="text-sm grid sm:grid-cols-2 gap-2">
          {items.map((u) => (
            <li
              key={u.id}
              className="rounded-md border border-border/60 p-3 bg-background"
            >
              {u.nome} — {u.cidade}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export function AdicionarBanco() {
  type Problema = {
    id: number;
    nome: string;
    prioridade: string;
    requer_internet: boolean;
  };
  const [items, setItems] = useState<Problema[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");
  const [requer, setRequer] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/problemas")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((data: Problema[]) => Array.isArray(data) && setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nome) return;
    setSaving(true);
    try {
      const res = await fetch("/api/problemas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, prioridade, requer_internet: requer }),
      });
      if (!res.ok) throw new Error("Falha ao criar problema");
      setNome("");
      setPrioridade("Normal");
      setRequer(false);
      load();
    } catch {
      // noop, UI simples
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="card-surface rounded-xl p-4 text-sm">
        <div className="font-semibold mb-2">Adicionar Novo Problema</div>
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-3">
          <input
            className="rounded-md bg-background border px-3 py-2"
            placeholder="Nome do Problema (Ex: Impressora)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <select
            className="rounded-md bg-background border px-3 py-2"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
          >
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica</option>
            <option value="Baixa">Baixa</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requer}
              onChange={(e) => setRequer(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Requer item de internet
          </label>
          <div className="sm:col-span-3">
            <button
              disabled={saving}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </div>

      <div className="card-surface rounded-xl p-4 text-sm">
        <div className="font-semibold mb-2">Problemas Cadastrados</div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum problema.</div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {items.map((p) => (
              <li
                key={`${p.id}-${p.nome}`}
                className="rounded-md border border-border/60 p-3 bg-background"
              >
                <div className="font-medium">{p.nome}</div>
                <div className="text-xs text-muted-foreground">
                  {p.prioridade}
                  {p.requer_internet ? " • Internet" : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
