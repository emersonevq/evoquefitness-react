import { usuariosMock } from "../mock";

export function CriarUsuario() {
  return (
    <div className="card-surface rounded-xl p-4 space-y-3">
      <div className="font-semibold">Criar usuário</div>
      <div className="text-sm text-muted-foreground">
        Formulário de criação (mock). Em breve integraremos ao backend.
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <input
          className="rounded-md bg-background border px-3 py-2"
          placeholder="Nome"
        />
        <input
          className="rounded-md bg-background border px-3 py-2"
          placeholder="E-mail"
        />
        <select className="rounded-md bg-background border px-3 py-2 col-span-full">
          <option>Perfil</option>
          <option>Administrador</option>
          <option>Agente</option>
          <option>Padrão</option>
        </select>
        <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 w-fit">
          Salvar
        </button>
      </div>
    </div>
  );
}

export function Bloqueios() {
  const bloqueados = usuariosMock.filter((u) => u.bloqueado);
  return (
    <div className="card-surface rounded-xl p-4">
      <div className="font-semibold mb-2">Usuários bloqueados</div>
      <ul className="text-sm space-y-2">
        {bloqueados.length ? (
          bloqueados.map((u) => (
            <li key={u.id}>
              {u.nome} — {u.email}
            </li>
          ))
        ) : (
          <li className="text-muted-foreground">Nenhum bloqueio.</li>
        )}
      </ul>
    </div>
  );
}

export function Permissoes() {
  return (
    <div className="card-surface rounded-xl p-4 text-sm">
      <div className="font-semibold mb-2">Permissões</div>
      <p className="text-muted-foreground">Defina perfis e escopos (mock).</p>
    </div>
  );
}

export function Agentes() {
  const agentes = usuariosMock.filter((u) => u.perfil === "Agente");
  return (
    <div className="card-surface rounded-xl p-4 text-sm">
      <div className="font-semibold mb-2">Agentes de Suporte</div>
      <ul className="space-y-2">
        {agentes.map((a) => (
          <li key={a.id}>
            {a.nome} — {a.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Grupos() {
  return (
    <div className="card-surface rounded-xl p-4 text-sm">
      <div className="font-semibold mb-2">Grupos de Usuários</div>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        <li>Administradores</li>
        <li>Agentes N1</li>
        <li>Agentes N2</li>
        <li>Gestores</li>
      </ul>
    </div>
  );
}
