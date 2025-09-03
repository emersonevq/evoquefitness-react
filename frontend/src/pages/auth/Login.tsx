import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/";
    navigate(redirect, { state: { bypassGate: true }, replace: true });
  };

  return (
    <div className="min-h-[100svh] w-full grid md:grid-cols-2 bg-background">
      {/* Brand side (desktop) */}
      <div className="hidden md:flex items-center justify-center p-10">
        <div className="w-full h-full rounded-2xl brand-gradient flex items-center justify-center">
          <div className="max-w-md text-center text-primary-foreground px-8">
            <div className="h-12 w-12 bg-primary rounded-xl mx-auto mb-6 flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold text-primary-foreground">E</span>
            </div>
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
          {/* Mobile logo */}
          <div className="md:hidden flex items-center justify-center mb-8">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-primary-foreground">E</span>
            </div>
          </div>

          <div className="card-surface rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Entrar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use suas credenciais para acessar o ERP.
            </p>
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
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
              <Button type="submit" className="w-full h-11 rounded-md">
                Entrar
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
