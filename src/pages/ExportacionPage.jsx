import { Download, FileSpreadsheet } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import Exportacion from "../components/Export/Exportacion";

function ExportacionPage() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Download className="h-6 w-6" />
          Exportación de Datos
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Descargue la información de las asociadas en formato Excel.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Descargar Reporte
          </CardTitle>
        </CardHeader>
        <Exportacion />
      </Card>
    </section>
  );
}

export default ExportacionPage;
