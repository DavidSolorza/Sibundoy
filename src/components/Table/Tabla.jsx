import useAsociadas from "../../hooks/useAsociadas";
import Badge from "../ui/Badge";
import { Trash2, MapPin, Pencil, Eye } from "lucide-react";

const columns = [
  { key: "nombre", label: "Nombre" },
  { key: "tipoPersona", label: "Tipo" },
  { key: "sector", label: "Sector" },
  { key: "fechaUltimaVisita", label: "Última Visita" },
];

function TableRow({ asociada, onDelete, onViewMap, onEdit, onViewDetails }) {
  return (
    <tr className="border-b border-gray-100 transition-colors duration-150 hover:bg-blue-50/50">
      <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewDetails(asociada)}
            className="cursor-pointer rounded-md bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200"
            title="Ver detalle"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onViewMap(asociada)}
            className="cursor-pointer rounded-md bg-emerald-50 p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100"
            title="Ver en mapa"
          >
            <MapPin className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onEdit(asociada)}
            className="cursor-pointer rounded-md bg-blue-50 p-1.5 text-blue-600 transition-colors hover:bg-blue-100"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(asociada)}
            className="cursor-pointer rounded-md bg-red-50 p-1.5 text-red-600 transition-colors hover:bg-red-100"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
      {columns.map((col) => (
        <td key={col.key} className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
          {col.key === "sector" ? (
            <Badge variant="primary">{asociada[col.key]}</Badge>
          ) : col.key === "tipoPersona" ? (
            <Badge variant="warning">{asociada[col.key]}</Badge>
          ) : (
            asociada[col.key]
          )}
        </td>
      ))}
    </tr>
  );
}

function Tabla({ data, onViewMap, onEdit, onViewDetails, onDelete }) {
  const { asociadas: all, deleteAsociada } = useAsociadas();
  const items = data || all;
  const handleDelete = onDelete || deleteAsociada;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-800">
          <tr>
            <th className="sticky left-0 z-20 whitespace-nowrap bg-slate-800 px-2 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
              Acciones
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((a) => (
            <TableRow key={a.id} asociada={a} onDelete={handleDelete} onViewMap={onViewMap} onEdit={onEdit} onViewDetails={onViewDetails} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Tabla;
