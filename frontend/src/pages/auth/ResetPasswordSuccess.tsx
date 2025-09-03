import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";

export default function ResetPasswordSuccess() {
  const location = useLocation();
  const email = location.state?.email || "";

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
              Instruções de recuperação enviadas com sucesso.
            </p>
          </div>
        </div>
      </div>

      {/* Content side */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center justify-center mb-8">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-primary-foreground">E</span>
            </div>
          </div>

          <div className="card-surface rounded-xl p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-2">E-mail enviado!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enviamos instruções para recuperação da senha para o e-mail:
            </p>

            {email && (
              <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-secondary/50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{email}</span>
              </div>
            )}

            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>Próximos passos:</strong>
              </p>
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  Verifique sua caixa de entrada (incluindo spam/lixo
                  eletrônico)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  Clique no link de recuperação no e-mail
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  Crie uma nova senha segura
                </li>
              </ul>
            </div>

            <div className="mt-8 space-y-3">
              <Button asChild className="w-full h-11 rounded-md">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao login
                </Link>
              </Button>

              <p className="text-xs text-muted-foreground">
                Não recebeu o e-mail?{" "}
                <Link
                  to="/auth/forgot-password"
                  className="text-primary hover:underline"
                >
                  Tentar novamente
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
