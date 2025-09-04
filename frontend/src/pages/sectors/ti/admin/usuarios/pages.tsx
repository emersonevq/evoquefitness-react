import { useEffect, useMemo, useState } from "react";
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

  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    usuario: string;
    senha: string;
    nome: string;
  } | null>(null);

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

  const checkAvailability = async (
    type: "email" | "username",
    value: string,
  ) => {
    if (!value) return;
    try {
      setChecking(true);
      const q =
        type === "email"
          ? `email=${encodeURIComponent(value)}`
          : `username=${encodeURIComponent(value)}`;
      const res = await fetch(`/api/usuarios/check-availability?${q}`);
      if (!res.ok) return;
      const data = await res.json();
      if (type === "email") setEmailTaken(!!data.email_exists);
      else setUsernameTaken(!!data.usuario_exists);
    } finally {
      setChecking(false);
    }
  };

  const strengthScore = (
    pwd: string | null,
  ): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: "", color: "bg-muted" };
    let score = 0;
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    if (pwd.length >= 6) score += 1;
    if (hasLower) score += 1;
    if (hasUpper) score += 1;
    if (hasDigit) score += 1;
    const label = score <= 2 ? "Fraca" : score === 3 ? "Média" : "Forte";
    const color =
      score <= 2
        ? "bg-red-500"
        : score === 3
          ? "bg-yellow-500"
          : "bg-green-600";
    return { score, label, color };
  };

  const fetchPassword = async () => {
    const res = await fetch(`/api/usuarios/generate-password`);
    if (!res.ok) throw new Error("Falha ao gerar senha");
    const data = await res.json();
    setGeneratedPassword(data.senha);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    await checkAvailability("email", email);
    await checkAvailability("username", username);
    if (emailTaken || usernameTaken) {
      alert("E-mail ou usuário já cadastrado.");
      return;
    }
    if (!generatedPassword) {
      alert("Clique em 'Gerar senha' antes de salvar.");
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
          senha: generatedPassword,
          nivel_acesso: level,
          setores: selSectors.length ? selSectors : null,
          alterar_senha_primeiro_acesso: forceReset,
        }),
      });
      if (!res.ok) {
        const t = await res.json().catch(() => ({}) as any);
        const detail =
          (t && (t.detail || t.message)) || "Falha ao criar usuário";
        throw new Error(detail);
      }
      const created = await res.json();
      setCreatedUser({
        usuario: created.usuario,
        senha: created.senha,
        nome: `${created.nome} ${created.sobrenome}`,
      });
      setShowSuccess(true);

      setFirst("");
      setLast("");
      setEmail("");
      setUsername("");
      setLevel("Funcionário");
      setSelSectors([]);
      setForceReset(true);
      setEmailTaken(null);
      setUsernameTaken(null);
      setGeneratedPassword(null);
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
              <div className="text-xs text-destructive">
                E-mail já cadastrado
              </div>
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
              <div className="text-xs text-destructive">
                Usuário já cadastrado
              </div>
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

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <Button type="button" variant="secondary" onClick={fetchPassword}>
              Gerar senha
            </Button>
            {generatedPassword && (
              <div className="flex-1 flex items-center gap-3">
                <div className="font-mono text-base tracking-widest px-3 py-2 rounded-md bg-muted select-all">
                  {generatedPassword}
                </div>
                {(() => {
                  const s = strengthScore(generatedPassword);
                  const width = Math.min(100, (s.score / 4) * 100);
                  return (
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded bg-muted overflow-hidden">
                        <div
                          className={`${s.color} h-full`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {s.label}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={!!emailTaken || !!usernameTaken || checking}
          >
            Salvar
          </Button>
        </div>
      </form>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuário criado com sucesso</DialogTitle>
            <DialogDescription>
              Guarde as credenciais abaixo com segurança. Elas serão exibidas
              apenas uma vez.
            </DialogDescription>
          </DialogHeader>
          {createdUser && (
            <div className="space-y-3">
              <div className="text-sm">
                Usuário:{" "}
                <span className="font-medium">{createdUser.usuario}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-lg tracking-widest px-3 py-2 rounded-md bg-muted select-all">
                  {createdUser.senha}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const text = `Usuário: ${createdUser.usuario}\nSenha provisória: ${createdUser.senha}\n\nInstruções: acesse o sistema com estas credenciais e altere sua senha no primeiro acesso.`;
                    navigator.clipboard?.writeText(text);
                  }}
                  className="inline-flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                No primeiro acesso, será solicitado que a senha seja alterada.
              </p>
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
  type ApiUser = {
    id: number;
    nome: string;
    sobrenome: string;
    usuario: string;
    email: string;
    nivel_acesso: string;
    setor: string | null;
  };
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((data: ApiUser[]) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      <div className="card-surface rounded-xl p-4">
        <div className="font-semibold mb-2">Permissões</div>
        <p className="text-muted-foreground text-sm">
          Liste e gerencie os usuários cadastrados.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        )}
        {!loading && users.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        )}
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-border/60 bg-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
              <div className="font-semibold">
                {u.nome} {u.sobrenome}
              </div>
              <span className="text-xs rounded-full px-2 py-0.5 bg-secondary">
                {u.nivel_acesso}
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="text-muted-foreground">Usuário</div>
              <div className="text-right">{u.usuario}</div>
              <div className="text-muted-foreground">E-mail</div>
              <div className="text-right">{u.email}</div>
              <div className="text-muted-foreground">Setor</div>
              <div className="text-right">{u.setor || "—"}</div>
            </div>
          </div>
        ))}
      </div>
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
