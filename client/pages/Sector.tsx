import Layout from "@/components/Layout";
import { sectors } from "@/data/sectors";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function SectorPage() {
  const { slug } = useParams<{ slug: string }>();
  const sector = sectors.find((s) => s.slug === slug);

  return (
    <Layout>
      <section className="container py-10 sm:py-14">
        <div className="rounded-xl border border-border/60 bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            {sector?.icon && <sector.icon className="size-8 text-primary" />}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {sector ? sector.title : "Setor"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {sector ? sector.description : "Setor não encontrado."}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 text-sm text-muted-foreground">
            <p>
              Esta página é um espaço para as funcionalidades do {sector ? sector.title : "setor"}.
              Podemos adicionar fluxos de abertura de chamados, formulários, dashboards e integrações conforme sua orientação.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="#setores">Ver todos os setores</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
