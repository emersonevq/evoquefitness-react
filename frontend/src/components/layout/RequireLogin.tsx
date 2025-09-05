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
    // Additional authorization: block access to admin pages for non-admins and sectors
    const pathname = location.pathname || "";

    // Admin routes: only Administrador
    if (
      pathname.startsWith("/setor/ti/admin") &&
      user?.nivel_acesso !== "Administrador"
    ) {
      return <Navigate to="/access-denied" replace />;
    }

    // Sector-level access: /setor/:slug
    const sectorMatch = pathname.match(/^\/setor\/(?<slug>[^\/]+)(?:\/.*)?$/);
    if (sectorMatch && sectorMatch.groups) {
      const slug = sectorMatch.groups.slug;
      // Administrators have full access
      if (user?.nivel_acesso === "Administrador") return <>{children}</>;

      // Map slug to normalized sector name (same mapping used in backend)
      const mapa: Record<string, string> = {
        ti: "TI",
        compras: "Compras",
        manutencao: "Manutencao",
        financeiro: "Financeiro",
        marketing: "Marketing",
        produtos: "Produtos",
        comercial: "Comercial",
        "outros-servicos": "Outros",
        servicos: "Outros",
      };
      const required = mapa[slug || ""];
      const normalize = (s: any) =>
        typeof s === "string"
          ? s
              .normalize("NFKD")
              .replace(/\p{Diacritic}/gu, "")
              .toLowerCase()
          : s;
      const userSectors = Array.isArray(user?.setores)
        ? user!.setores.map(normalize)
        : [];
      const reqNorm = normalize(required);
      // Prefer strict matching: exact match or shared whole-word tokens
      const has = userSectors.some((s) => {
        if (!s || !reqNorm) return false;
        if (s === reqNorm) return true;
        const sTokens = s.split(/\s+/).filter(Boolean);
        const reqTokens = reqNorm.split(/\s+/).filter(Boolean);
        // any whole token match
        if (sTokens.some((tok) => reqTokens.includes(tok))) return true;
        if (reqTokens.some((tok) => sTokens.includes(tok))) return true;
        return false;
      });
      if (required && !has) {
        return <Navigate to="/access-denied" replace />;
      }
    }

    return <>{children}</>;
  }

  // Redirecionar para login com URL de retorno
  const redirect = location.pathname + location.search;
  return (
    <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  );
}
