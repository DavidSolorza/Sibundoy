import { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAsociadas from "../useAsociadas";
import Badge from "../../../shared/ui/Badge";
import { Trash2, MapPin, Pencil, User, ChevronUp, ChevronDown } from "lucide-react";

const defaultColumns = [
  { key: "nombre", label: "Nombre" },
  { key: "tipoPersona", label: "Estado Civil" },
  { key: "numPersonas", label: "Núm. Personas" },
  { key: "sector", label: "Sector" },
  { key: "productos", label: "Productos" },
];

function SortIcon({ columnKey, sortBy }) {
  if (!sortBy || sortBy.key !== columnKey) return null;
  return sortBy.dir === "asc"
    ? <ChevronUp className="h-3 w-3 ml-0.5 inline-block" />
    : <ChevronDown className="h-3 w-3 ml-0.5 inline-block" />;
}

const TableRow = memo(function TableRow({ asociada, onDelete, onViewMap, onEdit, onRowClick, viewOnly, columns, selected, onToggleSelect }) {
  const navigate = useNavigate();
  const cols = columns || defaultColumns;
  return (
    <tr className={`border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50 cursor-pointer ${selected ? "bg-blue-50" : ""}`} onClick={() => onRowClick?.(asociada)}>
      <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-1 py-2 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.05)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <input type="checkbox" checked={selected} onChange={() => onToggleSelect(asociada.id)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer shrink-0 mr-1" />
          <button onClick={() => navigate(`/asociada/${asociada.id}`)} className="cursor-pointer rounded-md bg-slate-800 text-white transition-colors hover:bg-slate-700 min-h-7 min-w-7 flex items-center justify-center" title="Perfil Completo">
            <User className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onViewMap(asociada)} className="cursor-pointer rounded-md bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 min-h-7 min-w-7 flex items-center justify-center" title="Ver En Mapa">
            <MapPin className="h-3.5 w-3.5" />
          </button>
          {!viewOnly && (
            <>
              <button onClick={() => onEdit(asociada)} className="cursor-pointer rounded-md bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 min-h-7 min-w-7 flex items-center justify-center" title="Editar">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(asociada)} className="cursor-pointer rounded-md bg-red-50 text-red-500 transition-colors hover:bg-red-100 min-h-7 min-w-7 flex items-center justify-center" title="Eliminar">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
      {cols.map((col) => (
        <td key={col.key} className="whitespace-nowrap px-2 py-2 text-sm text-slate-700">
          {col.key === "sector" ? (
            <Badge variant="primary">{asociada[col.key]}</Badge>
          ) : col.key === "tipoPersona" ? (
            <Badge variant="warning">{asociada[col.key]}</Badge>
          ) : col.key === "productos" ? (
            <span className="max-w-[120px] truncate block" title={asociada.productos || ""}>{asociada.productos || "—"}</span>
          ) : col.key === "numPersonas" ? (
            <span className="font-semibold text-slate-800">{asociada.numPersonas ?? "—"}</span>
          ) : (
            asociada[col.key] ?? ""
          )}
        </td>
      ))}
    </tr>
  );
});

const TablaAsociadas = memo(function TablaAsociadas({ data, onViewMap, onEdit, onDelete, onRowClick, sortBy, onSort, columns, viewOnly, selectedRows, onToggleSelect, onBulkDelete }) {
  const { asociadas: all, deleteAsociada } = useAsociadas();
  const items = data || all;
  const handleDelete = onDelete || deleteAsociada;
  const cols = columns || defaultColumns;
  const allSelected = items.length > 0 && items.every((a) => selectedRows?.has(a.id));

  return (
    <div>
      {selectedRows && selectedRows.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
          <span className="font-medium">{selectedRows.size} seleccionado(s)</span>
          <button onClick={onBulkDelete}
            className="cursor-pointer inline-flex items-center gap-1 rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors">
            <Trash2 className="h-3 w-3" /> Eliminar seleccionados
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-800">
            <tr>
              <th className="sticky left-0 z-20 whitespace-nowrap bg-slate-800 px-1 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
                <div className="flex items-center gap-1">
                  <input type="checkbox" checked={allSelected} onChange={() => {
                    if (allSelected) onToggleSelect("__all__");
                    else items.forEach((a) => onToggleSelect(a.id));
                  }} className="h-3.5 w-3.5 rounded border-slate-500 bg-white text-slate-800 focus:ring-slate-400 cursor-pointer" />
                  <span className="ml-1">Acciones</span>
                </div>
              </th>
              {cols.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
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
              <TableRow key={a.id} asociada={a} onDelete={handleDelete} onViewMap={onViewMap} onEdit={onEdit} onRowClick={onRowClick} viewOnly={viewOnly} columns={cols}
                selected={selectedRows?.has(a.id)} onToggleSelect={onToggleSelect} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TablaAsociadas;