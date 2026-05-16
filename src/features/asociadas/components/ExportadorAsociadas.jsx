import { useState, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Download, FileSpreadsheet, FileText, FileCode, FileDown, Check, X, SlidersHorizontal, MapPin } from "lucide-react";
import useAsociadas from "../useAsociadas";
import { Card } from "../../../shared/ui/Card";

const ALL_COLUMNS = [
  { key: "nombre", label: "Nombre", always: true },
  { key: "edad", label: "Edad" },
  { key: "telefono", label: "Teléfono" },
  { key: "tipoPersona", label: "Tipo" },
  { key: "sector", label: "Sector" },
  { key: "areaHuerta", label: "Área Huerta" },
  { key: "productos", label: "Productos" },
  { key: "numPersonas", label: "Núm. Personas" },
  { key: "fechaSiembra", label: "Fecha Siembra" },
  { key: "fechaUltimaVisita", label: "Última Visita" },
  { key: "numVisitas", label: "Visitas" },
  { key: "observaciones", label: "Observaciones" },
  { key: "lat", label: "Latitud" },
  { key: "lng", label: "Longitud" },
];

const FORMATS = [
  { id: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet, color: "bg-emerald-600 hover:bg-emerald-700" },
  { id: "csv", label: "CSV (.csv)", icon: FileCode, color: "bg-blue-600 hover:bg-blue-700" },
  { id: "pdf", label: "PDF (.pdf)", icon: FileDown, color: "bg-red-600 hover:bg-red-700" },
  { id: "json", label: "JSON (.json)", icon: FileText, color: "bg-slate-800 hover:bg-slate-700" },
];

const PRESETS = [
  { id: "all", label: "Todos los campos" },
  { id: "contact", label: "Contacto básico", cols: ["nombre", "telefono", "sector", "tipoPersona"] },
  { id: "huerta", label: "Datos de huerta", cols: ["nombre", "sector", "areaHuerta", "productos", "fechaSiembra", "fechaUltimaVisita", "numVisitas"] },
];

