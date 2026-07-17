import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid, Legend, LineChart, Line } from "recharts";
import { TrendingUp, Layers, Wheat, BarChart3, CheckCircle, Globe, Users, ArrowUpRight } from "lucide-react";
import useVisitas from "../../visitas/useVisitas";

const COLORS = ["#1e293b", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function EstadisticasHuertas({ asociadas, temporalFilter }) {
  const { visitas } = useVisitas();

  // Helper: parse date to local date
  const parseDate = (dStr) => {
    if (!dStr) return null;
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // 1. Filter visits based on the selected temporal filter
  const filteredVisitas = useMemo(() => {
    const now = new Date();
    return visitas.filter((v) => {
      if (!v.fecha) return false;
      const vDate = parseDate(v.fecha);
      if (!vDate) return false;

      const diffTime = Math.abs(now - vDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (temporalFilter === "diario") return diffDays <= 1;
      if (temporalFilter === "semanal") return diffDays <= 7;
      if (temporalFilter === "mensual") return diffDays <= 30;
      if (temporalFilter === "anual") return diffDays <= 365;
      return true; // "todo"
    });
  }, [visitas, temporalFilter]);

  // 2. Visitas Chart Data (Trends over months)
  const visitsChartData = useMemo(() => {
    const counts = {};
    const now = new Date();
    // Fill the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      counts[key] = { name: `${MONTHS[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`, count: 0, sortKey: d.getTime() };
    }

    filteredVisitas.forEach((v) => {
      const d = parseDate(v.fecha);
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (counts[key]) {
        counts[key].count++;
      }
    });

    return Object.values(counts).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredVisitas]);

  // 3. Average Area (m2) of Huertas by Sector
  const sectorAreaData = useMemo(() => {
    const sectorStats = {};

    asociadas.forEach((a) => {
      if (!a.sector) return;
      
      // Parse area (e.g. "120 m²" or "80" or "1,200")
      let area = 0;
      if (a.areaHuerta) {
        const num = parseFloat(a.areaHuerta.toString().replace(/[^0-9.,]/g, "").replace(",", "."));
        if (!isNaN(num)) area = num;
      }

      if (!sectorStats[a.sector]) {
        sectorStats[a.sector] = { totalArea: 0, count: 0 };
      }
      if (area > 0) {
        sectorStats[a.sector].totalArea += area;
        sectorStats[a.sector].count++;
      }
    });

    return Object.entries(sectorStats)
      .map(([name, stats]) => ({
        name: name.replace("Vereda ", ""),
        areaPromedio: stats.count > 0 ? Math.round(stats.totalArea / stats.count) : 0,
      }))
      .filter((s) => s.areaPromedio > 0)
      .sort((a, b) => b.areaPromedio - a.areaPromedio)
      .slice(0, 8);
  }, [asociadas]);

  // 4. Most Cultivated Crops
  const cropData = useMemo(() => {
    const cropCount = {};
    asociadas.forEach((a) => {
      (a.productos || "").split(",").forEach((p) => {
        const name = p.trim().toLowerCase();
        if (name && name !== "ninguno" && name !== "—") {
          cropCount[name] = (cropCount[name] || 0) + 1;
        }
      });
    });

    return Object.entries(cropCount)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [asociadas]);

  // 5. Tasa de Cumplimiento de Visitas
  const metaCumplimiento = useMemo(() => {
    const total = filteredVisitas.length;
    const completadas = filteredVisitas.filter((v) => v.realizada).length;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
    return { total, completadas, porcentaje };
  }, [filteredVisitas]);

  // 6. Cobertura Territorial
  const coberturaTerritorial = useMemo(() => {
    const sectoresUnicos = new Set(asociadas.map((a) => a.sector).filter(Boolean));
    const totalSectores = sectoresUnicos.size;

    const sectoresVisitados = new Set(
      filteredVisitas
        .map((v) => {
          const asociada = asociadas.find((a) => a.id === v.asociadaId);
          return asociada?.sector;
        })
        .filter(Boolean)
    );
    const visitados = sectoresVisitados.size;
    const porcentaje = totalSectores > 0 ? Math.round((visitados / totalSectores) * 100) : 0;
    return { totalSectores, visitados, porcentaje };
  }, [asociadas, filteredVisitas]);

  // 7. Crecimiento Histórico Acumulado de Huertas
  const crecimientoHistorico = useMemo(() => {
    const acumuladoPorMes = {};
    const ordenado = [...asociadas]
      .map((a) => {
        return parseDate(a.fechaSiembra) || parseDate(a.fechaUltimaVisita) || parseDate("2026-01-01");
      })
      .filter(Boolean)
      .sort((a, b) => a - b);

    let sum = 0;
    ordenado.forEach((d) => {
      sum++;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      acumuladoPorMes[key] = { label, count: sum, sortKey: d.getTime() };
    });

    return Object.values(acumuladoPorMes)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-6);
  }, [asociadas]);

  // 8. Cobertura por Sector (Visitadas vs Totales)
  const coberturaSectorChart = useMemo(() => {
    const stats = {};
    asociadas.forEach((a) => {
      if (!a.sector) return;
      const sec = a.sector.replace("Vereda ", "");
      if (!stats[sec]) stats[sec] = { total: 0, visitadas: 0 };
      stats[sec].total++;
    });

    const visitadasIds = new Set(visitas.filter((v) => v.realizada).map((v) => v.asociadaId));
    asociadas.forEach((a) => {
      if (!a.sector) return;
      const sec = a.sector.replace("Vereda ", "");
      if (visitadasIds.has(a.id)) {
        stats[sec].visitadas++;
      }
    });

    return Object.entries(stats)
      .map(([name, val]) => ({
        name,
        Total: val.total,
        Visitadas: val.visitadas,
      }))
      .sort((a, b) => b.Total - a.Total)
      .slice(0, 7);
  }, [asociadas, visitas]);

  return (
    <div className="space-y-6">
      
      {/* 1. ROW OF PROGRESS KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* KPI 1: Cumplimiento */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm group hover:border-emerald-200 transition-colors">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cumplimiento de Visitas</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tight text-slate-800">{metaCumplimiento.porcentaje}%</span>
                <span className="text-xs text-slate-500 font-medium">de metas</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                {metaCumplimiento.completadas} completadas de {metaCumplimiento.total}
              </p>
            </div>
            <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${metaCumplimiento.porcentaje}%` }} />
          </div>
        </div>

        {/* KPI 2: Cobertura Territorial */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm group hover:border-blue-200 transition-colors">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cobertura Territorial</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tight text-slate-800">{coberturaTerritorial.porcentaje}%</span>
                <span className="text-xs text-slate-500 font-medium">veredas</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                {coberturaTerritorial.visitados} veredas de {coberturaTerritorial.totalSectores} totales
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Globe className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${coberturaTerritorial.porcentaje}%` }} />
          </div>
        </div>

        {/* KPI 3: Tasa de Crecimiento */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm group hover:border-amber-200 transition-colors">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Productores Totales</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tracking-tight text-slate-800">{asociadas.length}</span>
                <span className="text-xs text-slate-500 font-medium">registrados</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                Avance histórico del programa
              </p>
            </div>
            <div className="p-3 rounded-full bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `100%` }} />
          </div>
        </div>

      </div>

      {/* 2. MIDDLE ROW: Visitas Trend & Cobertura Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Visit Trend Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Tendencia de Actividades (6 Meses)</h3>
              <p className="text-xs text-slate-400">Total de visitas, seguimientos y capacitaciones registradas</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  labelStyle={{ fontWeight: "bold", fontSize: 12, color: "#1e293b" }}
                />
                <Area type="monotone" dataKey="count" name="Actividades" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Cobertura por Sector (Visitadas vs Totales) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Avance de Cobertura por Sector</h3>
              <p className="text-xs text-slate-400">Total de huertas vs huertas con seguimiento técnico</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coberturaSectorChart} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Total" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Visitadas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM ROW: Crop Distribution & Cumulative Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Top Crops */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Wheat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Top 10 Cultivos Frecuentes</h3>
              <p className="text-xs text-slate-400">Productos agrícolas más sembrados en las huertas</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {cropData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    formatter={(value) => [value, "Huertas Cultivando"]}
                  />
                  <Bar dataKey="value" name="Huertas" radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {cropData.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No hay datos de cultivos especificados para graficar.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Cumulative Program Growth */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Curva de Avance del Programa</h3>
              <p className="text-xs text-slate-400">Crecimiento acumulado en el registro de huertas familiares</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={crecimientoHistorico} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  formatter={(value) => [value, "Huertas Totales"]}
                />
                <Line type="monotone" dataKey="count" name="Huertas Registradas" stroke="#1e293b" strokeWidth={3} dot={{ r: 4, stroke: "#1e293b", strokeWidth: 2, fill: "#ffffff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
