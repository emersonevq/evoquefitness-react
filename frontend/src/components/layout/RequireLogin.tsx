import { useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuthContext } from "@/lib/auth-context";

export default function RequireLogin({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [remoteUser, setRemoteUser] = useState<any | null>(null);
  const [checking, setChecking] = useState(false);

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

  // If user is authenticated, fetch latest user info from backend to validate permissions
  useEffect(() => {
    let mounted = true;
    const fetchRemote = async () => {
      if (!isAuthenticated || !user?.id) return;
      setChecking(true);
      try {
        const res = await fetch(`/api/usuarios/${user.id}`);
        if (!res.ok) {
          setRemoteUser(null);
          return;
        }
        const data = await res.json();
        if (mounted) setRemoteUser(data);
      } catch (e) {
        if (mounted) setRemoteUser(null);
      } finally {
        if (mounted) setChecking(false);
      }
    };
    fetchRemote();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.id, location.pathname]);

  // Show loading while checking remote permissions
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 bg-primary rounded-lg mx-auto mb-4 animate-pulse"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and no bypass, redirect to login
  if (!isAuthenticated && !bypassGate) {
    const redirect = location.pathname + location.search;
    return (
      <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
    );
  }

  // Use remoteUser if available, else fallback to local user
  const effectiveUser = remoteUser || user;

  // Additional authorization: block access to admin pages for non-admins and sectors
  const pathname = location.pathname || "";

  // Admin routes: only Administrador
  if (pathname.startsWith("/setor/ti/admin") && effectiveUser?.nivel_acesso !== "Administrador") {
    return <Navigate to="/access-denied" replace />;
  }

  // Sector-level access: /setor/:slug
  const sectorMatch = pathname.match(/^\/setor\/(?<slug>[^\/]+)(?:\/.*)?$/);
  if (sectorMatch && sectorMatch.groups) {
    const slug = sectorMatch.groups.slug;
    // Administrators have full access
    if (effectiveUser?.nivel_acesso === "Administrador") return <>{children}</>;

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
    const userSectors = Array.isArray(effectiveUser?.setores)
      ? effectiveUser!.setores.map(normalize)
      : [];
    const reqNorm = normalize(required);
    const has = userSectors.some((s) => {
      if (!s || !reqNorm) return false;
      return (
        s === reqNorm ||
        s.includes(reqNorm) ||
        reqNorm.includes(s) ||
        s.split(" ").some((tok) => reqNorm.includes(tok)) ||
        reqNorm.split(" ").some((tok) => s.includes(tok))
      );
    });
    if (required && !has) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
}
