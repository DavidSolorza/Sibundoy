import { memo } from "react";
import { Users, BarChart3, ClipboardList, CheckCircle, MapPin, User } from "lucide-react";
import useAsociadas from "../asociadas/useAsociadas";
import StatCard from "../../shared/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../../shared/ui/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#1e293b", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#06b6d4", "#d946ef", "#eab308", "#64748b"];

const AdminDashboard = memo(function AdminDashboard() {
  const { asociadas } = useAsociadas();

  const sectores = {};
  const sectoresEdad = {};
  const sectoresPersonas = {};
  asociadas.forEach((a) => {
    sectores[a.sector] = (sectores[a.sector] || 0) + 1;
    if (!sectoresEdad[a.sector]) sectoresEdad[a.sector] = [];
    sectoresEdad[a.sector].push(a.edad);
    sectoresPersonas[a.sector] = (sectoresPersonas[a.sector] || 0) + (a.numPersonas || 1);
  });

  const totalVisitas = asociadas.reduce((sum, a) => sum + a.numVisitas, 0);
  const promedioEdad = (asociadas.reduce((sum, a) => sum + a.edad, 0) / asociadas.length).toFixed(1);
  const activas = asociadas.filter((a) => a.numVisitas > 0).length;
  const totalBeneficiarios = asociadas.reduce((sum, a) => sum + a.numPersonas, 0);
  const promPersonas = (totalBeneficiarios / asociadas.length).toFixed(1);
  const edadMin = Math.min(...asociadas.map((a) => a.edad));
  const edadMax = Math.max(...asociadas.map((a) => a.edad));
  const tipos = {};
  asociadas.forEach((a) => { tipos[a.tipoPersona] = (tipos[a.tipoPersona] || 0) + 1; });

  const sectorChartData = Object.entries(sectores)
    .map(([name, value]) => ({ name: name.replace("Vereda ", ""), value, beneficiarios: sectoresPersonas[name] || value }))
    .sort((a, b) => b.value - a.value);

  const tipoChartData = Object.entries(tipos).map(([name, value]) => ({ name, value }));

  const CustomTooltip = ({ active, payload }) => {
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
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Asociadas" value={asociadas.length} icon={Users} />
        <StatCard label="Promedio Edad" value={`${promedioEdad} años`} icon={BarChart3} />
        <StatCard label="Total Visitas" value={totalVisitas} icon={ClipboardList} />
        <StatCard label="Asociadas Activas" value={activas} icon={CheckCircle} />
      </div>

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
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
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
                <Pie data={tipoChartData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}>
                  {tipoChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={40} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
              </PieChart>
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">Barra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sectorChartData.map((item, i) => {
                const edades = sectoresEdad[Object.keys(sectores)[i]] || [];
                const prom = (edades.reduce((s, e) => s + e, 0) / edades.length).toFixed(1);
                const pct = (item.value / Math.max(...sectorChartData.map((d) => d.value))) * 100;
                return (
                  <tr key={i} className="transition-colors duration-150 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900 whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700 font-semibold">{item.value}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{item.beneficiarios}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{prom}</td>
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Sectores</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{Object.keys(sectores).length}</p>
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
      </div>
    </div>
  );
});

export default AdminDashboard;
