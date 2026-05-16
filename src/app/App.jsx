import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Download, AlertTriangle } from "lucide-react";
import { AsociadasProvider } from "../features/asociadas/AsociadasContext";
import { VisitasProvider } from "../features/visitas/VisitasContext";
import Navbar from "../shared/ui/Navbar";
import MapaPage from "../features/mapa/MapaPage";
import ExportadorAsociadas from "../features/asociadas/components/ExportadorAsociadas";
import { isSupabaseMock } from "../services/supabase";

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
            {isSupabaseMock && (
              <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="font-medium">Supabase no conectado.</span>
                <span>Copia <code className="bg-amber-100 px-1 rounded">.env.example</code> a <code className="bg-amber-100 px-1 rounded">.env</code> y agrega tus credenciales, o configúralas en Vercel.</span>
              </div>
            )}
            <Navbar />
            <main className={`flex-1 overflow-auto px-4 pb-4 md:px-6 md:py-6 ${isSupabaseMock ? 'pt-20' : 'pt-14'}`}>
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
