import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simula envio do e-mail (substituir por integração real)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redireciona para página de sucesso
    navigate("/auth/reset-password-success", {
      state: { email },
      replace: true,
    });
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
              Recupere o acesso à sua conta de forma segura.
            </p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center justify-center mb-8">
            <img
              src="https://images.totalpass.com/public/1280x720/czM6Ly90cC1pbWFnZS1hZG1pbi1wcm9kL2d5bXMva2g2OHF6OWNuajloN2lkdnhzcHhhdWx4emFhbWEzYnc3MGx5cDRzZ3p5aTlpZGM0OHRvYnk0YW56azRk"
              alt="Evoque Fitness Logo"
              className="h-8 w-auto rounded-sm shadow-sm"
            />
          </div>

          <div className="card-surface rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-secondary/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h2 className="text-xl font-semibold">Esqueci minha senha</h2>
                <p className="text-sm text-muted-foreground">
                  Digite seu e-mail para receber instruções de recuperação.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-md"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar instruções"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Lembrou da senha?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Voltar ao login
                </Link>
              </p>
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
