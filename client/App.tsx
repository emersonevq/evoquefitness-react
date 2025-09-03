import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SectorPage from "./pages/Sector";
import TiPage from "./pages/sectors/ti/TiPage";
import {
  ComprasPage,
  ManutencaoPage,
  FinanceiroPage,
  MarketingPage,
  ProdutosPage,
  ComercialPage,
  OutrosServicosPage,
} from "./pages/sectors/_placeholders";
import AdminLayout from "./pages/sectors/ti/admin/AdminLayout";
import Overview from "./pages/sectors/ti/admin/Overview";
import {
  Chamados as AdminChamados,
  Usuarios as AdminUsuarios,
  Monitoramento as AdminMonitoramento,
  Integracoes as AdminIntegracoes,
  Sistema as AdminSistema,
  Historico as AdminHistorico,
  Configuracoes as AdminConfiguracoes,
} from "./pages/sectors/ti/admin/Sections";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/setor/ti" element={<TiPage />} />
          <Route path="/setor/ti/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="overview" element={<Overview />} />
            <Route path="chamados" element={<AdminChamados />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="monitoramento" element={<AdminMonitoramento />} />
            <Route path="integracoes" element={<AdminIntegracoes />} />
            <Route path="sistema" element={<AdminSistema />} />
            <Route path="historico" element={<AdminHistorico />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
          </Route>
          <Route path="/setor/compras" element={<ComprasPage />} />
          <Route path="/setor/manutencao" element={<ManutencaoPage />} />
          <Route path="/setor/financeiro" element={<FinanceiroPage />} />
          <Route path="/setor/marketing" element={<MarketingPage />} />
          <Route path="/setor/produtos" element={<ProdutosPage />} />
          <Route path="/setor/comercial" element={<ComercialPage />} />
          <Route
            path="/setor/outros-servicos"
            element={<OutrosServicosPage />}
          />
          <Route path="/setor/:slug" element={<SectorPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
