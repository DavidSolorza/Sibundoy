import { Settings } from "lucide-react";
import AdminDashboard from "./AdminDashboard";

function AdminPage() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
          <Settings className="h-5 w-5" />
          Panel Administrativo
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Estadísticas y control general de las asociadas.</p>
      </div>
      <AdminDashboard />
    </section>
  );
}

export default AdminPage;
