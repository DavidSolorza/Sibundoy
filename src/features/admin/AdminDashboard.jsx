import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BarChart3, ClipboardList, CheckCircle, User, Navigation, AlertTriangle, Clock, TrendingUp, Layers, Download } from "lucide-react";
import useAsociadas from "../asociadas/useAsociadas";
import useVisitas from "../visitas/useVisitas";
import StatCard from "../../shared/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../../shared/ui/Card";
import Modal from "../../shared/ui/Modal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Legend, Cell, LineChart, Line, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["#1e293b", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#06b6d4", "#d946ef", "#eab308", "#64748b"];
const EDAD_RANGES = ["18–25", "26–35", "36–45", "46–55", "56–65", "66+"];
const RANGE_MIN = [18, 26, 36, 46, 56, 66];
const RANGE_MAX = [25, 35, 45, 55, 65, 999];
const DIAS_ALERTA_VISITA = 30;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function daysSince(dateStr) {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 999;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function CustomTooltip({ active, payload }) {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-slate-900">{payload[0].payload.name}</p>
        <p className="text-slate-600">Asociadas: <span className="font-medium">{payload[0].value}</span></p>
        {payload[0].payload.beneficiarios && <p className="text-slate-600">Beneficiarios: <span className="font-medium">{payload[0].payload.beneficiarios}</span></p>}
      </div>
    );
  }
  return null;
}

