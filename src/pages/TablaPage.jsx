import { ClipboardList, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import Tabla from "../components/Table/Tabla";

function TablaPage() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ClipboardList className="h-6 w-6" />
          Tabla de Informaci\u00f3n
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Gesti\u00f3n completa de los registros de asociadas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registros de Asociadas
          </CardTitle>
        </CardHeader>
        <Tabla />
      </Card>
    </section>
  );
}

export default TablaPage;
