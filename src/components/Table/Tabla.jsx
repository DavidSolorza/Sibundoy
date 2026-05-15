import useAsociadas from "../../hooks/useAsociadas";
import Badge from "../ui/Badge";
import { Trash2 } from "lucide-react";

const columns = [
  { key: "nombre", label: "Nombre" },
  { key: "edad", label: "Edad" },
  { key: "telefono", label: "Tel\u00e9fono" },
  { key: "numPersonas", label: "N\u00fam. Personas" },
  { key: "sector", label: "Sector" },
  { key: "areaHuerta", label: "\u00c1rea Huerta" },
  { key: "productos", label: "Productos" },
  { key: "fechaSiembra", label: "Fecha Siembra" },
  { key: "fechaUltimaVisita", label: "\u00daltima Visita" },
  { key: "numVisitas", label: "Visitas" },
  { key: "observaciones", label: "Observaciones" },
];

function TableRow({ asociada, onDelete }) {
  return (
    <tr className="border-b border-gray-100 transition-colors duration-150 hover:bg-blue-50/50">
      {columns.map((col) => (
        <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
          {col.key === "sector" ? (
            <Badge variant="primary">{asociada[col.key]}</Badge>
          ) : (
            asociada[col.key]
          )}
        </td>
      ))}
      <td className="whitespace-nowrap px-4 py-3">
        <button
          onClick={() => onDelete(asociada.id)}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors duration-200 hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </td>
    </tr>
  );
}

function Tabla() {
  const { asociadas, deleteAsociada } = useAsociadas();

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white"
              >
                {col.label}
              </th>
            ))}
            <th className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {asociadas.map((a) => (
            <TableRow key={a.id} asociada={a} onDelete={deleteAsociada} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Tabla;
