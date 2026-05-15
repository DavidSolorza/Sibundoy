import { Settings } from "lucide-react";
import Admin from "../components/Admin/Admin";

function AdminPage() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Settings className="h-6 w-6" />
          Panel Administrativo
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Estad\u00edsticas y control general de las asociadas.
        </p>
      </div>
      <Admin />
    </section>
  );
}

export default AdminPage;
