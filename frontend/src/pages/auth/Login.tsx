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
      <div className="flex min-h-[100svh] w-full items-center justify-center p-0 md:min-h-0 md:p-10">
        <div className="w-full h-full sm:max-w-md sm:mx-auto flex flex-col justify-center px-4 sm:px-0">
          <div className="card-surface w-full h-full sm:h-auto rounded-none sm:rounded-xl p-0 sm:p-8 flex flex-col justify-center overflow-hidden relative">
            <div className="absolute inset-0 flex items-start justify-center pointer-events-none opacity-5 sm:opacity-10">
              <img
                src="https://images.totalpass.com/public/1280x720/czM6Ly90cC1pbWFnZS1hZG1pbi1wcm9kL2d5bXMva2g2OHF6OWNuajloN2lkdnhzcHhhdWx4emFhbWEzYnc3MGx5cDRzZ3p5aTlpZGM0OHRvYnk0YW56azRk"
                alt=""
                className="w-52 h-auto object-contain grayscale"
              />
            </div>

            <div className="login-card relative z-10 w-full h-full bg-card/80 sm:bg-transparent sm:backdrop-blur-sm p-6 sm:p-8 flex flex-col gap-4 items-stretch">
              <div className="mx-auto w-full">
                <div className="text-center sm:text-left">
                  <div className="mx-auto sm:mx-0 mb-2">
                    <img
                      src="https://images.totalpass.com/public/1280x720/czM6Ly90cC1pbWFnZS1hZG1pbi1wcm9kL2d5bXMva2g2OHF6OWNuajloN2lkdnhzcHhhdWx4emFhbWEzYnc3MGx5cDRzZ3p5aTlpZGM0OHRvYnk0YW56azRk"
                      alt="Evoque"
                      className="h-8 mx-auto opacity-90"
                    />
                  </div>

                  <h2 className="text-2xl font-semibold">Painel administrativo</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Acesse com suas credenciais para entrar no sistema.
                  </p>
                </div>
              </div>

              <form onSubmit={submit} className="mt-2 grid gap-4">
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
                  <Link to="/auth/forgot-password" className="text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>

                <Button type="submit" className="w-full h-12 rounded-lg bg-primary text-primary-foreground" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-2 sm:mt-4">
                  © {new Date().getFullYear()} Evoque Fitness — Sistema interno
                </p>
              </form>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            © {new Date().getFullYear()} Evoque Fitness — Sistema interno
          </p>
        </div>
      </div>
    </div>
  );
}
