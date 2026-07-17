import { useState, useEffect, useMemo } from "react";
import Modal from "../../../shared/ui/Modal";
import Button from "../../../shared/ui/Button";
import { Input, Select } from "../../../shared/ui/Input";
import SearchableSelect from "../../../shared/ui/SearchableSelect";
import { MapPin, Navigation, AlertTriangle } from "lucide-react";
import LocationPickerModal from "../../../shared/ui/LocationPickerModal";
import { useToast } from "../../../shared/ui/Toast";
import useAsociadas from "../useAsociadas";

const SECTORES = [
  "Cabecera Municipal",
  "Vereda Bellavista", "Vereda Cabrera", "Vereda Cabuyayaco",
  "Vereda Campoalegre", "Vereda El Cedro", "Vereda El Ejido",
  "Vereda Fátima Carrizayaco", "Vereda La Cumbre",
  "Vereda Las Cochas", "Vereda Leandro Agreda", "Vereda Llano Grande",
  "Vereda Machindinoy", "Vereda Palmas",
  "Vereda Sagrado Corazón de Jesús", "Vereda San Agustín", "Vereda San Félix Sinsayaco",
  "Vereda San José la Hidráulica", "Vereda Tamabioy",
  "Vereda Villaflor"
];
const ESTADOS_CIVIL = ["Casada", "Madre Cabeza De Hogar", "Viuda", "Separada"];

const CULTIVOS_POPULARES = [
  "Cilantro", "Ajo", "Cebolla", "Lechuga", "Zanahoria", 
  "Repollo", "Tomate", "Remolacha", "Acelga", "Espinaca", 
  "Maíz", "Fríjol", "Papa", "Manzanilla", "Menta"
];

const emptyForm = {
  nombre: "",
  edad: "",
  telefono: "",
  numPersonas: "",
  menoresHogar: "",
  sector: "",
  areaHuerta: "",
  productos: "",
  fechaSiembra: "",
  observaciones: "",
  tipoPersona: "",
};

