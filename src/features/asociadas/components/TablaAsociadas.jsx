import { memo } from "react";
import { useNavigate } from "react-router-dom";
import useAsociadas from "../useAsociadas";
import Badge from "../../../shared/ui/Badge";
import { Trash2, MapPin, Pencil, Eye, User, ChevronUp, ChevronDown } from "lucide-react";

const defaultColumns = [
  { key: "nombre", label: "Nombre" },
  { key: "tipoPersona", label: "Tipo" },
  { key: "sector", label: "Sector" },
  { key: "fechaUltimaVisita", label: "Última Visita" },
];

function SortIcon({ columnKey, sortBy }) {
  if (!sortBy || sortBy.key !== columnKey) return null;
  return sortBy.dir === "asc"
    ? <ChevronUp className="h-3 w-3 ml-0.5 inline-block" />
    : <ChevronDown className="h-3 w-3 ml-0.5 inline-block" />;
}

const TableRow = memo(function TableRow({ asociada, onDelete, onViewMap, onEdit, onViewDetails, onRowClick, viewOnly }) {
  const navigate = useNavigate();
  return (
    <tr className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50 cursor-pointer" onClick={() => onRowClick?.(asociada)}>
      <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.05)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/asociada/${asociada.id}`)} className="cursor-pointer rounded-md bg-slate-800 text-white transition-colors hover:bg-slate-700 min-h-9 min-w-9 flex items-center justify-center" title="Perfil completo">
            <User className="h-4 w-4" />
          </button>
          <button onClick={() => onViewDetails(asociada)} className="cursor-pointer rounded-md bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 min-h-9 min-w-9 flex items-center justify-center" title="Ver detalle">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => onViewMap(asociada)} className="cursor-pointer rounded-md bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 min-h-9 min-w-9 flex items-center justify-center" title="Ver en mapa">
            <MapPin className="h-4 w-4" />
          </button>
          {!viewOnly && (
            <>
              <button onClick={() => onEdit(asociada)} className="cursor-pointer rounded-md bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 min-h-9 min-w-9 flex items-center justify-center" title="Editar">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(asociada)} className="cursor-pointer rounded-md bg-red-50 text-red-500 transition-colors hover:bg-red-100 min-h-9 min-w-9 flex items-center justify-center" title="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
      {defaultColumns.map((col) => (
        <td key={col.key} className="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
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
});

const TablaAsociadas = memo(function TablaAsociadas({ data, onViewMap, onEdit, onViewDetails, onDelete, onRowClick, sortBy, onSort, columns, viewOnly }) {
  const { asociadas: all, deleteAsociada } = useAsociadas();
  const items = data || all;
  const handleDelete = onDelete || deleteAsociada;
  const cols = columns || defaultColumns;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-800">
          <tr>
            <th className="sticky left-0 z-20 whitespace-nowrap bg-slate-800 px-2 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
              Acciones
            </th>
              {cols.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                  {onSort ? (
                    <button onClick={() => onSort(col.key)} className="cursor-pointer inline-flex items-center hover:text-slate-300 transition-colors">
                      {col.label}
                      <SortIcon columnKey={col.key} sortBy={sortBy} />
                    </button>
                  ) : col.label}
                </th>
              ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((a) => (
            <TableRow key={a.id} asociada={a} onDelete={handleDelete} onViewMap={onViewMap} onEdit={onEdit} onViewDetails={onViewDetails} onRowClick={onRowClick} viewOnly={viewOnly} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default TablaAsociadas;
