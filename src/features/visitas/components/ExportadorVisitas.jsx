import { useState, useMemo, useCallback } from "react";
import { Download, FileSpreadsheet, FileText, FileCode, FileDown, Check, X, SlidersHorizontal, MapPin, Loader2, Calendar } from "lucide-react";
import useAsociadas from "../../asociadas/useAsociadas";
import useVisitas from "../useVisitas";
import { Card } from "../../../shared/ui/Card";
import { useToast } from "../../../shared/ui/Toast";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ALL_COLUMNS = [
  { key: "nombre", label: "Nombre", always: true },
  { key: "sector", label: "Sector" },
  { key: "fecha", label: "Fecha" },
  { key: "mes", label: "Mes" },
  { key: "anio", label: "Año" },
  { key: "tipo", label: "Tipo" },
  { key: "observaciones", label: "Observaciones" },
  { key: "proximaVisita", label: "Próxima Visita" },
];

const FORMATS = [
  { id: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet, color: "bg-emerald-600 hover:bg-emerald-700" },
  { id: "csv", label: "CSV (.csv)", icon: FileCode, color: "bg-blue-600 hover:bg-blue-700" },
  { id: "pdf", label: "PDF (.pdf)", icon: FileDown, color: "bg-red-600 hover:bg-red-700" },
  { id: "json", label: "JSON (.json)", icon: FileText, color: "bg-slate-800 hover:bg-slate-700" },
];

function getAnos(visitas) {
  const anos = new Set();
  visitas.forEach((v) => {
    if (v.fecha) anos.add(new Date(v.fecha).getFullYear());
  });
  return [...anos].sort((a, b) => b - a);
}