function SectorDetailModal({ sectorName, asociadas: items, onClose }) {
  const navigate = useNavigate();
  const stats = useMemo(() => {
    const total = items.length;
    const edades = items.map((a) => a.edad);
    const promEdad = (edades.reduce((s, e) => s + e, 0) / total).toFixed(1);
    const beneficiarios = items.reduce((s, a) => s + (a.numPersonas || 1), 0);
    const visitas = items.reduce((s, a) => s + a.numVisitas, 0);
    return { total, promEdad, beneficiarios, visitas };
  }, [items]);

  return (
    <Modal open={!!sectorName} onClose={onClose} title={sectorName || ""}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Asociadas</p>
            <p className="text-lg font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Edad Prom.</p>
            <p className="text-lg font-bold text-slate-800">{stats.promEdad}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Beneficiarios</p>
            <p className="text-lg font-bold text-slate-800">{stats.beneficiarios}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Visitas</p>
            <p className="text-lg font-bold text-slate-800">{stats.visitas}</p>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {items.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <button onClick={() => { onClose(); navigate(`/asociada/${a.id}`); }} className="cursor-pointer font-medium text-slate-800 truncate hover:text-blue-600 transition-colors">{a.nombre}</button>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs text-slate-400">{a.edad} años</span>
                <button onClick={() => { onClose(); navigate("/", { state: { routeTo: [a.lat, a.lng] } }); }} className="cursor-pointer rounded-md bg-blue-50 p-1 text-blue-600 transition-colors hover:bg-blue-100" title="Ver en mapa">
                  <Navigation className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function TipoDetailModal({ tipoName, asociadas: items, onClose }) {
  const navigate = useNavigate();
  const stats = useMemo(() => {
    const total = items.length;
    const edades = items.map((a) => a.edad);
    const promEdad = (edades.reduce((s, e) => s + e, 0) / total).toFixed(1);
    return { total, promEdad };
  }, [items]);

  return (
    <Modal open={!!tipoName} onClose={onClose} title={tipoName || ""}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Asociadas</p>
            <p className="text-lg font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Edad Prom.</p>
            <p className="text-lg font-bold text-slate-800">{stats.promEdad}</p>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {items.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <button onClick={() => { onClose(); navigate(`/asociada/${a.id}`); }} className="cursor-pointer font-medium text-slate-800 truncate hover:text-blue-600 transition-colors">{a.nombre}</button>
              </div>
              <span className="text-xs text-slate-400 shrink-0 ml-2">Edad: {a.edad}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function ListModal({ title, items, onClose }) {
  const navigate = useNavigate();
  return (
    <Modal open={!!title} onClose={onClose} title={title || ""}>
      <div className="max-h-96 overflow-y-auto space-y-1.5">
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <button onClick={() => { onClose(); navigate(`/asociada/${a.id}`); }}
                className="cursor-pointer font-medium text-slate-800 truncate hover:text-blue-600 transition-colors">
                {a.nombre}
              </button>
            </div>
            {a.subtext && <span className="text-xs text-slate-400 shrink-0 ml-2">{a.subtext}</span>}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function BreakdownModal({ title, items, onClose, valueLabel }) {
  return (
    <Modal open={!!title} onClose={onClose} title={title || ""}>
      <div className="max-h-96 overflow-y-auto space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors">
            <span className="font-medium text-slate-800 truncate">{item.name}</span>
            <span className="text-xs font-semibold text-slate-500 shrink-0 ml-2">{item.value} {valueLabel}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function AdminDashboard() {
  const { asociadas } = useAsociadas();
  const { visitas } = useVisitas();
  const [sectorModal, setSectorModal] = useState(null);
  const [tipoModal, setTipoModal] = useState(null);
  const [detailSector, setDetailSector] = useState(null);
  const [listModal, setListModal] = useState(null);
  const [breakdownModal, setBreakdownModal] = useState(null);
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef(null);

  const stats = useMemo(() => {
    const sectores = {};
    const sectoresEdad = {};
    const sectoresPersonas = {};
    const sectoresVisitas = {};
    const tipos = {};
    asociadas.forEach((a) => {
      if (a.sector) {
        sectores[a.sector] = (sectores[a.sector] || 0) + 1;
        if (!sectoresEdad[a.sector]) sectoresEdad[a.sector] = [];
        sectoresEdad[a.sector].push(a.edad);
        sectoresPersonas[a.sector] = (sectoresPersonas[a.sector] || 0) + (a.numPersonas || 1);
        sectoresVisitas[a.sector] = (sectoresVisitas[a.sector] || 0) + a.numVisitas;
      }
      if (a.tipoPersona) tipos[a.tipoPersona] = (tipos[a.tipoPersona] || 0) + 1;
    });
    return { sectores, sectoresEdad, sectoresPersonas, sectoresVisitas, tipos };
  }, [asociadas]);

  const totalVisitas = asociadas.reduce((sum, a) => sum + a.numVisitas, 0);
  const edadValidas = asociadas.filter((a) => a.edad != null && !isNaN(a.edad));
  const promedioEdad = edadValidas.length > 0 ? (edadValidas.reduce((sum, a) => sum + a.edad, 0) / edadValidas.length).toFixed(1) : "—";
  const activas = asociadas.filter((a) => a.numVisitas > 0).length;
  const totalBeneficiarios = asociadas.reduce((sum, a) => sum + a.numPersonas, 0);
  const totalExtension = asociadas.reduce((sum, a) => {
    if (!a.areaHuerta) return sum;
    const num = parseFloat(a.areaHuerta.toString().replace(/[^0-9.,]/g, "").replace(",", "."));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  const totalMenores = asociadas.reduce((sum, a) => sum + (a.menoresHogar || 0), 0);
  const sectorNamesList = Object.keys(stats.sectores);

  const alertas = useMemo(() => {
    const sinVisita = asociadas.filter((a) => daysSince(a.fechaUltimaVisita) > DIAS_ALERTA_VISITA);
    const bajaFrec = asociadas.filter((a) => a.numVisitas < 2);
    const sectoresPromVisitas = Object.entries(stats.sectoresVisitas).map(([sector, visitas]) => ({
      sector,
      prom: (visitas / (stats.sectores[sector] || 1)).toFixed(1),
      total: stats.sectores[sector] || 0,
    })).sort((a, b) => a.prom - b.prom).slice(0, 3);
    return { sinVisita, bajaFrec, sectoresPromVisitas };
  }, [asociadas, stats]);

  const sectorChartData = useMemo(() =>
    Object.entries(stats.sectores)
      .map(([name, value]) => ({ name: name.replace("Vereda ", ""), value, beneficiarios: stats.sectoresPersonas[name] || value, fullName: name }))
      .sort((a, b) => b.value - a.value),
    [stats.sectores, stats.sectoresPersonas]
  );

  const tipoChartData = useMemo(() =>
    Object.entries(stats.tipos).map(([name, value]) => ({ name, value })),
    [stats.tipos]
  );

  const edadChartData = useMemo(() =>
    EDAD_RANGES.map((label, i) => ({
      name: label,
      value: asociadas.filter((a) => a.edad >= RANGE_MIN[i] && a.edad <= RANGE_MAX[i]).length,
    })),
    [asociadas]
  );

  const prodChartData = useMemo(() => {
    const prodCount = {};
    asociadas.forEach((a) => {
      (a.productos || "").split(",").forEach((p) => {
        const name = p.trim().toLowerCase();
        if (name) prodCount[name] = (prodCount[name] || 0) + 1;
      });
    });
    return Object.entries(prodCount)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [asociadas]);

  const visitasPorMes = useMemo(() => {
    const counts = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      counts[key] = { label: MESES[d.getMonth()], año: d.getFullYear(), key, count: 0, completo: `${MESES[d.getMonth()]} ${d.getFullYear()}` };
    }
    visitas.forEach((v) => {
      if (!v.fecha) return;
      const d = new Date(v.fecha);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (counts[key]) counts[key].count++;
    });
    return Object.values(counts);
  }, [visitas]);

  const conUbicacion = asociadas.filter((a) => a.lat != null && a.lng != null).length;
  const sinVisitas = asociadas.filter((a) => !a.numVisitas).length;
  const promVisitas = asociadas.length > 0 ? (totalVisitas / asociadas.length).toFixed(1) : "0";
  const promProductos = asociadas.length > 0 ? (asociadas.reduce((s, a) => s + ((a.productos || "").split(",").filter(Boolean).length), 0) / asociadas.length).toFixed(1) : "0";

  const handleBarClick = useCallback((data) => {
    if (data?.fullName) {
      setSectorModal({ name: data.fullName, list: asociadas.filter((a) => a.sector === data.fullName) });
    }
  }, [asociadas]);

  const handlePieClick = useCallback((data) => {
    if (data?.name) {
      setTipoModal({ name: data.name, list: asociadas.filter((a) => a.tipoPersona === data.name) });
    }
  }, [asociadas]);

  const handleTableRowClick = useCallback((sectorFullName) => {
    setDetailSector({ name: sectorFullName, list: asociadas.filter((a) => a.sector === sectorFullName) });
  }, [asociadas]);

  const totalAlertas = alertas.sinVisita.length + alertas.bajaFrec.length;

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      let y = 15;

      const title = (txt, size = 16, gap = 8) => {
        pdf.setFontSize(size);
        pdf.text(txt, pageW / 2, y, { align: "center" });
        y += gap;
      };
      const subtitle = (txt, size = 10, gap = 5) => {
        pdf.setFontSize(size);
        pdf.setTextColor(100);
        pdf.text(txt, pageW / 2, y, { align: "center" });
        y += gap;
        pdf.setTextColor(0);
      };
      const section = (txt) => {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setFontSize(13);
        pdf.setTextColor(30, 41, 59);
        pdf.text(txt, 14, y);
        y += 6;
        pdf.setDrawColor(30, 41, 59);
        pdf.line(14, y, pageW - 14, y);
        y += 5;
        pdf.setTextColor(0);
      };
      const text = (txt, size = 9, indent = 14) => {
        if (y > 275) { pdf.addPage(); y = 20; }
        pdf.setFontSize(size);
        const lines = pdf.splitTextToSize(txt, pageW - indent - 14);
        pdf.text(lines, indent, y);
        y += lines.length * 4 + 3;
      };
      const table = (headers, rows) => {
        if (rows.length === 0) { text("Sin datos", 9); return; }
        if (y > 230) { pdf.addPage(); y = 20; }
        autoTable(pdf, {
          startY: y,
          head: [headers],
          body: rows,
          theme: "grid",
          headStyles: { fillColor: [30, 41, 59], fontSize: 8, halign: "center" },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
          didDrawPage: (data) => { y = data.cursor.y + 6; },
        });
        y = pdf.lastAutoTable.finalY + 8;
      };

      title("Informe General - AgroMap", 20, 20);
      subtitle("Panel Administrativo · Asociadas Sibundoy", 11, 15);
      const today = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
      subtitle(`Generado el ${today}`, 9, 10);
      y += 5;

      section("1. Resumen General");
      table(["Indicador", "Valor"], [
        ["Total Asociadas", asociadas.length],
        ["Promedio Edad", promedioEdad],
        ["Total Visitas", totalVisitas],
        ["Asociadas Activas (>0 visitas)", activas],
        ["Total Beneficiarios", totalBeneficiarios],
        ["Extensión De Tierra", `${totalExtension.toFixed(1)} m²`],
        ["Menores De Edad", totalMenores],
        ["Total Sectores", sectorNamesList.length],
        ["Con Ubicación", `${conUbicacion} / ${asociadas.length} (${asociadas.length > 0 ? ((conUbicacion / asociadas.length) * 100).toFixed(0) : 0}%)`],
        ["Sin Visitas", sinVisitas],
        ["Prom. Visitas/Asoc", promVisitas],
        ["Prom. Productos/Asoc", promProductos],
        ["Alertas", totalAlertas],
      ]);

      section("2. Distribución por Sector");
      table(
        ["Sector", "Asociadas", "Beneficiarios", "Visitas", "Prom."],
        sectorChartData.map((s) => [
          s.name, s.value, s.beneficiarios,
          stats.sectoresVisitas[s.fullName] || 0,
          ((stats.sectoresVisitas[s.fullName] || 0) / s.value).toFixed(1),
        ])
      );

      section("3. Tipo de Población");
      table(["Tipo", "Cantidad"], tipoChartData.map((t) => [t.name, t.value]));

      section("4. Rangos de Edad");
      table(["Rango", "Cantidad"], edadChartData.map((e) => [e.name, e.value]));

      section("5. Productos Más Cultivados");
      table(["Producto", "Asociadas"], prodChartData.map((p) => [p.name, p.value]));

      section("6. Visitas por Mes");
      table(["Mes", "Visitas"], visitasPorMes.map((v) => [v.completo, v.count]));

      section("7. Sectores con Menor Promedio de Visitas");
      table(
        ["Sector", "Asociadas", "Prom. Visitas"],
        alertas.sectoresPromVisitas.map((s) => [s.sector.replace("Vereda ", ""), s.total, s.prom])
      );

      section("8. Asociadas Sin Visita Reciente (+30 días)");
      const sinVRows = alertas.sinVisita.slice(0, 20).map((a) => [a.nombre, a.sector?.replace("Vereda ", ""), a.fechaUltimaVisita || "Nunca"]);
      autoTable(pdf, {
        startY: y,
        head: [["Nombre", "Sector", "Última Visita"]],
        body: sinVRows,
        theme: "grid",
        headStyles: { fillColor: [245, 158, 11], fontSize: 8, halign: "center" },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
      y = pdf.lastAutoTable.finalY + 8;
      if (alertas.sinVisita.length > 20) text(`... y ${alertas.sinVisita.length - 20} más`, 8);

      pdf.save("informe-general.pdf");
    } catch (err) {
      console.error("Error exportando PDF:", err);
    } finally {
      setExporting(false);
    }
  }, [
    asociadas, stats, totalVisitas, promedioEdad, activas, totalBeneficiarios,
    totalExtension, totalMenores, sectorNamesList, sectorChartData, tipoChartData,
    edadChartData, prodChartData, visitasPorMes, alertas, conUbicacion,
    sinVisitas, promVisitas, promProductos, totalAlertas,
  ]);

  return (
    <div className="space-y-6" ref={dashboardRef}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
          <BarChart3 className="h-5 w-5" />
          Panel Administrativo
        </h2>
        <button onClick={handleExportPDF} disabled={exporting}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50">
          <Download className="h-4 w-4" />
          {exporting ? "Exportando..." : "Exportar PDF"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Asociadas" value={asociadas.length} icon={Users} onClick={() => setListModal({ title: "Todas las Asociadas", items: asociadas.map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.edad} años` })) })} />
        <StatCard label="Promedio Edad" value={`${promedioEdad} años`} icon={BarChart3} onClick={() => setListModal({ title: "Promedio de Edad", items: [...asociadas].sort((a, b) => b.edad - a.edad).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.edad} años` })) })} />
        <StatCard label="Total Visitas" value={totalVisitas} icon={ClipboardList} onClick={() => setListModal({ title: "Total Visitas", items: [...asociadas].sort((a, b) => b.numVisitas - a.numVisitas).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.numVisitas} visitas` })) })} />
        <StatCard label="Asociadas Activas" value={activas} icon={CheckCircle} onClick={() => setListModal({ title: "Asociadas Activas", items: asociadas.filter(a => a.numVisitas > 0).sort((a, b) => b.numVisitas - a.numVisitas).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.numVisitas} visitas` })) })} />
        <button onClick={() => document.getElementById('alertas-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-amber-200 active:bg-amber-50/50">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${totalAlertas > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Alertas</p>
              <p className={`text-2xl font-bold ${totalAlertas > 0 ? "text-amber-600" : "text-emerald-600"}`}>{totalAlertas}</p>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <button onClick={() => setBreakdownModal({ title: "Total Sectores", items: Object.entries(stats.sectores).map(([name, value]) => ({ name: name.replace("Vereda ", ""), value })).sort((a, b) => b.value - a.value) })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Sectores</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{sectorNamesList.length}</p>
        </button>
        <button onClick={() => setListModal({ title: "Total Beneficiarios", items: [...asociadas].sort((a, b) => (b.numPersonas || 1) - (a.numPersonas || 1)).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.numPersonas || 1} personas` })) })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Beneficiarios</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalBeneficiarios}</p>
        </button>
        <button onClick={() => setListModal({ title: "Extensión De Tierra", items: asociadas.filter(a => a.areaHuerta).sort((a, b) => parseFloat(b.areaHuerta) - parseFloat(a.areaHuerta)).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.areaHuerta} m²` })) })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Extensión De Tierra</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalExtension.toFixed(1)} m²</p>
        </button>
        <button onClick={() => setListModal({ title: "Menores De Edad", items: asociadas.filter(a => a.menoresHogar > 0).sort((a, b) => (b.menoresHogar || 0) - (a.menoresHogar || 0)).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.menoresHogar} menores` })) })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Menores De Edad</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalMenores}</p>
        </button>
        <button onClick={() => setBreakdownModal({ title: "Productos", items: prodChartData, valueLabel: "asoc" })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Productos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{prodChartData.length}</p>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <button onClick={() => setListModal({ title: "Con Ubicación", items: asociadas.filter(a => a.lat != null && a.lng != null).map(a => ({ id: a.id, nombre: a.nombre, subtext: "Con ubicación" })) })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Con Ubicación</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{conUbicacion} <span className="text-sm font-normal text-slate-400">/ {asociadas.length}</span></p>
        </button>
        <button onClick={() => setListModal({ title: "Prom. Visitas/Asoc", items: [...asociadas].sort((a, b) => b.numVisitas - a.numVisitas).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.numVisitas} visitas` })) })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Prom. Visitas/Asoc</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{promVisitas}</p>
        </button>
        <button onClick={() => setListModal({ title: "Prom. Productos/Asoc", items: [...asociadas].sort((a, b) => (b.productos || "").split(",").filter(Boolean).length - (a.productos || "").split(",").filter(Boolean).length).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${(a.productos || "").split(",").filter(Boolean).length} productos` })) })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Prom. Productos/Asoc</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{promProductos}</p>
        </button>
        <button onClick={() => setListModal({ title: "Sin Visitas", items: asociadas.filter(a => !a.numVisitas).map(a => ({ id: a.id, nombre: a.nombre, subtext: "Sin visitas" })) })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Sin Visitas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{sinVisitas}</p>
        </button>
        <button onClick={() => setBreakdownModal({ title: "% Cobertura", items: [{ name: "Con ubicación", value: conUbicacion }, { name: "Sin ubicación", value: asociadas.length - conUbicacion }], valueLabel: "asoc" })}
          className="cursor-pointer w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-blue-200 active:bg-blue-50/50">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">% Cobertura</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{asociadas.length > 0 ? ((conUbicacion / asociadas.length) * 100).toFixed(0) : 0}%</p>
        </button>
      </div>

      {totalAlertas > 0 && (
        <Card id="alertas-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-600" />Alertas Inteligentes</CardTitle>
          </CardHeader>
          <div className="-mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alertas.sinVisita.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-semibold text-amber-800">Sin visita reciente</p>
                  <span className="ml-auto text-lg font-bold text-amber-700">{alertas.sinVisita.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {alertas.sinVisita.map((a) => (
                    <button key={a.id} onClick={() => setSectorModal({ name: a.sector, list: asociadas.filter((x) => x.sector === a.sector) })}
                      className="cursor-pointer rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm border border-amber-100 hover:bg-white transition-colors">
                      {a.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {alertas.bajaFrec.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50/50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <p className="text-xs font-semibold text-orange-800">Baja frecuencia de visitas</p>
                  <span className="ml-auto text-lg font-bold text-orange-700">{alertas.bajaFrec.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {alertas.bajaFrec.map((a) => (
                    <button key={a.id} onClick={() => setSectorModal({ name: a.sector, list: asociadas.filter((x) => x.sector === a.sector) })}
                      className="cursor-pointer rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm border border-orange-100 hover:bg-white transition-colors">
                      {a.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {alertas.sectoresPromVisitas.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <BarChart3 className="h-4 w-4 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-800">Sectores con menos visitas</p>
                </div>
                <div className="space-y-1">
                  {alertas.sectoresPromVisitas.map((s) => (
                    <button key={s.sector} onClick={() => setDetailSector({ name: s.sector, list: asociadas.filter((x) => x.sector === s.sector) })}
                      className="cursor-pointer w-full flex items-center justify-between rounded-md bg-white/80 px-2 py-1 text-[11px] text-slate-700 shadow-sm border border-slate-200 hover:bg-white transition-colors">
                      <span className="font-medium truncate mr-2">{s.sector.replace("Vereda ", "")}</span>
                      <span className="shrink-0 text-slate-400">{s.prom} vis/asoc</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-600" />Asociadas por Sector</CardTitle>
          </CardHeader>
          <div className="h-80 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorChartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#334155" }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20} cursor="pointer" onClick={(e) => handleBarClick(e?.payload)}>
                  {sectorChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />Tipo de Población</CardTitle>
          </CardHeader>
          <div className="flex h-72 items-center justify-center px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tipoChartData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3} cursor="pointer" onClick={(e) => handlePieClick(e?.payload)}>
                  {tipoChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={40} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" />Distribución por Edad</CardTitle>
          </CardHeader>
          <div className="h-64 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={edadChartData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50} cursor="pointer" onClick={(e) => {
                  const range = e?.payload?.name;
                  if (!range) return;
                  const idx = EDAD_RANGES.indexOf(range);
                  const list = asociadas.filter((a) => a.edad >= RANGE_MIN[idx] && a.edad <= RANGE_MAX[idx]);
                  setSectorModal({ name: `Edad: ${range}`, list });
                }}>
                  {edadChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" />Top Productos Cultivados</CardTitle>
          </CardHeader>
          <div className="h-64 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prodChartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#334155" }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16} cursor="pointer" onClick={(e) => {
                  const prod = e?.payload?.name;
                  if (!prod) return;
                  const list = asociadas.filter((a) => (a.productos || "").toLowerCase().includes(prod.toLowerCase()));
                  setSectorModal({ name: `Producto: ${prod}`, list });
                }}>
                  {prodChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-600" />Visitas por Mes</CardTitle>
          </CardHeader>
          <div className="h-64 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitasPorMes} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => active && payload?.length ? (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                      <p className="font-semibold text-slate-900">{payload[0].payload.completo}</p>
                      <p className="text-slate-600">Visitas: <span className="font-medium">{payload[0].value}</span></p>
                    </div>
                  ) : null}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-emerald-600" />Detalle por Sector</CardTitle>
          </CardHeader>
          <div className="overflow-auto rounded-lg border border-slate-200 max-h-72">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white">#</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white">Sector</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white">Asoc</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white">Benef</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white">Vis</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-white">Men</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sectorChartData.map((item, i) => {
                  const visitasSector = stats.sectoresVisitas[sectorNamesList[i]] || 0;
                  const menoresSector = asociadas.filter((a) => a.sector === item.fullName).reduce((s, a) => s + (a.menoresHogar || 0), 0);
                  return (
                    <tr key={i} onClick={() => handleTableRowClick(item.fullName)} className="transition-colors duration-150 hover:bg-slate-50 cursor-pointer">
                      <td className="px-3 py-2 text-sm text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 text-sm font-medium text-slate-900 whitespace-nowrap">{item.name}</td>
                      <td className="px-3 py-2 text-sm text-slate-700 font-semibold">{item.value}</td>
                      <td className="px-3 py-2 text-sm text-slate-600">{item.beneficiarios}</td>
                      <td className="px-3 py-2 text-sm text-slate-600">{visitasSector}</td>
                      <td className="px-3 py-2 text-sm text-slate-600">{menoresSector}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {sectorModal && (
        <SectorDetailModal sectorName={sectorModal.name} asociadas={sectorModal.list} onClose={() => setSectorModal(null)} />
      )}
      {tipoModal && (
        <TipoDetailModal tipoName={tipoModal.name} asociadas={tipoModal.list} onClose={() => setTipoModal(null)} />
      )}
      {detailSector && (
        <SectorDetailModal sectorName={detailSector.name} asociadas={detailSector.list} onClose={() => setDetailSector(null)} />
      )}
      {listModal && (
        <ListModal title={listModal.title} items={listModal.items} onClose={() => setListModal(null)} />
      )}
      {breakdownModal && (
        <BreakdownModal title={breakdownModal.title} items={breakdownModal.items} onClose={() => setBreakdownModal(null)} valueLabel={breakdownModal.valueLabel} />
      )}

    </div>
  );
}

export default AdminDashboard;
