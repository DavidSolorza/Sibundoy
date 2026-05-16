import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BarChart3, ClipboardList, CheckCircle, MapPin, User, Navigation, AlertTriangle, Clock, Printer } from "lucide-react";
import useAsociadas from "../asociadas/useAsociadas";
import StatCard from "../../shared/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../../shared/ui/Card";
import Modal from "../../shared/ui/Modal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Legend, Cell } from "recharts";

const COLORS = ["#1e293b", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#06b6d4", "#d946ef", "#eab308", "#64748b"];
const EDAD_RANGES = ["18–25", "26–35", "36–45", "46–55", "56–65", "66+"];
const RANGE_MIN = [18, 26, 36, 46, 56, 66];
const RANGE_MAX = [25, 35, 45, 55, 65, 999];
const DIAS_ALERTA_VISITA = 30;

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
                <span className="font-medium text-slate-800 truncate">{a.nombre}</span>
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
                <span className="font-medium text-slate-800 truncate">{a.nombre}</span>
              </div>
              <span className="text-xs text-slate-400 shrink-0 ml-2">Edad: {a.edad}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function ReporteModal({ onClose }) {
  const { asociadas } = useAsociadas();
  const report = useMemo(() => {
    const total = asociadas.length;
    const totalBenef = asociadas.reduce((s, a) => s + a.numPersonas, 0);
    const promEdad = (asociadas.reduce((s, a) => s + a.edad, 0) / total).toFixed(1);
    const totalVis = asociadas.reduce((s, a) => s + a.numVisitas, 0);
    const activas = asociadas.filter((a) => a.numVisitas > 0).length;
    const sectores = [...new Set(asociadas.map((a) => a.sector))];
    const pendientes = asociadas.filter((a) => daysSince(a.fechaUltimaVisita) > DIAS_ALERTA_VISITA);
    const bajaFrec = asociadas.filter((a) => a.numVisitas < 2);
    const edadMin = Math.min(...asociadas.map((a) => a.edad));
    const edadMax = Math.max(...asociadas.map((a) => a.edad));
    const prodCount = {};
    asociadas.forEach((a) => {
      (a.productos || "").split(",").forEach((p) => {
        const name = p.trim().toLowerCase();
        if (name) prodCount[name] = (prodCount[name] || 0) + 1;
      });
    });
    const topProds = Object.entries(prodCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return { total, totalBenef, promEdad, totalVis, activas, sectores, pendientes, bajaFrec, topProds, edadMin, edadMax };
  }, [asociadas]);

  const handlePrint = () => window.print();

  return (
    <Modal open onClose={onClose} title="Informe Ejecutivo">
      <div className="reporte-content space-y-5 text-sm">
        <div className="text-center mb-4 print:mb-6">
          <p className="text-lg font-bold text-slate-900">AgroMap · Informe Ejecutivo</p>
          <p className="text-xs text-slate-500">Sibundoy, Putumayo · {new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 print:text-gray-600">Resumen General</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-400">Asociadas</p>
              <p className="text-lg font-bold text-slate-800">{report.total}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-400">Beneficiarios</p>
              <p className="text-lg font-bold text-slate-800">{report.totalBenef}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-400">Edad Prom.</p>
              <p className="text-lg font-bold text-slate-800">{report.promEdad}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-400">Visitas</p>
              <p className="text-lg font-bold text-slate-800">{report.totalVis}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Cobertura</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-400">Sectores</p>
              <p className="text-lg font-bold text-slate-800">{report.sectores.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-400">Activas</p>
              <p className="text-lg font-bold text-emerald-600">{report.activas}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-400">Inactivas</p>
              <p className="text-lg font-bold text-slate-500">{report.total - report.activas}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Rango de Edad</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-400">Edad Mínima</p>
              <p className="text-lg font-bold text-slate-800">{report.edadMin} años</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-400">Edad Máxima</p>
              <p className="text-lg font-bold text-slate-800">{report.edadMax} años</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sectores participantes</p>
          <div className="flex flex-wrap gap-1.5">
            {report.sectores.map((s) => (
              <span key={s} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">{s.replace("Vereda ", "")}</span>
            ))}
          </div>
        </div>

        {(report.pendientes.length > 0 || report.bajaFrec.length > 0) && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Puntos de Atención</p>
            <div className="space-y-2">
              {report.pendientes.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs font-medium text-amber-800">
                    {report.pendientes.length} asociada{report.pendientes.length !== 1 ? "s" : ""} sin visita en más de {DIAS_ALERTA_VISITA} días
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">{report.pendientes.map((a) => a.nombre).join(", ")}</p>
                </div>
              )}
              {report.bajaFrec.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs font-medium text-amber-800">
                    {report.bajaFrec.length} asociada{report.bajaFrec.length !== 1 ? "s" : ""} con menos de 2 visitas registradas
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">{report.bajaFrec.map((a) => a.nombre).join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {report.topProds.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Top Productos Cultivados</p>
            <div className="flex flex-wrap gap-1.5">
              {report.topProds.map(([prod, count]) => (
                <span key={prod} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {prod} <span className="text-emerald-500">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="print:hidden flex gap-2 pt-2 border-t border-slate-200">
          <button onClick={handlePrint} className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            <Printer className="h-4 w-4" /> Guardar PDF / Imprimir
          </button>
          <button onClick={onClose} className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AdminDashboard({ reporteOpen, onReporteClose }) {
  const { asociadas } = useAsociadas();
  const [sectorModal, setSectorModal] = useState(null);
  const [tipoModal, setTipoModal] = useState(null);
  const [detailSector, setDetailSector] = useState(null);

  const stats = useMemo(() => {
    const sectores = {};
    const sectoresEdad = {};
    const sectoresPersonas = {};
    const sectoresVisitas = {};
    const tipos = {};
    asociadas.forEach((a) => {
      sectores[a.sector] = (sectores[a.sector] || 0) + 1;
      if (!sectoresEdad[a.sector]) sectoresEdad[a.sector] = [];
      sectoresEdad[a.sector].push(a.edad);
      sectoresPersonas[a.sector] = (sectoresPersonas[a.sector] || 0) + (a.numPersonas || 1);
      sectoresVisitas[a.sector] = (sectoresVisitas[a.sector] || 0) + a.numVisitas;
      tipos[a.tipoPersona] = (tipos[a.tipoPersona] || 0) + 1;
    });
    return { sectores, sectoresEdad, sectoresPersonas, sectoresVisitas, tipos };
  }, [asociadas]);

  const totalVisitas = asociadas.reduce((sum, a) => sum + a.numVisitas, 0);
  const promedioEdad = (asociadas.reduce((sum, a) => sum + a.edad, 0) / asociadas.length).toFixed(1);
  const activas = asociadas.filter((a) => a.numVisitas > 0).length;
  const totalBeneficiarios = asociadas.reduce((sum, a) => sum + a.numPersonas, 0);
  const promPersonas = (totalBeneficiarios / asociadas.length).toFixed(1);
  const edadMin = Math.min(...asociadas.map((a) => a.edad));
  const edadMax = Math.max(...asociadas.map((a) => a.edad));
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

  const maxSectorVal = Math.max(...sectorChartData.map((d) => d.value));
  const totalAlertas = alertas.sinVisita.length + alertas.bajaFrec.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Asociadas" value={asociadas.length} icon={Users} />
        <StatCard label="Promedio Edad" value={`${promedioEdad} años`} icon={BarChart3} />
        <StatCard label="Total Visitas" value={totalVisitas} icon={ClipboardList} />
        <StatCard label="Asociadas Activas" value={activas} icon={CheckCircle} />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${totalAlertas > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Alertas</p>
              <p className={`text-2xl font-bold ${totalAlertas > 0 ? "text-amber-600" : "text-emerald-600"}`}>{totalAlertas}</p>
            </div>
          </div>
        </div>
      </div>

      {totalAlertas > 0 && (
        <Card>
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
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
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
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {prodChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Distribución Detallada por Sector</CardTitle>
        </CardHeader>
        <div className="overflow-auto rounded-lg border border-slate-200 max-h-72">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Sector</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Asociadas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Beneficiarios</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Edad Prom.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Visitas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Barra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sectorChartData.map((item, i) => {
                const edades = stats.sectoresEdad[sectorNamesList[i]] || [];
                const prom = (edades.reduce((s, e) => s + e, 0) / edades.length).toFixed(1);
                const pct = (item.value / maxSectorVal) * 100;
                const visitasSector = stats.sectoresVisitas[sectorNamesList[i]] || 0;
                return (
                  <tr key={i} onClick={() => handleTableRowClick(item.fullName)} className="transition-colors duration-150 hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-2.5 text-sm text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900 whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700 font-semibold">{item.value}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{item.beneficiarios}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{prom}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{visitasSector}</td>
                    <td className="px-4 py-2.5">
                      <div className="h-2.5 w-24 rounded-full bg-slate-100">
                        <div className="h-2.5 rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Sectores</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{sectorNamesList.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Beneficiarios</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalBeneficiarios}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Prom. Personas/Hogar</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{promPersonas}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Rango de Edad</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{edadMin} - {edadMax}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Productos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{prodChartData.length}</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          nav, header, aside, .fixed, .print\\:hidden { display: none !important; }
          .reporte-content { display: block !important; max-width: 100%; margin: 0; padding: 0; }
          .reporte-content .border, .reporte-content .rounded-lg { border-radius: 4px; border: 1px solid #e2e8f0; box-shadow: none; }
          .reporte-content .bg-slate-50 { background-color: #f8fafc !important; }
          .reporte-content .bg-amber-50 { background-color: #fffbeb !important; }
          .reporte-content .bg-emerald-100 { background-color: #d1fae5 !important; }
          .reporte-content .bg-blue-100 { background-color: #dbeafe !important; }
        }
      `}</style>

      {sectorModal && (
        <SectorDetailModal sectorName={sectorModal.name} asociadas={sectorModal.list} onClose={() => setSectorModal(null)} />
      )}
      {tipoModal && (
        <TipoDetailModal tipoName={tipoModal.name} asociadas={tipoModal.list} onClose={() => setTipoModal(null)} />
      )}
      {detailSector && (
        <SectorDetailModal sectorName={detailSector.name} asociadas={detailSector.list} onClose={() => setDetailSector(null)} />
      )}
      {reporteOpen && <ReporteModal onClose={() => onReporteClose?.()} />}
    </div>
  );
}

export default AdminDashboard;
