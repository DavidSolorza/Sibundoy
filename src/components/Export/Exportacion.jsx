import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import useAsociadas from "../../hooks/useAsociadas";
import Button from "../ui/Button";

function Exportacion() {
  const { asociadas } = useAsociadas();

  const exportToExcel = () => {
    const data = asociadas.map((a) => ({
      Nombre: a.nombre,
      Edad: a.edad,
      Teléfono: a.telefono,
      "Núm. Personas": a.numPersonas,
      Sector: a.sector,
      "Área Huerta": a.areaHuerta,
      Productos: a.productos,
      "Fecha Siembra": a.fechaSiembra,
      "Última Visita": a.fechaUltimaVisita,
      Visitas: a.numVisitas,
      Observaciones: a.observaciones,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asociadas");
    XLSX.writeFile(wb, "asociadas.xlsx");
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-sm text-gray-500 text-center max-w-md">
        Descargue la información completa de todas las asociadas registradas en formato Excel (.xlsx).
      </p>
      <Button variant="success" size="lg" onClick={exportToExcel}>
        <Download className="h-5 w-5" />
        Descargar Excel
      </Button>
    </div>
  );
}

export default Exportacion;