function ExportadorVisitas() {
  const { asociadas } = useAsociadas();
  const { visitas } = useVisitas();
  const { showToast, ToastDisplay } = useToast();
  const [selectedCols, setSelectedCols] = useState(ALL_COLUMNS.map((c) => c.key));
  const [format, setFormat] = useState("xlsx");
  const [sectorFilter, setSectorFilter] = useState(null);
  const [mesFilter, setMesFilter] = useState(null);
  const [anioFilter, setAnioFilter] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const asociadaMap = useMemo(() => {
    const map = {};
    asociadas.forEach((a) => { map[a.id] = a; });
    return map;
  }, [asociadas]);

  const sectores = useMemo(() => {
    const map = {};
    asociadas.forEach((a) => {
      map[a.sector] = (map[a.sector] || 0) + 1;
    });
    return map;
  }, [asociadas]);

  const anosDisponibles = useMemo(() => getAnos(visitas), [visitas]);

  const visitasConAsociada = useMemo(() => {
    return visitas
      .map((v) => {
        const a = asociadaMap[v.asociadaId];
        if (!a) return null;
        const fecha = v.fecha ? new Date(v.fecha) : null;
        return {
          ...v,
          nombre: a.nombre,
          sector: a.sector,
          mes: fecha ? MESES[fecha.getMonth()] : "",
          anio: fecha ? fecha.getFullYear() : "",
          fechaStr: fecha ? fecha.toISOString().split("T")[0] : "",
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [visitas, asociadaMap]);

  const filteredData = useMemo(() => {
    return visitasConAsociada.filter((v) => {
      if (sectorFilter && v.sector !== sectorFilter) return false;
      if (mesFilter && v.mes !== mesFilter) return false;
      if (anioFilter && v.anio !== anioFilter) return false;
      return true;
    });
  }, [visitasConAsociada, sectorFilter, mesFilter, anioFilter]);

  const exportData = useMemo(() => {
    const cols = ALL_COLUMNS.filter((c) => selectedCols.includes(c.key));
    return filteredData.map((v) => {
      const row = {};
      cols.forEach((c) => {
        if (c.key === "fecha") row[c.label] = v.fechaStr ?? "";
        else if (c.key === "proximaVisita") row[c.label] = v.proximaVisita ?? "";
        else row[c.label] = v[c.key] ?? "";
      });
      return row;
    });
  }, [filteredData, selectedCols]);

  const toggleCol = useCallback((key) => {
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const allSelected = selectedCols.length === ALL_COLUMNS.length;

  const exportToXLSX = useCallback(async () => {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Visitas");
      XLSX.writeFile(wb, `visitas_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast("Excel descargado correctamente");
    } catch (e) {
      console.error("Error exportando XLSX:", e);
      showToast("Error al descargar Excel: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [exportData, showToast]);

  const exportToCSV = useCallback(() => {
    try {
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
      a.download = `visitas_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("CSV descargado correctamente");
    } catch (e) {
      console.error("Error exportando CSV:", e);
      showToast("Error al descargar CSV", "error");
    }
  }, [exportData, showToast]);

  const exportToJSON = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visitas_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("JSON descargado correctamente");
    } catch (e) {
      console.error("Error exportando JSON:", e);
      showToast("Error al descargar JSON", "error");
    }
  }, [exportData, showToast]);

  const exportToPDF = useCallback(async () => {
    setLoading(true);
    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableModule.default;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const headers = Object.keys(exportData[0] || {});
      const rows = exportData.map((row) => headers.map((h) => String(row[h] ?? "")));

      const dateStr = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
      const title = "Visitas - AgroMap";
      const subtitle = `Sibundoy, Putumayo · ${dateStr} · ${exportData.length} registros${sectorFilter ? ` · Sector: ${sectorFilter}` : ""}${mesFilter ? ` · Mes: ${mesFilter}` : ""}${anioFilter ? ` · Año: ${anioFilter}` : ""}`;

      doc.setFontSize(16);
      doc.text(title, 14, 18);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(subtitle, 14, 25);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 30,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.1,
      });

      doc.save(`visitas_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast("PDF descargado correctamente");
    } catch (e) {
      console.error("Error exportando PDF:", e);
      showToast("Error al descargar PDF: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [exportData, sectorFilter, mesFilter, anioFilter, showToast]);

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

  const sectoresList = Object.entries(sectores);

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
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Campos a incluir</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Filtrar por sector</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button onClick={() => setSectorFilter(null)}
                  className={`cursor-pointer shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    !sectorFilter ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}>
                  <SlidersHorizontal className="h-3 w-3" />
                  Todos
                  <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${!sectorFilter ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {visitasConAsociada.length}
                  </span>
                </button>
                {sectoresList.map(([sector]) => (
                  <button key={sector} onClick={() => setSectorFilter(sector === sectorFilter ? null : sector)}
                    className={`cursor-pointer shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      sectorFilter === sector ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                    }`}>
                    <MapPin className="h-3 w-3" />
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Filtrar por mes</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button onClick={() => setMesFilter(null)}
                  className={`cursor-pointer shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    !mesFilter ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}>
                  <Calendar className="h-3 w-3" />
                  Todos
                </button>
                {MESES.map((mes) => (
                  <button key={mes} onClick={() => setMesFilter(mes === mesFilter ? null : mes)}
                    className={`cursor-pointer shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      mesFilter === mes ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                    }`}>
                    {mes.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Filtrar por año</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button onClick={() => setAnioFilter(null)}
                  className={`cursor-pointer shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    !anioFilter ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}>
                  <Calendar className="h-3 w-3" />
                  Todos
                </button>
                {anosDisponibles.map((ano) => (
                  <button key={ano} onClick={() => setAnioFilter(ano === anioFilter ? null : ano)}
                    className={`cursor-pointer shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      anioFilter === ano ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                    }`}>
                    {ano}
                  </button>
                ))}
              </div>
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
            <button onClick={handleExport} disabled={exportData.length === 0 || selectedCols.length === 0 || loading}
              className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {loading ? "Preparando descarga…" : `Descargar ${FORMATS.find((f) => f.id === format)?.label}`}
            </button>
            <button onClick={copyJSON} disabled={exportData.length === 0 || loading}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              {copied ? <><Check className="h-4 w-4 text-emerald-500" /> Copiado</> : <><FileCode className="h-4 w-4" /> Copiar JSON</>}
            </button>
          </div>
          {exportData.length > 0 && (
            <p className="text-xs text-slate-400 text-center">
              Se exportarán <span className="font-medium text-slate-600">{exportData.length}</span> registro{exportData.length !== 1 ? "s" : ""} con <span className="font-medium text-slate-600">{selectedCols.length}</span> campo{selectedCols.length !== 1 ? "s" : ""}.
              {sectorFilter && <> Sector: <span className="font-medium text-slate-600">{sectorFilter}</span>.</>}
              {mesFilter && <> Mes: <span className="font-medium text-slate-600">{mesFilter}</span>.</>}
              {anioFilter && <> Año: <span className="font-medium text-slate-600">{anioFilter}</span>.</>}
            </p>
          )}
        </div>
      </Card>
      {ToastDisplay}
    </div>
  );
}

export default ExportadorVisitas;
