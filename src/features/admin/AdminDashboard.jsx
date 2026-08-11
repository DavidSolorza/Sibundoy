import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BarChart3, ClipboardList, CheckCircle, User, Navigation, AlertTriangle, Clock, TrendingUp, Layers, Download, MapPin, Wheat, Heart, Baby, XCircle, UserCheck } from "lucide-react";
import useAsociadas from "../asociadas/useAsociadas";
import useVisitas from "../visitas/useVisitas";
import { api } from "../../core/http/api";
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
  if (!dateStr) return Infinity;
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}
function parseArea(areaStr) {
  if (!areaStr) return 0;
  const num = parseFloat(areaStr.toString().replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return 0;
  if (areaStr.toString().toLowerCase().includes("hect")) return num * 10000;
  if (areaStr.toString().toLowerCase().includes("plaza")) return num * 6400;
  return num;
}
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-slate-900">{payload[0].payload.fullName || payload[0].payload.name}</p>
        <p className="text-slate-600">Asociadas: <span className="font-medium text-slate-900">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};
function SectorDetailModal({ sectorName, asociadas, onClose }) {
  const navigate = useNavigate();
  return (
    <Modal open={!!sectorName} onClose={onClose} title={`Detalle: ${sectorName || ""}`}>
      <div className="flex flex-col gap-4 max-h-[80vh]">
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold mb-1">Total Asociadas</p>
            <p className="text-2xl font-bold text-blue-700">{asociadas.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold mb-1">Beneficiarios</p>
            <p className="text-2xl font-bold text-emerald-700">{asociadas.reduce((sum, a) => sum + (a.numPersonas || 1), 0)}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Edad Prom.</p>
            <p className="text-lg font-bold text-slate-800">{asociadas.length > 0 ? (asociadas.reduce((s, a) => s + (a.edad || 0), 0) / asociadas.length).toFixed(1) : 0}</p>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {asociadas.map((a) => (
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
              <button onClick={() => { onClose(); navigate(`/asociada/${a.id}`); }} className="cursor-pointer font-medium text-slate-800 truncate hover:text-blue-600 transition-colors">{a.nombre}</button>
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
  
  const [dashboardData, setDashboardData] = useState(null);
  const [alertasData, setAlertasData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  
  const dashboardRef = useRef(null);

  const closeAllModals = useCallback(() => {
    setSectorModal(null);
    setTipoModal(null);
    setDetailSector(null);
    setListModal(null);
    setBreakdownModal(null);
  }, []);

  const cargarDashboard = useCallback(async () => {
    try {
      const [dashRes, alertRes] = await Promise.all([
        api.getDashboard(),
        api.getAlertas()
      ]);
      setDashboardData(dashRes);
      setAlertasData(alertRes || []);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  const realizadas = visitas.filter((v) => v.realizada);
  const pendientes = visitas.filter((v) => !v.realizada);

  const visitasPorAsociada = {};
  visitas.forEach(v => {
    visitasPorAsociada[v.asociadaId] = (visitasPorAsociada[v.asociadaId] || 0) + 1;
  });

  const visitasRealizadas = realizadas.length;
  const visitasPendientes = pendientes.length;

  const backendStats = dashboardData?.stats || {};
  const sectorNamesList = (dashboardData?.stats_sectores || [])
    .filter(s => s.total_asociadas > 0)
    .map(s => s.nombre);
  
  const sinVisita = alertasData?.filter(a => a.alerta_sin_visita) || [];
  const bajaFrec = alertasData?.filter(a => a.alerta_baja_frecuencia) || [];
  const sectoresPromVisitas = [...(dashboardData?.stats_sectores || [])]
    .sort((a, b) => b.visitas_promedio - a.visitas_promedio)
    .slice(0, 3)
    .map(s => ({ sector: s.nombre, prom: s.visitas_promedio.toFixed(1), total: s.total_asociadas }));

  const sectorChartData = useMemo(() =>
    (dashboardData?.stats_sectores || [])
      .filter(s => s.total_asociadas > 0)
      .map(s => ({ name: s.nombre.replace("Vereda ", ""), value: s.total_asociadas, beneficiarios: s.total_beneficiarios, fullName: s.nombre, total_visitas: s.total_visitas }))
      .sort((a, b) => b.value - a.value),
    [dashboardData]
  );

  const tipoChartData = useMemo(() => {
    const counts = {};
    asociadas.forEach((a) => {
      const tipo = a.tipoPersona || "Sin Especificar";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [asociadas]);

  const edadChartData = useMemo(() =>
    (dashboardData?.distribucion_edad || [])
      .filter(e => e.rango)
      .map(e => ({ name: e.rango, value: e.total })),
    [dashboardData]
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
  const promVisitas = backendStats.total_asociadas > 0 ? (backendStats.total_visitas / backendStats.total_asociadas).toFixed(1) : "0";
  const promProductos = asociadas.length > 0 ? (asociadas.reduce((s, a) => s + ((a.productos || "").split(",").filter(Boolean).length), 0) / asociadas.length).toFixed(1) : "0";
  const totalExtension = asociadas.reduce((sum, a) => sum + parseArea(a.areaHuerta), 0);
  const totalMenores = asociadas.reduce((sum, a) => sum + (a.menoresHogar || 0), 0);

  const handleBarClick = useCallback((data) => {
    if (data?.fullName) {
      closeAllModals();
      setSectorModal({ name: data.fullName, list: asociadas.filter((a) => a.sector === data.fullName) });
    }
  }, [asociadas, closeAllModals]);

  const handlePieClick = useCallback((data) => {
    if (data?.name) {
      closeAllModals();
      setTipoModal({ name: data.name, list: asociadas.filter((a) => (a.tipoPersona || "Sin Especificar") === data.name) });
    }
  }, [asociadas, closeAllModals]);

  const handleTableRowClick = useCallback((sectorFullName) => {
    closeAllModals();
    setDetailSector({ name: sectorFullName, list: asociadas.filter((a) => a.sector === sectorFullName) });
  }, [asociadas, closeAllModals]);

  const totalAlertas = (sinVisita?.length || 0) + (bajaFrec?.length || 0);

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
        ["Total Asociadas", backendStats.total_asociadas || 0],
        ["Promedio Edad", backendStats.edad_promedio || 0],
        ["Total Visitas", backendStats.total_visitas || 0],
        ["Asociadas Activas (>0 visitas)", backendStats.activas || 0],
        ["Total Beneficiarios", backendStats.total_beneficiarios || 0],
        ["Extensión De Tierra", `${totalExtension.toFixed(1)} m²`],
        ["Menores De Edad", totalMenores],
        ["Total Sectores", backendStats.total_sectores || 0],
        ["Con Ubicación", `${conUbicacion} / ${backendStats.total_asociadas || 0}`],
        ["Sin Visitas", backendStats.inactivas || 0],
        ["Prom. Visitas/Asoc", promVisitas],
        ["Prom. Productos/Asoc", promProductos],
        ["Alertas", totalAlertas],
      ]);

      section("2. Distribución por Sector");
      table(
        ["Sector", "Asociadas", "Beneficiarios", "Visitas", "Prom."],
        sectorChartData.map((s) => [
          s.name, s.value, s.beneficiarios,
          (dashboardData?.stats_sectores?.find(x => x.nombre === s.fullName)?.total_visitas || 0),
          (dashboardData?.stats_sectores?.find(x => x.nombre === s.fullName)?.visitas_promedio || 0).toFixed(1),
        ])
      );

      section("3. Estado Civil");
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
        sectoresPromVisitas.map((s) => [s.sector.replace("Vereda ", ""), s.total, s.prom])
      );

      section("8. Asociadas Sin Visita Reciente (+30 días)");
      const sinVRows = sinVisita.slice(0, 20).map((a) => [a.nombre, a.sector?.replace("Vereda ", ""), a.fecha_ultima_visita || "Nunca"]);
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
      if (sinVisita.length > 20) text(`... y ${sinVisita.length - 20} más`, 8);

      pdf.save("informe-general.pdf");
    } catch (err) {
      console.error("Error exportando PDF:", err);
    } finally {
      setExporting(false);
    }
  }, [
    asociadas, backendStats, totalExtension, totalMenores, sectorNamesList, sectorChartData, tipoChartData,
    edadChartData, prodChartData, visitasPorMes, sinVisita, bajaFrec, sectoresPromVisitas, conUbicacion, promVisitas, promProductos, totalAlertas, dashboardData
  ]);

  return (
    <div className="space-y-6" ref={dashboardRef}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
          <BarChart3 className="h-5 w-5" />
          Panel Administrativo
        </h2>
        <button onClick={handleExportPDF} disabled={exporting || loadingDashboard}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50">
          <Download className="h-4 w-4" />
          {exporting ? "Exportando..." : "Exportar PDF"}
        </button>
      </div>
      {loadingDashboard ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Asociadas" value={backendStats.total_asociadas || 0} icon={Users} onClick={() => { closeAllModals(); setListModal({ title: "Todas las Asociadas", items: asociadas.map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.edad} años` })) }); }} />
            <StatCard label="Edad Promedio" value={Math.round(backendStats.edad_promedio || 0)} icon={User} onClick={() => { closeAllModals(); setBreakdownModal({ title: "Rangos de Edad", items: edadChartData, valueLabel: "personas" }); }} />
            <StatCard label="Total Beneficiarios" value={backendStats.total_beneficiarios || 0} icon={Heart} onClick={() => { closeAllModals(); setListModal({ title: "Total Beneficiarios", items: [...asociadas].sort((a, b) => (b.numPersonas || 1) - (a.numPersonas || 1)).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.numPersonas || 1} personas` })) }); }} />
            <StatCard label="Menores De Edad" value={totalMenores} icon={Baby} onClick={() => { closeAllModals(); setListModal({ title: "Menores De Edad", items: asociadas.filter(a => a.menoresHogar > 0).sort((a, b) => (b.menoresHogar || 0) - (a.menoresHogar || 0)).map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.menoresHogar} menores` })) }); }} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Visitas Realizadas" value={visitasRealizadas} icon={CheckCircle} onClick={() => { closeAllModals(); setListModal({ title: "Visitas Realizadas", items: realizadas.map(v => ({ id: v.id, nombre: asociadas.find(a => a.id === v.asociadaId)?.nombre || "—", subtext: v.fecha })) }); }} />
            <StatCard label="Visitas Pendientes" value={visitasPendientes} icon={Clock} onClick={() => { closeAllModals(); setListModal({ title: "Visitas Pendientes", items: pendientes.map(v => ({ id: v.id, nombre: asociadas.find(a => a.id === v.asociadaId)?.nombre || "—", subtext: v.fecha })) }); }} />
            <StatCard label="Total Visitas" value={visitas.length} icon={ClipboardList} onClick={() => { closeAllModals(); setListModal({ title: "Total Visitas", items: visitas.map(v => ({ id: v.id, nombre: asociadas.find(a => a.id === v.asociadaId)?.nombre || "—", subtext: v.fecha })) }); }} />
            <StatCard label="Sin Visitas" value={backendStats.inactivas || 0} icon={XCircle} onClick={() => { closeAllModals(); setListModal({ title: "Sin Visitas", items: asociadas.filter(a => !visitasPorAsociada[a.id]).map(a => ({ id: a.id, nombre: a.nombre, subtext: "Sin visitas" })) }); }} />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Sectores" value={sectorNamesList.length} icon={Layers} onClick={() => { closeAllModals(); setBreakdownModal({ title: "Total Sectores", items: sectorChartData, valueLabel: "asociadas" }); }} />
        <StatCard label="Con Ubicación" value={`${conUbicacion} / ${backendStats.total_asociadas || 0}`} icon={MapPin} onClick={() => { closeAllModals(); setListModal({ title: "Con Ubicación", items: asociadas.filter(a => a.lat != null && a.lng != null).map(a => ({ id: a.id, nombre: a.nombre, subtext: "Con ubicación" })) }); }} />
        <StatCard label="Extensión De Tierra" value={`${totalExtension.toFixed(1)} m²`} icon={MapPin} onClick={() => { closeAllModals(); setListModal({ title: "Extensión De Tierra", items: asociadas.filter(a => a.areaHuerta && a.areaHuerta.toString().trim() !== "").sort((a, b) => parseArea(b.areaHuerta) - parseArea(a.areaHuerta)).map(a => ({ id: a.id, nombre: a.nombre, subtext: a.areaHuerta.toString().toLowerCase().includes("m") ? a.areaHuerta : `${a.areaHuerta} m²` })) }); }} />
        <StatCard label="Productos" value={prodChartData.length} icon={Wheat} onClick={() => { closeAllModals(); setBreakdownModal({ title: "Productos", items: prodChartData, valueLabel: "asoc" }); }} />
      </div>

      {totalAlertas > 0 && (
        <Card id="alertas-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-600" />Alertas Inteligentes</CardTitle>
          </CardHeader>
          <div className="-mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sinVisita.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-semibold text-amber-800">Sin visita reciente</p>
                  <span className="ml-auto text-lg font-bold text-amber-700">{sinVisita.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {sinVisita.length > 3 && (
                    <button onClick={() => { closeAllModals(); setListModal({ title: "Asociadas Sin Visita", items: sinVisita.map(a => ({ id: a.id, nombre: a.nombre, subtext: `Última: ${a.fecha_ultima_visita || "Nunca"}` })) }); }}
                      className="cursor-pointer w-full text-center text-[10px] font-medium text-blue-600 hover:text-blue-700">
                      Ver {sinVisita.length} asociadas →
                    </button>
                  )}
                  {sinVisita.slice(0, 3).map((a) => (
                    <button key={a.id} onClick={() => { closeAllModals(); setSectorModal({ name: a.sector, list: asociadas.filter((x) => x.sector === a.sector) }); }}
                      className="cursor-pointer rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm border border-amber-100 hover:bg-white transition-colors">
                      {a.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {bajaFrec.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50/50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <p className="text-xs font-semibold text-orange-800">Baja frecuencia de visitas</p>
                  <span className="ml-auto text-lg font-bold text-orange-700">{bajaFrec.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {bajaFrec.length > 3 && (
                    <button onClick={() => { closeAllModals(); setListModal({ title: "Baja Frecuencia", items: bajaFrec.map(a => ({ id: a.id, nombre: a.nombre, subtext: `${a.num_visitas || 0} visitas` })) }); }}
                      className="cursor-pointer w-full text-center text-[10px] font-medium text-blue-600 hover:text-blue-700">
                      Ver {bajaFrec.length} asociadas →
                    </button>
                  )}
                  {bajaFrec.slice(0, 3).map((a) => (
                    <button key={a.id} onClick={() => { closeAllModals(); setSectorModal({ name: a.sector, list: asociadas.filter((x) => x.sector === a.sector) }); }}
                      className="cursor-pointer rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm border border-orange-100 hover:bg-white transition-colors">
                      {a.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sectoresPromVisitas.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <BarChart3 className="h-4 w-4 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-800">Sectores con menos visitas</p>
                </div>
                <div className="space-y-1">
                  {sectoresPromVisitas.map((s) => (
                    <button key={s.sector} onClick={() => { closeAllModals(); setDetailSector({ name: s.sector, list: asociadas.filter((x) => x.sector === s.sector) }); }}
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
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />Estado Civil</CardTitle>
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
                  closeAllModals();
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
                  closeAllModals();
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
                  const menoresSector = asociadas.filter((a) => a.sector === item.fullName).reduce((s, a) => s + (a.menoresHogar || 0), 0);
                  return (
                    <tr key={i} onClick={() => handleTableRowClick(item.fullName)} className="transition-colors duration-150 hover:bg-slate-50 cursor-pointer">
                      <td className="px-3 py-2 text-sm text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 text-sm font-medium text-slate-900 whitespace-nowrap">{item.name}</td>
                      <td className="px-3 py-2 text-sm text-slate-700 font-semibold">{item.value}</td>
                      <td className="px-3 py-2 text-sm text-slate-600">{item.beneficiarios}</td>
                      <td className="px-3 py-2 text-sm text-slate-600">{item.total_visitas || 0}</td>
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
        <ListModal title={`Estado Civil: ${tipoModal.name}`} items={tipoModal.list} onClose={() => setTipoModal(null)} />
      )}
      {detailSector && (
        <ListModal title={`Sector: ${detailSector.name.replace("Vereda ", "")}`} items={detailSector.list} onClose={() => setDetailSector(null)} />
      )}
      {listModal && (
        <ListModal title={listModal.title} items={listModal.items} onClose={() => setListModal(null)} />
      )}
      {breakdownModal && (
        <BreakdownModal title={breakdownModal.title} items={breakdownModal.items} valueLabel={breakdownModal.valueLabel} onClose={() => setBreakdownModal(null)} />
      )}
    </>
      )}
    </div>
  );
}

export default AdminDashboard;
