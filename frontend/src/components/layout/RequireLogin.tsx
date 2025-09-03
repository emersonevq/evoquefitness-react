import { useLocation, Navigate } from "react-router-dom";
import { useAuthContext } from "@/lib/auth-context";

export default function RequireLogin({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthContext();

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
    return <>{children}</>;
  }

  // Redirecionar para login com URL de retorno
  const redirect = location.pathname + location.search;
  return (
    <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  );
}
