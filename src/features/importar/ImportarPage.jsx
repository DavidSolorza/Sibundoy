import { useState, useMemo, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, FileCode, FileText, Check, X, Loader2, AlertTriangle, Table2, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../services/api";
import { Card } from "../../shared/ui/Card";
import { useToast } from "../../shared/ui/Toast";

const DB_FIELDS = [
  { key: "nombre", label: "Nombre", required: true, type: "text" },
  { key: "edad", label: "Edad", type: "number" },
  { key: "telefono", label: "Teléfono", type: "text" },
  { key: "num_personas", label: "Núm. Personas", type: "number" },
  { key: "menores_hogar", label: "Menores Hogar", type: "number" },
  { key: "tipo_persona", label: "Estado Civil", type: "text" },
  { key: "sector", label: "Sector", type: "text" },
  { key: "area_huerta", label: "Área Huerta", type: "text" },
  { key: "productos", label: "Productos", type: "text" },
  { key: "fecha_siembra", label: "Fecha Siembra", type: "date" },
  { key: "observaciones", label: "Observaciones", type: "text" },
  { key: "lat", label: "Latitud", type: "number" },
  { key: "lng", label: "Longitud", type: "number" },
  { key: "num_visitas", label: "Visitas", type: "number" },
  { key: "fecha_ultima_visita", label: "Última Visita", type: "date" },
];

const AUTO_MAP = {
  nombre: ["nombre", "name", "nombres", "names", "nombre socia", "socia", "asociada"],
  edad: ["edad", "age", "años", "anos", "edad (años)"],
  telefono: ["telefono", "teléfono", "tel", "celular", "cel", "phone", "telephone", "movil", "móvil", "contacto"],
  num_personas: ["num_personas", "numero personas", "número personas", "núm. personas", "num. personas", "personas", "n personas", "núm personas", "total personas", "integrantes", "miembros", "familiares", "cargas"],
  menores_hogar: ["menores_hogar", "menores", "menores en el hogar", "niños", "niños en casa", "hijos menores", "menores edad", "menores de edad", "num menores", "núm menores", "n menores"],
  tipo_persona: ["tipo_persona", "estado civil", "tipo", "tipo persona", "tipo de persona", "tipo de población", "poblacion", "población", "civil"],
  sector: ["sector", "vereda", "sector / vereda", "sector/vereda", "sector vereda", "lugar", "comunidad", "barrio"],
  area_huerta: ["area_huerta", "área huerta", "area huerta", "área de la huerta", "area de la huerta", "huerta", "tamaño huerta", "m²", "area", "área", "tamaño", "tamano"],
  productos: ["productos", "productos a sembrar", "productos sembrar", "cultivos", "siembra", "que siembra", "que cultiva", "cosecha"],
  fecha_siembra: ["fecha_siembra", "fecha siembra", "siembra", "fecha de siembra", "fecha_siembra", "fecha de la siembra"],
  observaciones: ["observaciones", "observacion", "observación", "notas", "comentarios", "nota", "comentario", "descripcion", "descripción", "detalle", "detalles"],
  lat: ["lat", "latitud", "latitude", "latitud (mapa)", "latitud mapa"],
  lng: ["lng", "lon", "longitud", "longitude", "lng", "longitud (mapa)", "longitud mapa"],
  num_visitas: ["num_visitas", "visitas", "total visitas", "numero de visitas", "número de visitas", "visitas realizadas"],
  fecha_ultima_visita: ["fecha_ultima_visita", "ultima visita", "última visita", "fecha ultima visita", "fecha de ultima visita"],
};

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}

function parseImportDate(val) {
  if (!val) return null;
  val = val.toString().trim();
  
  if (!isNaN(val) && Number(val) > 10000) {
    return new Date((Number(val) - 25569) * 86400 * 1000);
  }
  
  const dmY = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const match = val.match(dmY);
  if (match) {
    return new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
  }
  
  const yMd = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
  const match2 = val.match(yMd);
  if (match2) {
    return new Date(parseInt(match2[1], 10), parseInt(match2[2], 10) - 1, parseInt(match2[3], 10));
  }
  
  return new Date(val);
}

function autoMapColumn(col) {
  const n = normalize(col);
  for (const [key, aliases] of Object.entries(AUTO_MAP)) {
    if (aliases.some((a) => normalize(a) === n || n.includes(normalize(a)) || normalize(a).includes(n))) {
      return key;
    }
  }
  return null;
}

const ACCEPTED_TYPES = ".xlsx,.csv,.json";

function detectFileType(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) return "xlsx";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".json")) return "json";
  return null;
}

