import { useState, useEffect, useMemo } from "react";
import Modal from "../../../shared/ui/Modal";
import Button from "../../../shared/ui/Button";
import { Input, Select } from "../../../shared/ui/Input";
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
  "Vereda Sagrado Corazón de Jesús", "Vereda San Félix Sinsayaco",
  "Vereda San José la Hidráulica", "Vereda Tamabioy",
  "Vereda Villaflor"
];
const ESTADOS_CIVIL = ["Casada", "Madre Cabeza De Hogar", "Viuda", "Separada"];

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
        lat: isEditing ? (form.lat ?? null) : (coords?.lat ?? null),
        lng: isEditing ? (form.lng ?? null) : (coords?.lng ?? null),
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
    { label: "Sector", name: "sector", type: "select", options: SECTORES, required: true },
    { label: "Área Huerta", name: "areaHuerta", type: "text" },
    { label: "Productos", name: "productos", type: "text" },
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
            <div key={f.name} className={f.type === "textarea" ? "col-span-2" : ""}>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {f.label}
                {f.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {f.type === "select" ? (
                <Select name={f.name} value={form[f.name] || ""} onChange={handleChange} required={f.required}>
                  <option value="">Seleccionar...</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
              ) : f.type === "textarea" ? (
                <textarea
                  name={f.name}
                  value={form[f.name] || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors duration-200 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
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
