export function SLA() {
  return (
    <div className="card-surface rounded-xl p-4 text-sm space-y-3">
      <div className="font-semibold">Configurações de SLA</div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-muted-foreground">SLA de resposta</div>
          <input
            className="rounded-md bg-background border px-3 py-2 w-full"
            defaultValue="30 min"
          />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">SLA de resolução</div>
          <input
            className="rounded-md bg-background border px-3 py-2 w-full"
            defaultValue="30 h"
          />
        </div>
        <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 self-end">
          Salvar
        </button>
      </div>
    </div>
  );
}
export function Prioridades() {
  return <Panel title="Prioridades dos Problemas" />;
}
export function Notificacoes() {
  return <Panel title="Notificações" />;
}
export function Sistema() {
  return <Panel title="Sistema" />;
}
export function Seguranca() {
  return <Panel title="Segurança" />;
}
export function Chamados() {
  return <Panel title="Chamados" />;
}
export function Email() {
  return <Panel title="Configurações de E-mail" />;
}
export function Integracoes() {
  return <Panel title="Integrações" />;
}
export function Acoes() {
  return <Panel title="Ações do Sistema" />;
}

function Panel({ title }: { title: string }) {
  return (
    <div className="card-surface rounded-xl p-4 text-sm">
      <div className="font-semibold mb-2">{title}</div>
      <p className="text-muted-foreground">
        Configurações mock para {title.toLowerCase()}.
      </p>
    </div>
  );
}
