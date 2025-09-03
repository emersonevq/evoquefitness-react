import { useMemo, useState } from "react";
import { usuariosMock } from "../mock";
import { sectors } from "@/data/sectors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";

export function CriarUsuario() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [level, setLevel] = useState("Funcionário");
  const [selSectors, setSelSectors] = useState<string[]>([]);
  const [forceReset, setForceReset] = useState(true);

  const [emailTaken, setEmailTaken] = useState<boolean | null>(null);
  const [usernameTaken, setUsernameTaken] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ usuario: string; senha: string; nome: string } | null>(null);

  const allSectors = useMemo(() => sectors.map((s) => s.title), []);

  const generateUsername = () => {
    const base = (first + "." + last).trim().toLowerCase().replace(/\s+/g, ".");
    const safe = base || email.split("@")[0] || "usuario";
    setUsername(safe.normalize("NFD").replace(/[^\w.]+/g, ""));
  };

  const toggleSector = (name: string) => {
    setSelSectors((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const checkAvailability = async (type: "email" | "username", value: string) => {
    if (!value) return;
    try {
      setChecking(true);
      const q = type === "email" ? `email=${encodeURIComponent(value)}` : `username=${encodeURIComponent(value)}`;
      const res = await fetch(`/api/usuarios/check-availability?${q}`);
      if (!res.ok) return;
      const data = await res.json();
      if (type === "email") setEmailTaken(!!data.email_exists);
      else setUsernameTaken(!!data.usuario_exists);
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check availability before submit
    await checkAvailability("email", email);
    await checkAvailability("username", username);
    if (emailTaken || usernameTaken) {
      alert("E-mail ou usuário já cadastrado.");
      return;
    }

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: first,
          sobrenome: last,
          usuario: username,
          email,
          senha: null,
          nivel_acesso: level,
          setores: selSectors.length ? selSectors : null,
          alterar_senha_primeiro_acesso: forceReset,
        }),
      });
      if (!res.ok) {
        const t = await res.json().catch(() => ({} as any));
        const detail = (t && (t.detail || t.message)) || "Falha ao criar usuário";
        throw new Error(detail);
      }
      const created = await res.json();
      setCreatedUser({ usuario: created.usuario, senha: created.senha, nome: `${created.nome} ${created.sobrenome}` });
      setShowSuccess(true);

      // Reset form
      setFirst("");
      setLast("");
      setEmail("");
      setUsername("");
      setLevel("Funcionário");
      setSelSectors([]);
      setForceReset(true);
      setEmailTaken(null);
      setUsernameTaken(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Não foi possível criar o usuário.");
    }
  };

  return (
    <div className="card-surface rounded-xl p-4 sm:p-6">
      <div className="text-xl font-semibold mb-2">Formulário de cadastro</div>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first">Nome</Label>
            <Input
              id="first"
              placeholder="Digite o nome"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last">Sobrenome</Label>
            <Input
              id="last"
              placeholder="Digite o sobrenome"
              value={last}
              onChange={(e) => setLast(e.target.value)}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="Digite o e-mail"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailTaken(null);
              }}
              onBlur={() => checkAvailability("email", email)}
            />
            {emailTaken && (
              <div className="text-xs text-destructive">E-mail já cadastrado</div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                placeholder="Digite o nome de usuário"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameTaken(null);
                }}
                onBlur={() => checkAvailability("username", username)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={generateUsername}
              >
                Gerar
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Digite manualmente ou clique no botão para gerar automaticamente
            </div>
            {usernameTaken && (
              <div className="text-xs text-destructive">Usuário já cadastrado</div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nível de acesso</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Coordenador">Coordenador</SelectItem>
                <SelectItem value="Gestor">Gestor</SelectItem>
                <SelectItem value="Funcionário">Funcionário</SelectItem>
                <SelectItem value="Gerente">Gerente</SelectItem>
                <SelectItem value="Gerente regional">
                  Gerente regional
                </SelectItem>
                <SelectItem value="Agente de suporte">
                  Agente de suporte
                </SelectItem>
                <SelectItem value="Administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Setor(es)</Label>
            <div className="rounded-md border border-border/60 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {allSectors.map((s) => (
                <label key={s} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border bg-background"
                    checked={selSectors.includes(s)}
                    onChange={() => toggleSector(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={forceReset}
              onChange={(e) => setForceReset(e.target.checked)}
            />
            Solicitar alteração de senha no primeiro acesso
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" disabled={!!emailTaken || !!usernameTaken || checking}>Salvar</Button>
        </div>
      </form>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuário criado com sucesso</DialogTitle>
            <DialogDescription>
              Guarde a senha abaixo com segurança. Ela será exibida apenas uma vez.
            </DialogDescription>
          </DialogHeader>
          {createdUser && (
            <div className="space-y-3">
              <div className="text-sm">Usuário: <span className="font-medium">{createdUser.usuario}</span></div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-lg tracking-widest px-3 py-2 rounded-md bg-muted select-all">
                  {createdUser.senha}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigator.clipboard?.writeText(createdUser.senha)}
                  className="inline-flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
