import { memo, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAsociadas from "../useAsociadas";
import Badge from "../../../shared/ui/Badge";
import { Trash2, MapPin, Pencil, User, ChevronUp, ChevronDown, Check, X, Camera, Image } from "lucide-react";

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

// Sub-component for an individual row
const TableRow = memo(function TableRow({ 
  asociada, 
  onDelete, 
  onViewMap, 
  onViewGallery, 
  onSaveInline,
  viewOnly, 
  columns, 
  selected, 
  onToggleSelect,
  isEditing,
  onStartEdit,
  onCancelEdit,
  sectorNames
}) {
  const navigate = useNavigate();
  const cols = columns || defaultColumns;
  
  // Local state for editing fields
  const [formData, setFormData] = useState({
    nombre: asociada.nombre || "",
    tipoPersona: asociada.tipoPersona || "",
    numPersonas: asociada.numPersonas || 1,
    sector: asociada.sector || "",
    productos: asociada.productos || "",
  });

  const handleChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e) => {
    e.stopPropagation();
    onSaveInline(asociada.id, formData);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    onCancelEdit();
  };

  const handleStartEditing = (e) => {
    e.stopPropagation();
    setFormData({
      nombre: asociada.nombre || "",
      tipoPersona: asociada.tipoPersona || "",
      numPersonas: asociada.numPersonas || 1,
      sector: asociada.sector || "",
      productos: asociada.productos || "",
    });
    onStartEdit(asociada.id);
  };

  return (
    <tr className={`border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50 cursor-pointer ${selected ? "bg-blue-50/50" : ""}`}>
      {/* Action panel column */}
      <td className="sticky left-0性能 z-10 whitespace-nowrap bg-white px-1.5 py-2.5 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.05)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <input type="checkbox" checked={selected} onChange={() => onToggleSelect(asociada.id)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer shrink-0 mr-1.5" />
          
          <button onClick={() => navigate(`/asociada/${asociada.id}`)} className="cursor-pointer rounded-md bg-slate-800 text-white transition-colors hover:bg-slate-700 min-h-7 min-w-7 flex items-center justify-center" title="Perfil Completo">
            <User className="h-3.5 w-3.5" />
          </button>
          
          <button onClick={() => onViewMap(asociada)} className="cursor-pointer rounded-md bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 min-h-7 min-w-7 flex items-center justify-center" title="Ver En Mapa">
            <MapPin className="h-3.5 w-3.5" />
          </button>

          <button onClick={() => onViewGallery(asociada)} className="cursor-pointer rounded-md bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100 min-h-7 min-w-7 flex items-center justify-center relative" title="Ver Fotos">
            <Camera className="h-3.5 w-3.5" />
            {asociada.fotos?.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white scale-90">
                {asociada.fotos.length}
              </span>
            )}
          </button>

          {!viewOnly && (
            <>
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="cursor-pointer rounded-md bg-emerald-600 text-white hover:bg-emerald-700 min-h-7 min-w-7 flex items-center justify-center" title="Guardar">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={handleCancel} className="cursor-pointer rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 min-h-7 min-w-7 flex items-center justify-center" title="Cancelar">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleStartEditing} className="cursor-pointer rounded-md bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 min-h-7 min-w-7 flex items-center justify-center" title="Editar en Fila">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onDelete(asociada)} className="cursor-pointer rounded-md bg-red-50 text-red-500 transition-colors hover:bg-red-100 min-h-7 min-w-7 flex items-center justify-center" title="Eliminar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </td>

      {/* Dynamic columns */}
      {cols.map((col) => {
        const val = asociada[col.key];

        if (isEditing && !viewOnly) {
          return (
            <td key={col.key} className="whitespace-nowrap px-2 py-1.5 text-sm text-slate-700" onClick={(e) => e.stopPropagation()}>
              {col.key === "nombre" && (
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={(e) => handleChange("nombre", e.target.value)} 
                  className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-slate-800 focus:outline-none w-44" 
                />
              )}
              {col.key === "tipoPersona" && (
                <select 
                  value={formData.tipoPersona} 
                  onChange={(e) => handleChange("tipoPersona", e.target.value)} 
                  className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-slate-800 focus:outline-none"
                >
                  <option value="Casada">Casada</option>
                  <option value="Madre Cabeza De Hogar">Madre Cabeza De Hogar</option>
                  <option value="Viuda">Viuda</option>
                  <option value="Separada">Separada</option>
                </select>
              )}
              {col.key === "numPersonas" && (
                <input 
                  type="number" 
                  min="1" 
                  value={formData.numPersonas} 
                  onChange={(e) => handleChange("numPersonas", parseInt(e.target.value) || 1)} 
                  className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-slate-800 focus:outline-none w-16" 
                />
              )}
              {col.key === "sector" && (
                <select 
                  value={formData.sector} 
                  onChange={(e) => handleChange("sector", e.target.value)} 
                  className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-slate-800 focus:outline-none"
                >
                  {sectorNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
              {col.key === "productos" && (
                <input 
                  type="text" 
                  value={formData.productos} 
                  onChange={(e) => handleChange("productos", e.target.value)} 
                  className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-slate-800 focus:outline-none w-44" 
                />
              )}
            </td>
          );
        }

        // View only mode
        return (
          <td key={col.key} className="whitespace-nowrap px-2 py-2.5 text-sm text-slate-700">
            {col.key === "sector" ? (
              <Badge variant="primary">{val}</Badge>
            ) : col.key === "tipoPersona" ? (
              <Badge variant="warning">{val}</Badge>
            ) : col.key === "productos" ? (
              <span className="max-w-[140px] truncate block" title={val || ""}>{val || "—"}</span>
            ) : col.key === "numPersonas" ? (
              <span className="font-semibold text-slate-800">{val ?? "—"}</span>
            ) : (
              val ?? ""
            )}
          </td>
        );
      })}
    </tr>
  );
});

const TablaAsociadas = memo(function TablaAsociadas({ 
  data, 
  onViewMap, 
  onViewGallery,
  onEdit, 
  onDelete, 
  sortBy, 
  onSort, 
  columns, 
  viewOnly, 
  selectedRows, 
  onToggleSelect, 
  onBulkDelete, 
  onSelectAll
}) {
  const { asociadas: all, deleteAsociada, updateAsociada, getSectores } = useAsociadas();
  const [editingId, setEditingId] = useState(null);

  const items = data || all;
  const handleDelete = onDelete || deleteAsociada;
  const cols = columns || defaultColumns;
  const allSelected = items.length > 0 && items.every((a) => selectedRows?.has(a.id));

  // Get active sector list for dropdown edit
  const sectorNames = useMemo(() => {
    const sectores = getSectores();
    const keys = Object.keys(sectores);
    return keys.length > 0 ? keys : ["Cabecera Municipal"];
  }, [getSectores]);

  const handleStartEdit = useCallback((id) => setEditingId(id), []);
  const handleCancelEdit = useCallback(() => setEditingId(null), []);

  const handleSaveInline = useCallback(async (id, inlineData) => {
    try {
      await updateAsociada(id, inlineData);
      setEditingId(null);
    } catch (err) {
      alert("Error al actualizar: " + err.message);
    }
  }, [updateAsociada]);

  const handleFilterChange = (key, val) => {
    if (onColumnFilterChange) {
      onColumnFilterChange((prev) => ({ ...prev, [key]: val }));
    }
  };

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
      
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-800 text-white">
            {/* Headers row */}
            <tr>
              <th className="sticky left-0 z-20 whitespace-nowrap bg-slate-800 px-1.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" checked={allSelected} onChange={() => {
                    if (allSelected) onToggleSelect("__all__");
                    else onSelectAll?.();
                  }} className="h-3.5 w-3.5 rounded border-slate-500 bg-white text-slate-800 focus:ring-slate-400 cursor-pointer" />
                  <span className="ml-1.5">Acciones</span>
                </div>
              </th>
              {cols.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
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
              <TableRow 
                key={a.id} 
                asociada={a} 
                onDelete={handleDelete} 
                onViewMap={onViewMap} 
                onViewGallery={onViewGallery}
                onSaveInline={handleSaveInline}
                viewOnly={viewOnly} 
                columns={cols}
                selected={selectedRows?.has(a.id)} 
                onToggleSelect={onToggleSelect}
                isEditing={editingId === a.id}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                sectorNames={sectorNames}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TablaAsociadas;