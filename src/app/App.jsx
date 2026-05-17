import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Download, Users, ClipboardList, AlertTriangle } from "lucide-react";
import { AsociadasProvider } from "../features/asociadas/AsociadasContext";
import { VisitasProvider } from "../features/visitas/VisitasContext";
import Navbar from "../shared/ui/Navbar";
import MapaPage from "../features/mapa/MapaPage";
import ExportadorAsociadas from "../features/asociadas/components/ExportadorAsociadas";
import ExportadorVisitas from "../features/visitas/components/ExportadorVisitas";
import ImportarPage from "../features/importar/ImportarPage";
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
                  <Route path="/importar" element={<ImportarPage />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </VisitasProvider>
      </AsociadasProvider>
    </BrowserRouter>
  );
}

const EXPORT_TABS = [
  { id: "asociadas", label: "Asociadas", icon: Users },
  { id: "visitas", label: "Visitas", icon: ClipboardList },
];

function ExportacionWrapper() {
  const [tab, setTab] = useState("asociadas");
  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
          <Download className="h-5 w-5" />
          Exportar datos
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Seleccione campos, filtre por sector y exporte en múltiples formatos.</p>
      </div>
      <div className="flex gap-1 mb-4">
        {EXPORT_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
              tab === t.id ? "bg-slate-800 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:shadow-sm"
            }`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      {tab === "asociadas" ? <ExportadorAsociadas /> : <ExportadorVisitas />}
    </section>
  );
}

export default App;
