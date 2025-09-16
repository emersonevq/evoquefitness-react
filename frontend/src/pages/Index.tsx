import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sectors } from "@/data/sectors";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/lib/auth-context";

export default function Index() {
  const { user } = useAuthContext();

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
    return arr.some((s) => s && (s === req || s.includes(req) || req.includes(s)));
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container py-8 sm:py-16">
          <div className="rounded-2xl brand-gradient px-4 py-8 sm:px-12 sm:py-16 shadow-xl">
            <div className="text-center">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-foreground drop-shadow-md">
                Evoque Fitness
              </h1>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-primary-foreground/90">
                Explore nossos setores e eleve sua experiência com serviços
                personalizados!
              </p>
              <div className="mt-6 sm:mt-8 flex items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="lg"
                      className="rounded-full bg-background text-foreground hover:bg-background/90"
                    >
                      Escolher Setor <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    {sectors.map((s) => {
                      const allowed = canAccess(s.slug);
                      const href = user
                        ? `/setor/${s.slug}`
                        : `/login?redirect=/setor/${s.slug}`;
                      return (
                        <Link key={s.slug} to={href}>
                          <DropdownMenuItem className={!user || allowed ? "" : "opacity-50 pointer-events-none"}>
                            {s.title}
                          </DropdownMenuItem>
                        </Link>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sectors Grid */}
      <section id="setores" className="pb-16">
        <div className="container">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Nossos setores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {sectors.map((s) => {
              const allowed = canAccess(s.slug);
              const href = user ? `/setor/${s.slug}` : `/login?redirect=/setor/${s.slug}`;
              return (
                <Link
                  to={href}
                  key={s.slug}
                  className={`card-surface group rounded-xl p-5 transition hover:shadow-lg hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring ${user && !allowed ? "opacity-50 pointer-events-none" : ""}`}
                  aria-disabled={user ? String(!allowed) : undefined}
                >
                  <div className="flex items-center gap-3">
                    <s.icon className="size-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{s.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
