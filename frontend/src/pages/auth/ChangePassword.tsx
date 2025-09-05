import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ChangePassword() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) return alert("Senha deve ter ao menos 6 caracteres");
    if (senha !== senhaConfirm) return alert("Senhas não conferem");
    setLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${user.id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (!res.ok) {
        const t = await res.json().catch(() => ({} as any));
        throw new Error((t && (t.detail || t.message)) || "Falha ao alterar senha");
      }
      alert("Senha alterada com sucesso. Faça login novamente.");
      logout();
      navigate("/login");
    } catch (err: any) {
      alert(err?.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="card-surface rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Alterar senha</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Você precisa alterar sua senha antes de continuar.
          </p>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                >
                  {show ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Confirmar nova senha</Label>
              <Input
                type={show ? "text" : "password"}
                value={senhaConfirm}
                onChange={(e) => setSenhaConfirm(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { logout(); navigate('/login'); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
