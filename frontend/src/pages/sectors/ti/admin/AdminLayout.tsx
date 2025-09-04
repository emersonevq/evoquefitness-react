import Layout from "@/components/layout/Layout";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const groups = [
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

export default function AdminLayout() {
  return (
    <Layout>
      <section className="w-full border-b border-border/60">
        <div className="brand-gradient">
          <div className="container py-8 sm:py-10 flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-foreground">
                Painel administrativo — Setor de TI
              </h1>
              <p className="mt-1 text-primary-foreground/90">
                Métricas, gerenciamento e configurações do setor
              </p>
            </div>
            <div className="pt-1">
              <NotificationBell />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-6 grid grid-cols-1 md:grid-cols-[280px,1fr] gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <nav className="sidebar-nav">
              {groups.map((g) => (
                <div key={g.title} className="sidebar-group">
                  <div className="sidebar-group-title">{g.title}</div>
                  <div className="space-y-2">
                    {g.items.map((i) => (
                      <NavLink
                        key={i.to}
                        to={i.to}
                        className={({ isActive }) =>
                          `sidebar-link ${isActive ? "active" : ""}`
                        }
                      >
                        {i.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {/* Mobile menu */}
          <div className="mb-4 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="rounded-md">
                  <Menu className="size-4" /> Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%]">
                <nav className="mt-6 grid gap-2">
                  {groups.flatMap((g) => [
                    <div
                      key={`${g.title}-title`}
                      className="px-3 text-xs uppercase tracking-wide text-muted-foreground/80 mt-3"
                    >
                      {g.title}
                    </div>,
                    ...g.items.map((i) => (
                      <Link
                        key={i.to}
                        to={i.to}
                        className="rounded-md px-3 py-2 bg-secondary hover:bg-secondary/80"
                      >
                        {i.label}
                      </Link>
                    )),
                  ])}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <Outlet />
        </div>
      </section>
    </Layout>
  );
}