function ExportadorAsociadas() {
  const { asociadas } = useAsociadas();
  const [selectedCols, setSelectedCols] = useState(ALL_COLUMNS.map((c) => c.key));
  const [format, setFormat] = useState("xlsx");
  const [sectorFilter, setSectorFilter] = useState(null);
  const [copied, setCopied] = useState(false);

  const sectores = useMemo(() => {
    const map = {};
    asociadas.forEach((a) => {
      map[a.sector] = (map[a.sector] || 0) + 1;
    });
    return map;
  }, [asociadas]);

  const filteredData = useMemo(() => {
    if (!sectorFilter) return asociadas;
    return asociadas.filter((a) => a.sector === sectorFilter);
  }, [asociadas, sectorFilter]);

  const exportData = useMemo(() => {
    const cols = ALL_COLUMNS.filter((c) => selectedCols.includes(c.key));
    return filteredData.map((a) => {
      const row = {};
      cols.forEach((c) => {
        row[c.label] = a[c.key] ?? "";
      });
      return row;
    });
  }, [filteredData, selectedCols]);

  const toggleCol = useCallback((key) => {
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const applyPreset = useCallback((id) => {
    if (id === "all") {
      setSelectedCols(ALL_COLUMNS.map((c) => c.key));
    } else {
      const preset = PRESETS.find((p) => p.id === id);
      if (preset) setSelectedCols(preset.cols);
    }
  }, []);

  const exportToXLSX = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asociadas");
    XLSX.writeFile(wb, `asociadas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [exportData]);

  const exportToCSV = useCallback(() => {
    const headers = Object.keys(exportData[0] || {});
    const csvRows = [
      headers.join(","),
      ...exportData.map((row) =>
        headers.map((h) => {
          const val = String(row[h] ?? "");
          return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asociadas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportData]);

  const exportToJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asociadas_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportData]);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = Object.keys(exportData[0] || {});
    const rows = exportData.map((row) => headers.map((h) => String(row[h] ?? "")));

    const dateStr = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    const title = "Asociadas - AgroMap";
    const subtitle = `Sibundoy, Putumayo · ${dateStr} · ${exportData.length} registros${sectorFilter ? ` · Sector: ${sectorFilter}` : ""}`;

    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 25);

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.1,
    });

    doc.save(`asociadas_${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [exportData, sectorFilter]);

  const copyJSON = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exportData]);

  const handleExport = useCallback(() => {
    if (format === "xlsx") exportToXLSX();
    else if (format === "csv") exportToCSV();
    else if (format === "pdf") exportToPDF();
    else if (format === "json") exportToJSON();
  }, [format, exportToXLSX, exportToCSV, exportToPDF, exportToJSON]);

  const allSelected = selectedCols.length === ALL_COLUMNS.length;

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Formato</p>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => {
                const isActive = format === f.id;
                return (
                  <button key={f.id} onClick={() => setFormat(f.id)}
                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive ? `${f.color} text-white shadow-sm` : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:shadow-sm"
                    }`}>
                    <f.icon className="h-4 w-4" />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Campos a incluir</p>
              <div className="flex gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.id} onClick={() => applyPreset(p.id)}
                    className="cursor-pointer rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 has-checked:border-slate-800 has-checked:bg-slate-800 has-checked:text-white">
                <input type="checkbox" checked={allSelected} onChange={() => setSelectedCols(allSelected ? [] : ALL_COLUMNS.map((c) => c.key))} className="sr-only" />
                {allSelected ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
              </label>
              {ALL_COLUMNS.map((col) => (
                <label key={col.key} className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 has-checked:border-slate-800 has-checked:bg-slate-800 has-checked:text-white">
                  <input type="checkbox" checked={selectedCols.includes(col.key)} onChange={() => toggleCol(col.key)} className="sr-only" />
                  <Check className={`h-3 w-3 ${selectedCols.includes(col.key) ? "opacity-100" : "opacity-0"}`} />
                  {col.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
              Filtrar por sector {sectorFilter && <span className="text-slate-800 font-bold">· {sectorFilter}</span>}
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button onClick={() => setSectorFilter(null)}
                className={`cursor-pointer shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  !sectorFilter ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}>
                <SlidersHorizontal className="h-3 w-3" />
                Todos
                <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${!sectorFilter ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {asociadas.length}
                </span>
              </button>
              {Object.entries(sectores).map(([sector, count]) => (
                <button key={sector} onClick={() => setSectorFilter(sector === sectorFilter ? null : sector)}
                  className={`cursor-pointer shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    sectorFilter === sector ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}>
                  <MapPin className="h-3 w-3" />
                  {sector}
                  <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${sectorFilter === sector ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Registros</p>
          <p className="mt-0.5 text-xl font-bold text-slate-800">{exportData.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Campos</p>
          <p className="mt-0.5 text-xl font-bold text-slate-800">{selectedCols.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Formato</p>
          <p className="mt-0.5 text-xl font-bold text-slate-800 uppercase">{format}</p>
        </div>
      </div>

      <Card>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button onClick={handleExport} disabled={exportData.length === 0 || selectedCols.length === 0}
              className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed">
              <Download className="h-4 w-4" />
              Descargar {FORMATS.find((f) => f.id === format)?.label}
            </button>
            <button onClick={copyJSON} disabled={exportData.length === 0}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              {copied ? <><Check className="h-4 w-4 text-emerald-500" /> Copiado</> : <><FileCode className="h-4 w-4" /> Copiar JSON</>}
            </button>
          </div>
          {exportData.length > 0 && (
            <p className="text-xs text-slate-400 text-center">
              Se exportarán <span className="font-medium text-slate-600">{exportData.length}</span> registro{exportData.length !== 1 ? "s" : ""} con <span className="font-medium text-slate-600">{selectedCols.length}</span> campo{selectedCols.length !== 1 ? "s" : ""}.
              {sectorFilter && <> Sector: <span className="font-medium text-slate-600">{sectorFilter}</span>.</>}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ExportadorAsociadas;
