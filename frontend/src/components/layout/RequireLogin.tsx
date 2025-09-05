import { useLocation, Navigate } from "react-router-dom";
import { useAuthContext } from "@/lib/auth-context";
import { useState, useEffect } from "react";

export default function RequireLogin({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthContext();

  const [checking, setChecking] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

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
  const pathname = location.pathname || "";
  const sectorMatch = pathname.match(/^\/setor\/(?<slug>[^\/]+)(?:\/.*)?$/);

  useEffect(() => {
    let mounted = true;
    async function refreshPermissions() {
      if (!isAuthenticated || !sectorMatch || !user) {
        setAllowed(null);
        setChecking(false);
        return;
      }
      // Administrators: skip remote check and allow immediately (prevents hang when backend is down)
      if (user.nivel_acesso === "Administrador") {
        if (mounted) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      // Only check when we have a sector to validate
      setChecking(true);
      // Call fast boolean endpoint to check permission
      const controller = new AbortController();
      const timeoutMs = 3000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const slug = sectorMatch!.groups!.slug || "";
        const res = await fetch(`/api/usuarios/${user.id}/has-setor?sector=${encodeURIComponent(slug)}`, { signal: controller.signal });
        if (!res.ok) {
          // if server errored, fallback to client-side cached sectors
          if (mounted) setAllowed(null);
        } else {
          const data = await res.json();
          if (mounted) setAllowed(Boolean(data && data.ok));
        }
      } catch (e) {
        console.warn("has-setor check failed:", e);
        if (mounted) setAllowed(null);
      } finally {
        clearTimeout(timer);
        if (mounted) setChecking(false);
      }
    }
    refreshPermissions();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, sectorMatch, user?.id, pathname]);

  // If a permission check is happening, show loading
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

  // If we performed a check and it's explicitly denied, block (but allow Administrators)
  if (allowed === false) {
    if (user?.nivel_acesso === "Administrador") {
      // administrators bypass permission checks
    } else {
      return <Navigate to="/access-denied" replace />;
    }
  }

  // Se está autenticado ou tem bypass, permitir acesso
  if (isAuthenticated || bypassGate) {
    // Additional authorization: block access to admin pages for non-admins and sectors

    // Admin routes: only Administrador
    if (
      pathname.startsWith("/setor/ti/admin") &&
      user?.nivel_acesso !== "Administrador"
    ) {
      return <Navigate to="/access-denied" replace />;
    }

    // If sectorMatch but we didn't run check yet (allowed === null), fallthrough to allow based on cached user
    if (sectorMatch && sectorMatch.groups) {
      const slug = sectorMatch.groups.slug;
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

      const normalizeStr = (s: any) =>
        typeof s === "string"
          ? s
              .normalize("NFKD")
              .replace(/\p{Diacritic}/gu, "")
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, " ")
              .trim()
          : "";

      const cleanSector = (s: any) => {
        const n = normalizeStr(s);
        return n.replace(/^(setor\s*(de|da|do)\s*)/, "").trim();
      };

      const userSectors = Array.isArray(user?.setores)
        ? user!.setores.map(cleanSector)
        : [];
      const reqNorm = cleanSector(required);

      const has = userSectors.some((s) => {
        if (!s || !reqNorm) return false;
        if (s === reqNorm) return true;
        const sTokens = s.split(/\s+/).filter(Boolean);
        const reqTokens = reqNorm.split(/\s+/).filter(Boolean);
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
