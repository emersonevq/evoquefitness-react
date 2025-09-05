import { useLocation, Navigate } from "react-router-dom";
import { useAuthContext } from "@/lib/auth-context";

export default function RequireLogin({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthContext();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 bg-primary rounded-lg mx-auto mb-4 animate-pulse"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Permitir bypass temporário (para navegação após login)
  const bypassGate = location.state?.bypassGate;

  // Se está autenticado ou tem bypass, permitir acesso
  if (isAuthenticated || bypassGate) {
    // Additional authorization: block access to admin pages for non-admins
    const pathname = location.pathname || "";
    if (pathname.startsWith("/setor/ti/admin") && user?.nivel_acesso !== "Administrador") {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-border/60 bg-card p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Acesso negado</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Você não tem permissão para acessar esta área administrativa.
            </p>
            <a href="/" className="inline-block">
              <button className="rounded-md px-4 py-2 bg-secondary text-secondary-foreground">Voltar ao início</button>
            </a>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  // Redirecionar para login com URL de retorno
  const redirect = location.pathname + location.search;
  return (
    <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  );
}
