import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/lib/auth-context";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result: any = await login(email, password, remember);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/";
      // If server indicates password change required, go to change-password
      if (result && result.alterar_senha_primeiro_acesso) {
        navigate("/auth/change-password", { replace: true });
      } else {
        navigate(redirect, { replace: true });
      }
    } catch (err: any) {
      alert(err?.message || "Falha ao autenticar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] w-full grid md:grid-cols-2 bg-background">
      {/* Brand side (desktop) */}
      <div className="hidden md:flex items-center justify-center p-10">
        <div className="w-full h-full rounded-2xl brand-gradient flex items-center justify-center">
          <div className="max-w-md text-center text-primary-foreground px-8">
            <img
              src="https://images.totalpass.com/public/1280x720/czM6Ly90cC1pbWFnZS1hZG1pbi1wcm9kL2d5bXMva2g2OHF6OWNuajloN2lkdnhzcHhhdWx4emFhbWEzYnc3MGx5cDRzZ3p5aTlpZGM0OHRvYnk0YW56azRk"
              alt="Evoque Fitness Logo"
              className="h-10 w-auto mx-auto mb-6 rounded-sm shadow-sm"
            />
            <h1 className="text-3xl font-extrabold drop-shadow">
              Evoque Fitness
            </h1>
            <p className="mt-3 text-sm/6 opacity-90">
              Acesse seu painel para gerenciar chamados e acompanhar métricas do
              setor.
            </p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="card-surface rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Entrar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use suas credenciais para acessar o ERP.
            </p>
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="identifier">E-mail ou usuário</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="E-mail ou nome de usuário"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border bg-background"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Lembrar-me
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-primary hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-md"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            © {new Date().getFullYear()} Evoque Fitness — Sistema interno
          </p>
        </div>
      </div>
    </div>
  );
}
