import { useState, useMemo, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, FileCode, FileText, Check, X, Loader2, AlertTriangle, Table2, ArrowRight, ChevronDown, ChevronUp, Pencil, Eye, EyeOff, Save } from "lucide-react";
import { supabase } from "../../services/supabase";
import { Card } from "../../shared/ui/Card";
import Modal from "../../shared/ui/Modal";
import { Input, Select } from "../../shared/ui/Input";
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
};

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
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

function ImportarPage() {
  const { showToast, ToastDisplay } = useToast();
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
  const [sectorCache, setSectorCache] = useState(null);
  const [duplicates, setDuplicates] = useState(null);
  const [checkingDupes, setCheckingDupes] = useState(false);
  const [importPhase, setImportPhase] = useState("idle");
  const [conflictRow, setConflictRow] = useState(null);
  const [conflictEditData, setConflictEditData] = useState(null);
  const [discardedRows, setDiscardedRows] = useState(new Set());
  const [selectedRows, setSelectedRows] = useState(new Set());
  const existingNormRef = useRef([]);

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
    setDuplicates(null);
    setCheckingDupes(false);
    setImportPhase("idle");
    setSelectedRows(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const runImport = useCallback(async (rows) => {
    setImporting(true);
    setImportPhase("importing");
    setDuplicates(null);

    try {
      let sectores = sectorCache;
      if (!sectores) {
        const { data } = await supabase.from("sectores").select("id,nombre");
        sectores = {};
        (data || []).forEach((s) => { sectores[s.nombre.toLowerCase()] = s.id; });
        setSectorCache(sectores);
      }

      let success = 0;
      let errors = 0;
      const errorRows = [];

      const rowsToImport = rows || parsedData;

      for (let i = 0; i < rowsToImport.length; i++) {
        const rowInfo = rowsToImport[i];
        const row = rowInfo.raw || rowInfo;
        const record = {};
        let valid = true;

        for (const [dbKey, colName] of Object.entries(columnMap)) {
          let val = row[colName]?.toString().trim() ?? "";
          if (dbKey === "nombre") {
            val = val.replace(/\d+/g, "").trim();
            if (!val) { valid = false; break; }
            record.nombre = val;
          } else if (dbKey === "edad" || dbKey === "num_personas" || dbKey === "menores_hogar") {
            const num = parseInt(val, 10);
            record[dbKey] = isNaN(num) ? null : num;
          } else if (dbKey === "lat" || dbKey === "lng") {
            const num = parseFloat(val.replace(",", "."));
            record[dbKey] = isNaN(num) ? null : num;
          } else if (dbKey === "sector") {
            const sectorLower = val.toLowerCase();
            record.sector_id = sectores[sectorLower] || null;
          } else if (dbKey === "tipo_persona") {
            const normalized = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (normalized.includes("madre") || normalized.includes("cabeza")) record.tipo_persona = "Madre Cabeza De Hogar";
            else if (normalized.includes("viuda")) record.tipo_persona = "Viuda";
            else if (normalized.includes("separada")) record.tipo_persona = "Separada";
            else record.tipo_persona = "Casada";
          } else if (dbKey === "fecha_siembra") {
            const d = new Date(val);
            record.fecha_siembra = isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
          } else {
            record[dbKey] = val || null;
          }
        }

        if (!valid) { errors++; errorRows.push(i + 1); continue; }

        if (record.lat == null) record.lat = 5.0573;
        if (record.lng == null) record.lng = -75.4878;

        const { error } = await supabase.from("asociadas").insert(record);
        if (error) { errors++; errorRows.push(i + 1); }
        else success++;
      }

      setImportResult({ success, errors, errorRows });
      setImportPhase("done");

      if (errors === 0) {
        showToast(`${success} registros importados correctamente`);
        setTimeout(() => resetAll(), 2500);
      } else if (success > 0) {
        showToast(`${success} importados, ${errors} errores (filas: ${errorRows.join(", ")})`, "warning");
      } else {
        showToast(`Error al importar: ${errors} registro(s) con errores`, "error");
      }
    } catch (e) {
      showToast("Error durante la importación: " + e.message, "error");
      console.error(e);
      setImportPhase("idle");
    } finally {
      setImporting(false);
    }
  }, [parsedData, columnMap, sectorCache, showToast, resetAll]);

  const handleImport = useCallback(async () => {
    if (!parsedData || !allRequiredMapped) return;

    setCheckingDupes(true);
    setDuplicates(null);
    setImportPhase("checking");

    const { data: existing } = await supabase
      .from("asociadas")
      .select("id, nombre, telefono, lat, lng, sectores(nombre)")
      .order("id");

    const existingNorm = (existing || []).map((r) => {
      const { sectores, ...rest } = r;
      return { ...rest, sector: sectores?.nombre || "" };
    });
    existingNormRef.current = existingNorm;

    const dupRows = [];
    const allRows = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const record = { rowIndex: i, nombre: "", reasons: [] };

      for (const [dbKey, colName] of Object.entries(columnMap)) {
        let val = row[colName]?.toString().trim() ?? "";
        if (dbKey === "nombre") {
          val = val.replace(/\d+/g, "").trim();
          record.nombre = val;
          if (!val) {
            record.reasons.push({ type: "sin_nombre", existing: "", id: null });
          } else {
            const match = existingNorm.find((e) => {
              const en = e.nombre?.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\d+/g, "");
              const vn = val.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return en === vn;
            });
            if (match) record.reasons.push({ type: "nombre", existing: match.nombre, id: match.id });
          }
        } else if (dbKey === "telefono" && val) {
          const match = existingNorm.find((e) => e.telefono === val);
          if (match && !record.reasons.some((r) => r.type === "nombre" && r.id === match.id)) {
            record.reasons.push({ type: "telefono", existing: match.nombre, id: match.id });
          }
        } else if ((dbKey === "lat" || dbKey === "lng") && val) {
          const num = parseFloat(val.replace(",", "."));
          if (!isNaN(num)) {
            if (dbKey === "lat") record._lat = num;
            else record._lng = num;
          }
        }
      }

      if (record._lat != null && record._lng != null) {
        const match = existingNorm.find((e) => {
          if (e.lat == null || e.lng == null) return false;
          return Math.abs(e.lat - record._lat) < 0.0001 && Math.abs(e.lng - record._lng) < 0.0001;
        });
        if (match && !record.reasons.some((r) => r.type === "nombre" && r.id === match.id) && !record.reasons.some((r) => r.type === "telefono" && r.id === match.id)) {
          record.reasons.push({ type: "ubicacion", existing: match.nombre, id: match.id });
        }
      }

      if (record.reasons.length > 0) {
        dupRows.push(record);
      }
      allRows.push({ ...record, raw: row });
    }

    setCheckingDupes(false);

    if (dupRows.length > 0) {
      setDuplicates(dupRows);
      setImportPhase("review");
      showToast(`${dupRows.length} posible(s) duplicado(s) encontrado(s)`, "warning");
      return;
    }

    await runImport(allRows);
  }, [parsedData, columnMap, allRequiredMapped, showToast, runImport]);

  const importWithoutDupes = useCallback(() => {
    if (!duplicates) return;
    const dupIndices = new Set(duplicates.map((d) => d.rowIndex));
    const cleanRows = parsedData.filter((_, i) => !dupIndices.has(i));
    if (cleanRows.length === 0) {
      showToast("Todos los registros son duplicados. Nada que importar.", "warning");
      setImportPhase("idle");
      setDuplicates(null);
      setSelectedRows(new Set());
      return;
    }
    runImport(cleanRows.map((raw, i) => ({ raw, rowIndex: i, nombre: "", reasons: [] })));
  }, [duplicates, parsedData, runImport, showToast]);

  const openConflictEditor = useCallback((row, index) => {
    setConflictRow({ row, index });
    const editData = {};
    for (const [dbKey, colName] of Object.entries(columnMap)) {
      editData[dbKey] = row[colName]?.toString() ?? "";
    }
    editData._lat = editData.lat ? parseFloat(editData.lat.replace(",", ".")) : null;
    editData._lng = editData.lng ? parseFloat(editData.lng.replace(",", ".")) : null;
    setConflictEditData(editData);
  }, [columnMap]);

  const saveConflictEdit = useCallback(() => {
    if (!conflictRow) return;
    const { index } = conflictRow;
    const editData = conflictEditData;
    const rawRow = {};
    for (const [dbKey, colName] of Object.entries(columnMap)) {
      let val = editData[dbKey] ?? "";
      if (dbKey === "nombre") val = val.replace(/\d+/g, "").trim();
      rawRow[colName] = val;
    }
    setParsedData((prev) => {
      const next = [...prev];
      next[index] = rawRow;
      return next;
    });
    // Re-check against existing data
    const existing = existingNormRef.current;
    const newReasons = [];
    const newNombre = editData["nombre"]?.replace(/\d+/g, "").trim() || "";
    if (!newNombre) {
      newReasons.push({ type: "sin_nombre", existing: "", id: null });
    } else {
      const match = existing.find((e) => {
        const en = e.nombre?.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\d+/g, "");
        const vn = newNombre.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return en === vn;
      });
      if (match) newReasons.push({ type: "nombre", existing: match.nombre, id: match.id });
    }
    const rawTelefono = editData["telefono"]?.toString().trim() ?? "";
    if (rawTelefono) {
      const match = existing.find((e) => e.telefono === rawTelefono);
      if (match && !newReasons.some((r) => r.id === match.id)) {
        newReasons.push({ type: "telefono", existing: match.nombre, id: match.id });
      }
    }
    if (newReasons.length > 0) {
      setDuplicates((prev) => {
        if (!prev) return prev;
        const exists = prev.some((d) => d.rowIndex === index);
        if (exists) return prev.map((d) => d.rowIndex === index ? { ...d, nombre: newNombre, reasons: newReasons } : d);
        return [...prev, { rowIndex: index, nombre: newNombre, reasons: newReasons }];
      });
    } else {
      setDuplicates((prev) => prev ? prev.filter((d) => d.rowIndex !== index) : prev);
    }
    setConflictRow(null);
    setConflictEditData(null);
    showToast("Registro actualizado");
  }, [conflictRow, conflictEditData, columnMap, showToast]);

  const discardRow = useCallback((index) => {
    setDiscardedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleSelectRow = useCallback((index) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === duplicates?.length) return new Set();
      return new Set(duplicates.map((d) => d.rowIndex));
    });
  }, [duplicates]);

  const discardSelected = useCallback(() => {
    setDiscardedRows((prev) => {
      const next = new Set(prev);
      selectedRows.forEach((i) => next.add(i));
      return next;
    });
    setSelectedRows(new Set());
    showToast(`${selectedRows.size} registro(s) descartados`);
  }, [selectedRows, showToast]);

  const importResolved = useCallback(async () => {
    const keepRows = parsedData.filter((_, i) => !discardedRows.has(i));
    if (keepRows.length === 0) {
      showToast("No hay registros para importar", "warning");
      return;
    }
    setDuplicates(null);
    setImportPhase("idle");
    setSelectedRows(new Set());
    await runImport(keepRows.map((raw, i) => ({ raw, rowIndex: i, nombre: "", reasons: [] })));
  }, [parsedData, discardedRows, showToast, runImport]);

  const fileIcon = fileType === "xlsx" ? FileSpreadsheet : fileType === "csv" ? FileCode : fileType === "json" ? FileText : Table2;

  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
          <Upload className="h-5 w-5" />
          Importar datos
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Sube un archivo Excel, CSV o JSON con los datos de las asociadas para importarlos a la base de datos.</p>
      </div>

      {/* STEP 1: Upload */}
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
          {/* STEP 2: Preview */}
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

          {/* STEP 3: Column Mapping */}
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

          {/* STEP 4: Import */}
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">4</div>
                <p className="text-sm font-semibold text-slate-700">Importar</p>
              </div>

              {checkingDupes && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700">Verificando duplicados…</p>
                </div>
              )}

              {duplicates && duplicates.length > 0 && importPhase === "review" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 divide-y divide-amber-100">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {duplicates.length} registro(s) con problemas encontrados
                      </p>
                      <p className="text-xs text-amber-600">Revisa y edita los registros antes de importar.</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 max-h-60 overflow-auto space-y-1.5">
                    <label className="flex items-center gap-2 px-1 py-1 text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                      <input type="checkbox" checked={selectedRows.size === duplicates.length && duplicates.length > 0}
                        onChange={toggleSelectAll} className="h-3.5 w-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer" />
                      Seleccionar todos ({selectedRows.size} de {duplicates.length})
                    </label>
                    {duplicates.map((dup, i) => {
                      const isDiscarded = discardedRows.has(dup.rowIndex);
                      const isSelected = selectedRows.has(dup.rowIndex);
                      return (
                        <div key={i} className={`flex items-start gap-2 rounded px-3 py-2 text-xs ${isDiscarded ? "bg-red-50 line-through opacity-60" : isSelected ? "bg-blue-50 ring-1 ring-blue-200" : "bg-white/60"}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelectRow(dup.rowIndex)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-400 cursor-pointer shrink-0" />
                          <span className="font-medium text-slate-500 shrink-0">#{dup.rowIndex + 1}</span>
                          <span className="font-medium text-slate-800 shrink-0">{dup.nombre}</span>
                          <div className="flex flex-wrap gap-1">
                            {dup.reasons.map((r, ri) => (
                              <span key={ri} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                r.type === "sin_nombre" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {r.type === "sin_nombre" ? "⚠️" : r.type === "nombre" ? "📛" : r.type === "telefono" ? "📞" : "📍"} 
                                {r.type === "sin_nombre" ? "Sin nombre" : r.type === "nombre" ? "Nombre duplicado" : r.type === "telefono" ? "Teléfono" : "Ubicación"}
                                {r.existing && <><span className="opacity-60">→</span> {r.existing}</>}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-1 ml-auto shrink-0">
                            <button onClick={() => openConflictEditor(parsedData[dup.rowIndex], dup.rowIndex)}
                              className="cursor-pointer rounded-md p-1 text-blue-500 hover:bg-blue-100 transition-colors" title="Editar registro">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={() => discardRow(dup.rowIndex)}
                              className="cursor-pointer rounded-md p-1 text-red-400 hover:bg-red-100 transition-colors" title={isDiscarded ? "Incluir" : "Descartar"}>
                              {isDiscarded ? <EyeOff className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3">
                    {selectedRows.size > 0 && (
                      <button onClick={discardSelected}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors">
                        <X className="h-3.5 w-3.5" /> Descartar {selectedRows.size} seleccionados
                      </button>
                    )}
                    <button onClick={importWithoutDupes} disabled={importing}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 active:bg-amber-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <Upload className="h-3.5 w-3.5" /> Importar {parsedData.length - duplicates.filter(d => discardedRows.has(d.rowIndex)).length} (saltar descartados)
                    </button>
                    <button onClick={importResolved} disabled={importing}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-40">
                      <Check className="h-3.5 w-3.5" /> Importar seleccionados
                    </button>
                    <button onClick={() => { setDuplicates(null); setImportPhase("idle"); setDiscardedRows(new Set()); setSelectedRows(new Set()); }}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      Revisar después
                    </button>
                  </div>
                </div>
              )}

              {importResult && importPhase === "done" && (
                <div className={`rounded-lg border px-4 py-3 ${importResult.errors === 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex items-center gap-2">
                    {importResult.errors === 0 ? <Check className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                    <p className={`text-sm font-medium ${importResult.errors === 0 ? "text-emerald-800" : "text-amber-800"}`}>
                      {importResult.success} registros importados{importResult.errors > 0 ? `, ${importResult.errors} errores` : ""}
                    </p>
                  </div>
                  {importResult.errors > 0 && (
                    <p className="mt-1 text-xs text-amber-700">Filas con error: {importResult.errorRows.join(", ")}</p>
                  )}
                  {importResult.errors === 0 && (
                    <p className="mt-1 text-xs text-emerald-600">Volviendo al inicio en unos segundos…</p>
                  )}
                </div>
              )}

              {importPhase === "idle" && !duplicates && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button onClick={handleImport} disabled={!allRequiredMapped || importing || !parsedData || checkingDupes}
                    className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed">
                    {importing ? <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Importando…
                    </> : <>
                      <Upload className="h-4 w-4" /> Importar {parsedData?.length || 0} registros
                    </>}
                  </button>
                  <button onClick={resetAll} disabled={importing}
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                    <X className="h-4 w-4" /> Nueva importación
                  </button>
                </div>
              )}

              {importPhase === "done" && (
                <div className="flex justify-center">
                  <button onClick={resetAll}
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100">
                    <Upload className="h-4 w-4" /> Nueva importación
                  </button>
                </div>
              )}

              {!allRequiredMapped && parsedData && (
                <p className="text-xs text-amber-600 text-center">Selecciona una columna para <strong>Nombre</strong> (campo obligatorio) para habilitar la importación.</p>
              )}
            </div>
          </Card>
        </>
      )}
      <Modal open={!!conflictRow} onClose={() => { setConflictRow(null); setConflictEditData(null); }}
        title={`Editar registro #${(conflictRow?.index ?? 0) + 1}`}>
        {conflictEditData && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-2">Corrige los datos del registro y guarda los cambios.</p>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {Object.entries(columnMap).map(([dbKey, colName]) => {
                const field = DB_FIELDS.find((f) => f.key === dbKey);
                if (!field) return null;
                return (
                  <div key={dbKey} className={field.type === "textarea" ? "col-span-2" : ""}>
                    <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                      {field.label}
                      {field.required && <span className="text-red-400">*</span>}
                    </label>
                    <input type={field.type === "number" ? "text" : "text"}
                      value={conflictEditData[dbKey] ?? ""}
                      onChange={(e) => setConflictEditData((prev) => ({ ...prev, [dbKey]: dbKey === "nombre" ? e.target.value.replace(/\d+/g, "") : e.target.value }))}
                      className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
                      placeholder={colName}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setConflictRow(null); setConflictEditData(null); }}
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={saveConflictEdit}
                className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                <Save className="h-3 w-3" /> Guardar cambios
              </button>
            </div>
          </div>
        )}
      </Modal>
      {ToastDisplay}
    </section>
  );
}

export default ImportarPage;
