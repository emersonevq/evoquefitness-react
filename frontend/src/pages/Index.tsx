import Layout from "@/components/Layout";
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

export default function Index() {
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
                    {sectors.map((s) => (
                      <Link key={s.slug} to={`/setor/${s.slug}`}>
                        <DropdownMenuItem>{s.title}</DropdownMenuItem>
                      </Link>
                    ))}
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
            {sectors.map((s) => (
              <Link
                to={`/login?redirect=/setor/${s.slug}`}
                key={s.slug}
                className="card-surface group rounded-xl p-5 transition hover:shadow-lg hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring"
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
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