function FormularioAsociada({ open, onClose, onSave, coords, initialData }) {
  const { asociadas } = useAsociadas();
  const { showToast, ToastDisplay } = useToast();
  const isEditing = !!initialData;
  const [form, setForm] = useState(initialData ? { ...initialData } : emptyForm);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customProduct, setCustomProduct] = useState("");

  const selectedProducts = useMemo(() => {
    return (form.productos || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }, [form.productos]);

  const handleToggleProduct = (productName) => {
    let current = (form.productos || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    
    if (current.includes(productName)) {
      current = current.filter((p) => p !== productName);
    } else {
      current = [...current, productName];
    }
    setForm((prev) => ({ ...prev, productos: current.join(", ") }));
  };

  const handleAddCustomProduct = (e) => {
    if (e) e.preventDefault();
    const trimmed = customProduct.trim();
    if (!trimmed) return;
    
    let current = (form.productos || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
      
    if (!current.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      current = [...current, trimmed];
      setForm((prev) => ({ ...prev, productos: current.join(", ") }));
      showToast(`Añadido: ${trimmed}`);
    } else {
      showToast("El producto ya está seleccionado", "warning");
    }
    setCustomProduct("");
  };

  const duplicateWarning = useMemo(() => {
    if (!form.nombre || form.nombre.length < 2) return null;
    const norm = (s) => s?.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    const nombreNorm = norm(form.nombre);
    const match = asociadas.find((a) => {
      if (isEditing && a.id === initialData.id) return false;
      if (norm(a.nombre) === nombreNorm) return true;
      if (form.telefono && a.telefono === form.telefono) return true;
      return false;
    });
    return match || null;
  }, [form.nombre, form.telefono, asociadas, isEditing, initialData]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(initialData ? { ...initialData } : emptyForm);
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave({
        ...form,
        lat: isEditing ? (form.lat ?? 5.0573) : (coords?.lat ?? 5.0573),
        lng: isEditing ? (form.lng ?? -75.4878) : (coords?.lng ?? -75.4878),
      });
      setForm(emptyForm);
      onClose();
    } catch (err) {
      console.error("Error al guardar asociada:", err);
      showToast(err?.message || "Error al guardar asociada", "error");
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    onClose();
  };

  const fields = [
    { label: "Nombre", name: "nombre", type: "text", required: true },
    { label: "Edad", name: "edad", type: "number", attrs: { min: 1, max: 119 } },
    { label: "Teléfono", name: "telefono", type: "text" },
    { label: "Núm. Personas", name: "numPersonas", type: "number", attrs: { min: 1 } },
    { label: "Menores Hogar", name: "menoresHogar", type: "number", attrs: { min: 0 } },
    { label: "Estado Civil", name: "tipoPersona", type: "select", options: ESTADOS_CIVIL },
    { label: "Sector", name: "sector", type: "select", options: SECTORES, required: true, searchable: true },
    { label: "Área Huerta", name: "areaHuerta", type: "text" },
    { label: "Productos Cultivados", name: "productos", type: "productos" },
    { label: "Fecha Siembra", name: "fechaSiembra", type: "date" },
    { label: "Observaciones", name: "observaciones", type: "textarea" },
  ];

  return (
    <>
    <Modal open={open} onClose={handleClose} title={isEditing ? "Editar Asociada" : "Nueva Asociada"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="font-mono text-xs">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          </div>
        )}

        {duplicateWarning && !isEditing && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              Posible duplicado: <span className="font-semibold">{duplicateWarning.nombre}</span> ya existe en el sistema
              {duplicateWarning.telefono && form.telefono === duplicateWarning.telefono ? " (mismo teléfono)" : " (mismo nombre)"}.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.name} className={f.type === "textarea" || f.type === "productos" ? "col-span-2" : ""}>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {f.label}
                {f.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {f.type === "select" ? (
                f.searchable ? (
                  <SearchableSelect
                    value={form[f.name] || ""}
                    onChange={(val) => handleChange({ target: { name: f.name, value: val } })}
                    options={f.options}
                    getOptionLabel={(o) => o}
                    getOptionValue={(o) => o}
                    placeholder="Seleccionar..."
                    searchPlaceholder={`Buscar ${f.label.toLowerCase()}...`}
                  />
                ) : (
                <Select name={f.name} value={form[f.name] || ""} onChange={handleChange} required={f.required}>
                  <option value="">Seleccionar...</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
                )
              ) : f.type === "textarea" ? (
                <textarea
                  name={f.name}
                  value={form[f.name] || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors duration-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              ) : f.type === "productos" ? (
                <div className="space-y-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {CULTIVOS_POPULARES.map((p) => {
                      const isSelected = selectedProducts.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleToggleProduct(p)}
                          className={`cursor-pointer inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 border ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm animate-pulse"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  
                  {selectedProducts.filter(p => !CULTIVOS_POPULARES.includes(p)).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Otros agregados</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProducts.filter(p => !CULTIVOS_POPULARES.includes(p)).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleToggleProduct(p)}
                            className="cursor-pointer inline-flex items-center rounded-full bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            title="Haz clic para quitar"
                          >
                            {p} &times;
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Añadir otro cultivo..."
                      value={customProduct}
                      onChange={(e) => setCustomProduct(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomProduct();
                        }
                      }}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomProduct()}
                      className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                    >
                      Añadir +
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-500 font-medium">
                    <span className="font-semibold text-slate-600">Seleccionados: </span>
                    {form.productos || <em className="text-slate-400">Ninguno seleccionado</em>}
                  </div>
                </div>
              ) : (
                <Input
                  name={f.name}
                  type={f.type}
                  value={form[f.name] || ""}
                  onChange={handleChange}
                  required={f.required}
                  {...(f.attrs || {})}
                />
              )}
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="col-span-2">
            <button type="button" onClick={() => setPickerOpen(true)} className="cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50">
              <Navigation className="h-4 w-4" /> Editar Ubicación En El Mapa
            </button>
            <p className="text-[10px] text-slate-400 mt-1 text-center">
              {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1 col-span-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="success">
            {isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>

      <LocationPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialCoords={{ lat: Number(form.lat), lng: Number(form.lng) }}
        onConfirm={(c) => {
          setForm((prev) => ({ ...prev, lat: c.lat, lng: c.lng }));
          setPickerOpen(false);
        }}
      />
    </Modal>
      {ToastDisplay}
    </>
  );
}

export default FormularioAsociada;
