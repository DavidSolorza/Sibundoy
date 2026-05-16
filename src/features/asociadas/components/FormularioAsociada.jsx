import { useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Button from "../../../shared/ui/Button";
import { Input, Select } from "../../../shared/ui/Input";
import { MapPin } from "lucide-react";

const SECTORES = [
  "El Municipio",
  "Vereda Bellavista", "Vereda Cabrera", "Vereda Cabuyayaco",
  "Vereda Campoalegre", "Vereda El Cedro", "Vereda El Ejido",
  "Vereda Fátima Carrizayaco", "Vereda La Cumbre",
  "Vereda Las Cochas", "Vereda Leandro Agreda", "Vereda Llano Grande",
  "Vereda Machindinoy", "Vereda Palmas",
  "Vereda Sagrado Corazón de Jesús", "Vereda San Félix Sinsayaco",
  "Vereda San José la Hidráulica", "Vereda Tamabioy",
  "Vereda Villaflor"
];
const TIPOS_PERSONA = ["madre cabeza de hogar", "Adulto mayor", "viuda"];

const emptyForm = {
  nombre: "",
  edad: "",
  telefono: "",
  numPersonas: "",
  sector: "",
  areaHuerta: "",
  productos: "",
  fechaSiembra: "",
  fechaUltimaVisita: "",
  numVisitas: "",
  observaciones: "",
  tipoPersona: "",
};

function FormularioAsociada({ open, onClose, onSave, coords, initialData }) {
  const isEditing = !!initialData;
  const [form, setForm] = useState(initialData ? { ...initialData } : emptyForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave({
        ...form,
        edad: Number(form.edad),
        numPersonas: Number(form.numPersonas),
        numVisitas: Number(form.numVisitas),
        lat: isEditing ? Number(form.lat) : coords.lat,
        lng: isEditing ? Number(form.lng) : coords.lng,
      });
      setForm(emptyForm);
      onClose();
    } catch (err) {
      console.error("Error al guardar asociada:", err);
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    onClose();
  };

  const fields = [
    { label: "Nombre", name: "nombre", type: "text", required: true },
    { label: "Edad", name: "edad", type: "number" },
    { label: "Teléfono", name: "telefono", type: "text" },
    { label: "Núm. Personas", name: "numPersonas", type: "number" },
    { label: "Tipo", name: "tipoPersona", type: "select", options: TIPOS_PERSONA },
    { label: "Sector", name: "sector", type: "select", options: SECTORES, required: true },
    { label: "Área Huerta", name: "areaHuerta", type: "text" },
    { label: "Productos", name: "productos", type: "text" },
    { label: "Fecha Siembra", name: "fechaSiembra", type: "date" },
    { label: "Última Visita", name: "fechaUltimaVisita", type: "date" },
    { label: "Núm. Visitas", name: "numVisitas", type: "number" },
    { label: "Observaciones", name: "observaciones", type: "textarea" },
  ];

  const allFields = isEditing
    ? [...fields, { label: "Latitud", name: "lat", type: "text" }, { label: "Longitud", name: "lng", type: "text" }]
    : fields;

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? "Editar asociada" : "Nueva asociada"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="font-mono text-xs">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allFields.map((f) => (
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
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="success">
            {isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default FormularioAsociada;
