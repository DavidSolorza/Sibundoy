import { useState } from "react";
import { Settings, FileText } from "lucide-react";
import AdminDashboard from "./AdminDashboard";

function AdminPage() {
  const [reporteOpen, setReporteOpen] = useState(false);

  return (
    <section>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
            <Settings className="h-5 w-5" />
            Panel Administrativo
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Estadísticas y control general de las asociadas.</p>
        </div>
        <button onClick={() => setReporteOpen(true)} className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 active:bg-slate-900">
          <FileText className="h-4 w-4" /> Informe Ejecutivo
        </button>
      </div>
      <AdminDashboard reporteOpen={reporteOpen} onReporteClose={() => setReporteOpen(false)} onReporteOpen={() => setReporteOpen(true)} />
    </section>
  );
}

export default AdminPage;
