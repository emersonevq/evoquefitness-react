import { unidadesMock } from "../mock";

export function AdicionarUnidade() {
  return (
    <div className="card-surface rounded-xl p-4 space-y-3 text-sm">
      <div className="font-semibold">Adicionar unidade</div>
      <div className="grid sm:grid-cols-3 gap-3">
        <input className="rounded-md bg-background border px-3 py-2" placeholder="Nome" />
        <input className="rounded-md bg-background border px-3 py-2" placeholder="Cidade" />
        <button className="rounded-md bg-primary text-primary-foreground px-4 py-2">Adicionar</button>
      </div>
    </div>
  );
}
export function ListarUnidades() {
  return (
    <div className="card-surface rounded-xl p-4">
      <div className="font-semibold mb-2">Unidades</div>
      <ul className="text-sm grid sm:grid-cols-2 gap-2">
        {unidadesMock.map((u) => (
          <li key={u.id} className="rounded-md border border-border/60 p-3 bg-background">{u.nome} — {u.cidade}</li>
        ))}
      </ul>
    </div>
  );
}
export function AdicionarBanco() {
  return (
    <div className="card-surface rounded-xl p-4 text-sm">
      <div className="font-semibold mb-2">Adicionar ao banco</div>
      <p className="text-muted-foreground">Endpoint de integração (mock).</p>
    </div>
  );
}
