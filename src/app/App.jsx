import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Download } from "lucide-react";
import { AsociadasProvider } from "../features/asociadas/AsociadasContext";
import { VisitasProvider } from "../features/visitas/VisitasContext";
import Navbar from "../shared/ui/Navbar";
import MapaPage from "../features/mapa/MapaPage";
import ExportadorAsociadas from "../features/asociadas/components/ExportadorAsociadas";

const HuertasPage = lazy(() => import("../features/huertas/HuertasPage"));
const AdminPage = lazy(() => import("../features/admin/AdminPage"));
const VisitasPage = lazy(() => import("../features/visitas/VisitasPage"));
const PerfilAsociadaPage = lazy(() => import("../features/perfil/PerfilAsociadaPage"));

function App() {
  return (
    <BrowserRouter>
      <AsociadasProvider>
        <VisitasProvider>
          <div className="min-h-screen bg-slate-50 md:flex">
            <Navbar />
            <main className="flex-1 overflow-auto px-4 pb-4 pt-14 md:px-6 md:py-6">
              <Suspense fallback={
                <div className="flex items-center justify-center py-20">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
                </div>
              }>
                <Routes>
                  <Route path="/" element={<MapaPage />} />
                  <Route path="/huertas" element={<HuertasPage />} />
                  <Route path="/visitas" element={<VisitasPage />} />
                  <Route path="/asociada/:id" element={<PerfilAsociadaPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/exportacion" element={<ExportacionWrapper />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </VisitasProvider>
      </AsociadasProvider>
    </BrowserRouter>
  );
}

function ExportacionWrapper() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
          <Download className="h-5 w-5" />
          Exportar datos
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Seleccione campos, filtre por sector y exporte en múltiples formatos.</p>
      </div>
      <ExportadorAsociadas />
    </section>
  );
}

export default App;
