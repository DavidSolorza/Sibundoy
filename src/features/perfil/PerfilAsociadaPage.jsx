import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, User, Phone, Sprout, Wheat, Calendar, ClipboardList, Heart, Navigation, Clock, Users, FileText, Tag, CalendarClock, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import useAsociadas from "../asociadas/useAsociadas";
import useVisitas from "../visitas/useVisitas";
import { markerIcon } from "../asociadas/components/markerIcons";
import { Card, CardHeader, CardTitle } from "../../shared/ui/Card";
import Badge from "../../shared/ui/Badge";
import { parseLocalDate } from "../../shared/lib/dates";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

function PerfilAsociadaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { asociadas } = useAsociadas();
  const { getVisitasByAsociada } = useVisitas();

  const asociada = useMemo(() => asociadas.find((a) => a.id === Number(id)), [asociadas, id]);
  const visitas = useMemo(() => asociada ? getVisitasByAsociada(asociada.id) : [], [asociada, getVisitasByAsociada]);
  const totalBeneficiarios = useMemo(() => asociada ? (asociada.numPersonas ?? 0) : 0, [asociada]);

  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const visitasPorMes = useMemo(() => {
    const counts = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      counts[key] = { label: MESES[d.getMonth()], count: 0 };
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

  const TIPO_LABELS = { visita: "Visita", seguimiento: "Seguimiento", capacitacion: "Capacitación" };
  const COLORS = ["#3b82f6", "#f59e0b", "#10b981"];

  const tipoChartData = useMemo(() => {
    const tipos = {};
    visitas.forEach((v) => {
      tipos[v.tipo] = (tipos[v.tipo] || 0) + 1;
    });
    return Object.entries(tipos).map(([name, value]) => ({ name: TIPO_LABELS[name] || name, value }));
  }, [visitas]);

  if (!asociada) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold text-slate-600">Asociada No Encontrada</p>
        <button onClick={() => navigate("/huertas")} className="mt-3 cursor-pointer text-sm text-blue-600 hover:underline">Volver A Huertas</button>
      </div>
    );
  }

  const productos = (asociada.productos || "").split(",").map((p) => p.trim()).filter(Boolean);

  const typeColors = { visita: "bg-blue-100 text-blue-700", seguimiento: "bg-amber-100 text-amber-700", capacitacion: "bg-emerald-100 text-emerald-700" };

  return (
    <section>
      <button onClick={() => navigate(-1)} className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-white text-xl font-bold">
            {asociada.nombre.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              {asociada.nombre}
              <Badge variant={asociada.tipoPersona === "Madre Cabeza De Hogar" ? "warning" : asociada.tipoPersona === "Viuda" ? "danger" : "primary"}>{asociada.tipoPersona}</Badge>
            </h2>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />{asociada.sector}
            </p>
          </div>
          {asociada.lat != null && asociada.lng != null ? (
            <button onClick={() => navigate("/", { state: { routeTo: [asociada.lat, asociada.lng] } })}
              className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800">
              <Navigation className="h-4 w-4" /> Cómo llegar
            </button>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400">
              <MapPin className="h-4 w-4" /> Sin ubicación
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Edad</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{asociada.edad}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Visitas</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{visitas.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Beneficiarios</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{totalBeneficiarios}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Área Huerta</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{asociada.areaHuerta}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Menores Hogar</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{asociada.menoresHogar ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-blue-600" />Información Personal</CardTitle>
            </CardHeader>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-20 shrink-0">Teléfono</span><span className="text-slate-800">{asociada.telefono}</span></div>
              <div className="flex items-center gap-3 text-sm"><Users className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-20 shrink-0">Núm. Personas</span><span className="text-slate-800">{asociada.numPersonas ?? "—"}</span></div>
              <div className="flex items-center gap-3 text-sm"><Users className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-20 shrink-0">Menores Hogar</span><span className="text-slate-800">{asociada.menoresHogar ?? 0}</span></div>
              <div className="flex items-center gap-3 text-sm"><Heart className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-20 shrink-0">Estado Civil</span><span className="text-slate-800">{asociada.tipoPersona}</span></div>
              <div className="flex items-center gap-3 text-sm"><Tag className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-20 shrink-0">Edad</span><span className="text-slate-800">{asociada.edad} años</span></div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Sprout className="h-4 w-4 text-emerald-600" />Información De La Huerta</CardTitle>
            </CardHeader>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-24 shrink-0">Sector</span><span className="text-slate-800">{asociada.sector}</span></div>
              <div className="flex items-center gap-3 text-sm"><Sprout className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-24 shrink-0">Área</span><span className="text-slate-800">{asociada.areaHuerta}</span></div>
              <div className="flex items-center gap-3 text-sm"><Calendar className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-24 shrink-0">Siembra</span><span className="text-slate-800">{asociada.fechaSiembra}</span></div>
              <div className="flex items-center gap-3 text-sm"><Calendar className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-24 shrink-0">Últ. Visita</span><span className="text-slate-800">{asociada.fechaUltimaVisita}</span></div>
              <div className="flex items-center gap-3 text-sm"><ClipboardList className="h-4 w-4 text-slate-400 shrink-0" /><span className="text-slate-500 w-24 shrink-0">Visitas</span><span className="text-slate-800">{asociada.numVisitas}</span></div>
              {asociada.observaciones && (
                <div className="flex items-start gap-3 text-sm pt-2 border-t border-slate-100">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div><span className="text-slate-500 text-xs">Observaciones</span><p className="text-slate-700 mt-0.5">{asociada.observaciones}</p></div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {visitas.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-blue-600" />Visitas por Mes</CardTitle>
              </CardHeader>
              <div className="h-48 px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visitasPorMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><PieChartIcon className="h-4 w-4 text-emerald-600" />Tipo de Visitas</CardTitle>
              </CardHeader>
              <div className="flex h-48 items-center justify-center gap-4 px-2 pb-2">
                {tipoChartData.length > 0 && (
                  <div className="h-full w-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={tipoChartData} cx="50%" cy="50%" outerRadius={55} innerRadius={30} dataKey="value" paddingAngle={3}>
                          {tipoChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {tipoChartData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-semibold text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {productos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Wheat className="h-4 w-4 text-emerald-600" />Productos Cultivados</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-1.5">
              {productos.map((p) => (
                <span key={p} className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">{p}</span>
              ))}
            </div>
          </Card>
        )}

        {asociada.lat != null && asociada.lng != null ? (
          <div className="h-[250px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <MapContainer center={[asociada.lat, asociada.lng]} zoom={16} className="h-full w-full" zoomControl={false} scrollWheelZoom={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[asociada.lat, asociada.lng]} icon={markerIcon}>
                <Popup><p className="text-sm font-semibold">{asociada.nombre}</p><p className="text-xs text-slate-500">{asociada.sector}</p></Popup>
              </Marker>
            </MapContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[250px] w-full rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Esta asociada no tiene ubicación registrada</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-blue-600" />Historial De Visitas ({visitas.length})</CardTitle>
          </CardHeader>
          {visitas.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No hay visitas registradas para esta asociada.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {visitas.map((v) => (
                <div key={v.id} className="flex items-start gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                  <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${v.tipo === "visita" ? "bg-blue-50" : v.tipo === "seguimiento" ? "bg-amber-50" : "bg-emerald-50"}`}>
                    <Clock className={`h-3 w-3 ${v.tipo === "visita" ? "text-blue-500" : v.tipo === "seguimiento" ? "text-amber-500" : "text-emerald-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors[v.tipo]}`}>{v.tipo}</span>
                      <span className="text-xs text-slate-400">{parseLocalDate(v.fecha).toLocaleDateString("es-CO")}</span>
                    </div>
                    {v.observaciones && <p className="text-xs text-slate-600 mt-1">{v.observaciones}</p>}
                    {v.proximaVisita && (
                      <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />Próxima: {parseLocalDate(v.proximaVisita).toLocaleDateString("es-CO")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

export default PerfilAsociadaPage;
