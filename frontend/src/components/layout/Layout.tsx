import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sectors } from "@/data/sectors";
import { ChevronDown, Menu, LogOut } from "lucide-react";
import { useAuthContext } from "@/lib/auth-context";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("auth:refresh", handler as EventListener);
    return () =>
      window.removeEventListener("auth:refresh", handler as EventListener);
  }, []);
  const doLogout = () => {
    try {
      // notify socket that we are logging out
      const s = (window as any).__APP_SOCK__;
      try {
        if (s && s.connected) s.emit("identify", { user_id: null });
      } catch {}
    } catch {}
    logout();
    navigate("/login");
  };
  const isAdminRoute = location.pathname.startsWith("/setor/ti/admin");

  const normalize = (s: any) =>
    typeof s === "string"
      ? s
          .normalize("NFKD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
      : s;
  const slugToKey: Record<string, string> = {
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
  const canAccess = (slug: string) => {
    if (!user) return false;
    if (user.nivel_acesso === "Administrador") return true;
    const required = slugToKey[slug];
    if (!required) return false;
    const req = normalize(required);
    const arr = Array.isArray(user.setores) ? user.setores.map(normalize) : [];
    return arr.some(
      (s) => s && (s === req || s.includes(req) || req.includes(s)),
    );
  };
  const adminGroups = [
    {
      title: "Operação",
      items: [
        { to: "/setor/ti/admin/overview", label: "Visão geral" },
        { to: "/setor/ti/admin/chamados", label: "Gerenciar chamados" },
        { to: "/setor/ti/admin/usuarios", label: "Gerenciar usuários" },
      ],
    },
    {
      title: "Monitoramento",
      items: [
        { to: "/setor/ti/admin/monitoramento", label: "Monitoramento" },
        { to: "/setor/ti/admin/historico", label: "Histórico" },
      ],
    },
    {
      title: "Administração",
      items: [
        { to: "/setor/ti/admin/integracoes", label: "Integrações" },
        { to: "/setor/ti/admin/sistema", label: "Sistema" },
        { to: "/setor/ti/admin/configuracoes", label: "Configurações" },
      ],
    },
  ];
  return (
    <div className="min-h-[100svh] md:min-h-screen w-full flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="h-1 w-full brand-gradient" />
        <div className="container flex items-center justify-between py-3 gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 font-extrabold tracking-tight"
          >
            <img
              src="https://images.totalpass.com/public/1280x720/czM6Ly90cC1pbWFnZS1hZG1pbi1wcm9kL2d5bXMva2g2OHF6OWNuajloN2lkdnhzcHhhdWx4emFhbWEzYnc3MGx5cDRzZ3p5aTlpZGM0OHRvYnk0YW56azRk"
              alt="Evoque Fitness Logo"
              className="h-6 w-auto rounded-sm shadow-sm"
              loading="lazy"
              decoding="async"
            />
            <span className="text-lg">Evoque Fitness</span>
          </Link>
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`
              }
            >
              Início
            </NavLink>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="rounded-full">
                  Setores <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {sectors.map((s) => {
                  const allowed = canAccess(s.slug);
                  const href = user
                    ? `/setor/${s.slug}`
                    : `/login?redirect=/setor/${s.slug}`;
                  return (
                    <Link key={s.slug} to={href}>
                      <DropdownMenuItem
                        className={
                          !user || allowed
                            ? ""
                            : "opacity-50 pointer-events-none"
                        }
                      >
                        {s.title}
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="ml-2 hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/90" />
                  <span>{user?.name || "Administrador"}</span>
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  {user?.email || "admin@evoque.com"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={doLogout} className="text-red-600">
                  <LogOut className="size-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-md">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] p-0">
                <div className="p-4 border-b border-border/60 flex items-center gap-2">
                  <img
                    src="https://images.totalpass.com/public/1280x720/czM6Ly90cC1pbWFnZS1hZG1pbi1wcm9kL2d5bXMva2g2OHF6OWNuajloN2lkdnhzcHhhdWx4emFhbWEzYnc3MGx5cDRzZ3p5aTlpZGM0OHRvYnk0YW56azRk"
                    alt="Evoque Fitness Logo"
                    className="h-6 w-auto rounded-sm"
                  />
                  <span className="font-semibold">Evoque Fitness</span>
                </div>
                <div className="p-4 space-y-2">
                  {isAdminRoute ? (
                    <>
                      {adminGroups.map((g) => (
                        <div key={g.title} className="space-y-2">
                          <div className="px-1 text-xs uppercase text-muted-foreground">
                            {g.title}
                          </div>
                          {g.items.map((i) => (
                            <SheetClose asChild key={i.to}>
                              <Link
                                to={i.to}
                                className="block rounded-md px-3 py-2 bg-secondary hover:bg-secondary/80"
                              >
                                {i.label}
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                      ))}
                      <div className="border-t border-border/60 mt-4 pt-4">
                        <div className="text-xs text-muted-foreground px-1 mb-2">
                          {user?.email || "admin@evoque.com"}
                        </div>
                        <button
                          onClick={doLogout}
                          className="w-full text-left rounded-md px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <LogOut className="size-4" />
                          Sair
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Link
                          to="/"
                          className="block rounded-md px-3 py-2 bg-secondary"
                        >
                          Início
                        </Link>
                      </SheetClose>
                      <div className="mt-2 text-xs uppercase text-muted-foreground px-1">
                        Setores
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {sectors.map((s) => {
                          const allowed = canAccess(s.slug);
                          const href = user
                            ? `/setor/${s.slug}`
                            : `/login?redirect=/setor/${s.slug}`;
                          return (
                            <SheetClose asChild key={s.slug}>
                              <Link
                                to={href}
                                className={`block rounded-md px-3 py-2 hover:bg-secondary ${user && !allowed ? "opacity-50 pointer-events-none" : ""}`}
                                aria-disabled={
                                  user ? String(!allowed) : undefined
                                }
                              >
                                {s.title}
                              </Link>
                            </SheetClose>
                          );
                        })}
                      </div>
                      <div className="border-t border-border/60 mt-4 pt-4">
                        <div className="text-xs text-muted-foreground px-1 mb-2">
                          {user?.email || "admin@evoque.com"}
                        </div>
                        <button
                          onClick={doLogout}
                          className="w-full text-left rounded-md px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <LogOut className="size-4" />
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full">{children}</main>
      <footer className="border-t border-border/60">
        <div className="container py-6 text-xs text-muted-foreground flex items-center justify-between">
          <p>© {new Date().getFullYear()} Evoque Fitness</p>
          <p>Sistema interno</p>
        </div>
      </footer>
    </div>
  );
}