async function parseFile(file, type) {
  if (type === "xlsx") {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { defval: "" });
  }
  if (type === "csv") {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error("El archivo CSV debe tener al menos un encabezado y una fila de datos");
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map((line) => {
      const vals = parseCSVLine(line);
      const row = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return row;
    }).filter((r) => Object.values(r).some((v) => v !== ""));
  }
  if (type === "json") {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error("El JSON debe ser un array de objetos");
    return data;
  }
  throw new Error("Tipo de archivo no soportado");
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export default function ImportarPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [rawColumns, setRawColumns] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [importPhase, setImportPhase] = useState("idle");

  const handleFile = useCallback(async (f) => {
    const type = detectFileType(f);
    if (!type) { showToast("Formato no soportado. Usa .xlsx, .csv o .json", "error"); return; }
    setFile(f);
    setFileType(type);
    setImportResult(null);
    setColumnMap({});
    try {
      const data = await parseFile(f, type);
      if (data.length === 0) { showToast("El archivo no contiene datos", "error"); return; }
      const cols = Object.keys(data[0]);
      setRawColumns(cols);
      setParsedData(data);

      const map = {};
      cols.forEach((col) => {
        const mapped = autoMapColumn(col);
        if (mapped) map[mapped] = col;
      });
      setColumnMap(map);
      showToast(`${data.length} registros encontrados en ${f.name}`);
    } catch (e) {
      showToast("Error al leer archivo: " + e.message, "error");
      console.error(e);
    }
  }, [showToast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleInputChange = useCallback((e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const usedColumns = useMemo(() => new Set(Object.values(columnMap)), [columnMap]);
  const unmappedCols = useMemo(() => rawColumns.filter((c) => !usedColumns.has(c)), [rawColumns, usedColumns]);
  const previewRows = useMemo(() => (parsedData || []).slice(0, 5), [parsedData]);

  const toggleField = useCallback((dbKey, colName) => {
    setColumnMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { if (next[k] === colName && k !== dbKey) delete next[k]; });
      if (next[dbKey] === colName) delete next[dbKey];
      else next[dbKey] = colName;
      return next;
    });
  }, []);

  const removeMapping = useCallback((dbKey) => {
    setColumnMap((prev) => { const n = { ...prev }; delete n[dbKey]; return n; });
  }, []);

  const allRequiredMapped = DB_FIELDS.filter((f) => f.required).every((f) => columnMap[f.key]);

  const resetAll = useCallback(() => {
    setFile(null);
    setFileType(null);
    setParsedData(null);
    setRawColumns([]);
    setColumnMap({});
    setImportResult(null);
    setImportPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleImport = useCallback(async () => {
    if (!parsedData || !allRequiredMapped) return;
    setImporting(true);
    setImportPhase("importing");

    try {
      // Obtener asociadas actuales para preservar datos no mapeados
      const resAsoc = await api.getAsociadas();
      const existentes = Array.isArray(resAsoc) ? resAsoc : (resAsoc.data || []);
      const mapExistentes = {};
      existentes.forEach(a => {
        const nom = a.nombre ?? a.asociada_nombre ?? a.asociadaNombre;
        if (nom) mapExistentes[nom.toLowerCase().trim()] = a;
      });

      const registrosAProcesar = [];

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const record = {};
        let valid = true;

        for (const [dbKey, colName] of Object.entries(columnMap)) {
          let val = row[colName]?.toString().trim() ?? "";
          if (dbKey === "nombre") {
            val = val.replace(/\d+/g, "").trim();
            if (!val) { valid = false; break; }
            record.nombre = val;
          } else {
            if (val === "") continue;

            if (dbKey === "edad" || dbKey === "num_personas" || dbKey === "menores_hogar" || dbKey === "num_visitas") {
              const num = parseInt(val, 10);
              if (!isNaN(num)) record[dbKey] = num;
            } else if (dbKey === "lat" || dbKey === "lng") {
              const num = parseFloat(val.replace(",", "."));
              if (!isNaN(num)) record[dbKey] = num;
            } else if (dbKey === "tipo_persona") {
              const normalized = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              if (normalized.includes("madre") || normalized.includes("cabeza")) record.tipo_persona = "Madre Cabeza De Hogar";
              else if (normalized.includes("viuda")) record.tipo_persona = "Viuda";
              else if (normalized.includes("separada")) record.tipo_persona = "Separada";
              else record.tipo_persona = "Casada";
            } else if (dbKey === "fecha_siembra" || dbKey === "fecha_ultima_visita") {
              const d = parseImportDate(val);
              if (d && !isNaN(d.getTime())) record[dbKey] = d.toISOString().split("T")[0];
            } else {
              record[dbKey] = val;
            }
          }
        }

        if (valid) {
          const keyNombre = record.nombre.toLowerCase().trim();
          const existente = mapExistentes[keyNombre];
          if (existente) {
            // Preservar campos existentes que no vienen en el nuevo record
            const merged = { ...existente, ...record };
            registrosAProcesar.push(merged);
          } else {
            registrosAProcesar.push(record);
          }
        }
      }

      if (registrosAProcesar.length === 0) {
        throw new Error("No hay registros válidos para importar");
      }

      // Llamada única al endpoint masivo
      const res = await api.importarMasivo(registrosAProcesar);
      
      const resultData = res.data || res;
      setImportResult({ 
        success: resultData.created + resultData.updated, 
        created: resultData.created,
        updated: resultData.updated,
        errors: 0,
        errorList: [],
      });
      setImportPhase("done");

      showToast(`Importación exitosa: ${resultData.created} creados, ${resultData.updated} actualizados.`, "success");
      setTimeout(() => resetAll(), 3000);

    } catch (e) {
      showToast(`Error al importar: ${e.message}`, "error");
      console.error(e);
      setImportPhase("idle");
    } finally {
      setImporting(false);
    }
  }, [parsedData, columnMap, allRequiredMapped, showToast, resetAll]);

  const fileIcon = fileType === "xlsx" ? FileSpreadsheet : fileType === "csv" ? FileCode : fileType === "json" ? FileText : Table2;

  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
          <Upload className="h-5 w-5" />
          Importar datos (Masivo)
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Sube un archivo Excel, CSV o JSON con los datos de las asociadas. El servidor se encargará de crear sectores, detectar duplicados y actualizar la información de manera automática.</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">1</div>
            <p className="text-sm font-semibold text-slate-700">Seleccionar archivo</p>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors duration-200 ${
              dragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
            }`}
          >
            <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={handleInputChange} className="hidden" />
            <Upload className={`h-10 w-10 mb-3 ${dragOver ? "text-blue-500" : "text-slate-400"}`} />
            <p className="text-sm font-medium text-slate-600">
              {dragOver ? "Suelta el archivo aquí" : "Arrastra un archivo o haz clic para seleccionar"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Excel (.xlsx), CSV (.csv) o JSON (.json)</p>
          </div>

          {file && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                {fileIcon && <fileIcon className="h-8 w-8 shrink-0 text-slate-500" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB · {parsedData?.length || 0} registros</p>
                </div>
              </div>
              <button onClick={resetAll} className="cursor-pointer shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Quitar archivo">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </Card>

      {parsedData && (
        <>
          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">2</div>
                  <p className="text-sm font-semibold text-slate-700">Vista previa</p>
                  <span className="text-xs text-slate-400">({parsedData.length} registros, {rawColumns.length} columnas)</span>
                </div>
                <button onClick={() => setShowPreview(!showPreview)} className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  {showPreview ? <><ChevronUp className="h-3 w-3" /> Ocultar</> : <><ChevronDown className="h-3 w-3" /> Mostrar</>}
                </button>
              </div>

              {showPreview && (
                <div className="overflow-auto rounded-lg border border-slate-200 max-h-64">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-white">#</th>
                        {rawColumns.map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-semibold text-white whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {previewRows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                          {rawColumns.map((col) => (
                            <td key={col} className="px-3 py-1.5 text-slate-700 max-w-[200px] truncate">{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">3</div>
                <p className="text-sm font-semibold text-slate-700">Mapeo de columnas</p>
                <span className="text-xs text-slate-400">Asigna cada columna del archivo al campo correspondiente</span>
              </div>

              <div className="space-y-2">
                {DB_FIELDS.map((field) => {
                  const mapped = columnMap[field.key];
                  return (
                    <div key={field.key} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                      <div className="w-40 shrink-0">
                        <span className={`text-sm font-medium ${field.required ? "text-slate-800" : "text-slate-500"}`}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                      <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                        {rawColumns.map((col) => {
                          const isSelected = mapped === col;
                          const isUsed = usedColumns.has(col) && !isSelected;
                          return (
                            <button key={col} onClick={() => toggleField(field.key, col)} disabled={isUsed}
                              className={`cursor-pointer inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                                isSelected ? "border-slate-800 bg-slate-800 text-white shadow-sm" 
                                  : isUsed ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:shadow-sm"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              {col}
                            </button>
                          );
                        })}
                        {mapped && (
                          <button onClick={() => removeMapping(field.key)} className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
                            <X className="h-3 w-3" /> Quitar
                          </button>
                        )}
                      </div>
                      {!mapped && <span className="text-[10px] text-slate-400 shrink-0">Sin asignar</span>}
                    </div>
                  );
                })}
              </div>

              {unmappedCols.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Columnas sin mapear
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {unmappedCols.map((col) => (
                      <span key={col} className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] text-slate-600 border border-amber-100">{col}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">4</div>
                <p className="text-sm font-semibold text-slate-700">Importar</p>
              </div>

              {importResult && importPhase === "done" && (
                <div className={`rounded-lg border px-4 py-3 border-emerald-200 bg-emerald-50`}>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-600" />
                    <p className={`text-sm font-medium text-emerald-800`}>
                      {importResult.success} registros procesados ({importResult.created} creados, {importResult.updated} actualizados)
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-emerald-600">Volviendo al inicio en unos segundos…</p>
                </div>
              )}

              {importPhase !== "done" && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button onClick={handleImport} disabled={!allRequiredMapped || importing || !parsedData}
                    className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed">
                    {importing ? <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Importando…
                    </> : <>
                      <Upload className="h-4 w-4" /> Importar {parsedData?.length || 0} registros (Masivo)
                    </>}
                  </button>
                  <button onClick={resetAll} disabled={importing}
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                    <X className="h-4 w-4" /> Nueva importación
                  </button>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </section>
  );
}
