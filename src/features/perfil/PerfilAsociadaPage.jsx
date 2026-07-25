import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, User, Phone, Sprout, Wheat, Calendar, ClipboardList, 
  Heart, Clock, Users, FileText, Tag, CalendarClock, TrendingUp, PieChart as PieChartIcon, 
  Pencil, Camera, AlertTriangle, CheckCircle 
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import useAsociadas from "../asociadas/useAsociadas";
import useVisitas from "../visitas/useVisitas";
import { markerIcon } from "../asociadas/components/markerIcons";
import { Card, CardHeader, CardTitle } from "../../shared/ui/Card";
import Badge from "../../shared/ui/Badge";
import { parseLocalDate } from "../../shared/lib/dates";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import FormularioAsociada from "../asociadas/components/FormularioAsociada";
import GaleriaFotosModal from "../huertas/components/GaleriaFotosModal";

function PerfilAsociadaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { asociadas, updateAsociada, loading } = useAsociadas();
  const { getVisitasByAsociada } = useVisitas();

  const [isEditing, setIsEditing] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const asociada = useMemo(() => asociadas.find((a) => a.id === Number(id)), [asociadas, id]);
  const visitas = useMemo(() => asociada ? getVisitasByAsociada(asociada.id) : [], [asociada, getVisitasByAsociada]);
  const totalBeneficiarios = useMemo(() => asociada ? (asociada.numPersonas ?? 0) : 0, [asociada]);

  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const handleSaveEdit = async (data) => {
    try {
      await updateAsociada(asociada.id, data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating asociada", error);
      alert("Error al actualizar la asociada: " + error.message);
    }
  };

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

  const diasSinVisita = useMemo(() => {
    if (!asociada?.fechaUltimaVisita) return null;
    const diff = Date.now() - new Date(asociada.fechaUltimaVisita).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [asociada]);

  const proximaVisitaProgramada = useMemo(() => {
    if (!visitas.length) return null;
    const futuras = visitas
      .filter((v) => !v.realizada && new Date(v.fecha).getTime() >= new Date().setHours(0,0,0,0))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    return futuras.length > 0 ? futuras[0] : null;
  }, [visitas]);

  const necesitaAtencion = diasSinVisita === null || diasSinVisita > 30;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-4" />
        <p className="text-sm font-semibold text-slate-500">Cargando perfil...</p>
      </div>
    );
  }

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
    <section className="pb-10 max-w-7xl mx-auto">
      <button onClick={() => navigate(-1)} className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Volver a la lista
      </button>

      {/* Alertas */}
      {necesitaAtencion && (
        <div className="mb-6 rounded-xl bg-orange-50 p-4 border border-orange-200 flex items-center gap-4 shadow-sm">
          <div className="bg-orange-100 p-2 rounded-full shrink-0">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-orange-800">Atención Requerida</h3>
            <p className="text-sm text-orange-700 mt-0.5">
              {diasSinVisita === null 
                ? "Esta huerta no registra visitas previas." 
                : `Han pasado ${diasSinVisita} días desde la última visita. Se recomienda programar una nueva visita pronto.`}
            </p>
          </div>
          <button onClick={() => navigate("/visitas", { state: { preselectAsociadaId: asociada.id } })} className="ml-auto bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm cursor-pointer hidden sm:block">
            Registrar Visita
          </button>
        </div>
      )}

      {proximaVisitaProgramada && (
        <div className="mb-6 rounded-xl bg-emerald-50 p-4 border border-emerald-200 flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-100 p-2 rounded-full shrink-0">
            <CalendarClock className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-800">Próxima Visita Programada</h3>
            <p className="text-sm text-emerald-700 mt-0.5">
              Hay una labor de <span className="font-semibold">{TIPO_LABELS[proximaVisitaProgramada.tipo]}</span> agendada para el <span className="font-semibold">{parseLocalDate(proximaVisitaProgramada.fecha).toLocaleDateString("es-CO", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Grid Asimétrico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda (Principal) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="shrink-0 relative">
              {asociada.urlFoto ? (
                <img src={asociada.urlFoto} alt={asociada.nombre} className="h-28 w-28 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100" />
              ) : (
                <div className="h-28 w-28 rounded-2xl bg-slate-800 text-white flex items-center justify-center text-4xl font-bold shadow-md border-4 border-white">
                  {asociada.nombre.charAt(0)}
                </div>
              )}
              {asociada.tipoPersona === "Madre Cabeza De Hogar" && (
                <div className="absolute -bottom-3 -right-3 bg-amber-100 text-amber-700 p-2 rounded-full border-2 border-white shadow-sm" title="Madre Cabeza de Hogar">
                  <Heart className="h-5 w-5 fill-amber-500 text-amber-500" />
                </div>
              )}
            </div>
            
            {/* Detalles Header */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{asociada.nombre}</h1>
              <p className="text-slate-500 flex items-center gap-1.5 mt-1.5 font-medium text-sm">
                <MapPin className="h-4 w-4 text-emerald-500" /> {asociada.sector}
              </p>
              
              <div className="flex flex-wrap gap-2.5 mt-5">
                <button onClick={() => setIsEditing(true)} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 shadow-sm hover:border-blue-200 hover:text-blue-600">
                  <Pencil className="h-4 w-4 text-blue-500" /> Editar
                </button>
                <button onClick={() => setIsGalleryOpen(true)} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 shadow-sm relative hover:border-amber-200 hover:text-amber-600">
                  <Camera className="h-4 w-4 text-amber-500" /> Fotos
                  {asociada.fotos?.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm border border-white">
                      {asociada.fotos.length}
                    </span>
                  )}
                </button>
                <button onClick={() => navigate("/visitas", { state: { preselectAsociadaId: asociada.id } })} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 shadow-sm ml-auto">
                  <Calendar className="h-4 w-4 text-emerald-400" /> Registrar Visita
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center group hover:border-blue-200 transition-colors">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><ClipboardList className="h-6 w-6" /></div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{visitas.length}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Total Visitas</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center group hover:border-emerald-200 transition-colors">
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Sprout className="h-6 w-6" /></div>
              <p className="text-2xl font-black text-slate-800 tracking-tight flex items-baseline gap-1">
                {asociada.areaHuerta ? parseFloat(asociada.areaHuerta) || asociada.areaHuerta : "—"}
                {asociada.areaHuerta && <span className="text-sm font-medium text-slate-400">m²</span>}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Área Huerta</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center group hover:border-indigo-200 transition-colors">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Users className="h-6 w-6" /></div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{totalBeneficiarios}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Beneficiarios</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center group hover:border-purple-200 transition-colors">
              <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><User className="h-6 w-6" /></div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{asociada.edad || "—"}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Edad</p>
            </div>
          </div>

          {/* Map */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-5 w-5 text-emerald-600" />Ubicación Geográfica</CardTitle>
            </CardHeader>
            <div className="p-0">
              {asociada.lat != null && asociada.lng != null ? (
                <div className="h-[350px] w-full z-0">
                  <MapContainer center={useMemo(() => [asociada.lat, asociada.lng], [asociada.lat, asociada.lng])} zoom={16} className="h-full w-full" zoomControl={false} scrollWheelZoom={false}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[asociada.lat, asociada.lng]} icon={markerIcon}>
                      <Popup><p className="text-sm font-semibold">{asociada.nombre}</p><p className="text-xs text-slate-500">{asociada.sector}</p></Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] w-full bg-slate-50 m-4 rounded-xl border-2 border-dashed border-slate-200" style={{ width: 'calc(100% - 2rem)' }}>
                  <MapPin className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-500">Sin ubicación registrada</p>
                  <button onClick={() => setIsEditing(true)} className="mt-2 text-sm text-blue-600 font-semibold hover:underline">Añadir desde Editar Perfil</button>
                </div>
              )}
            </div>
          </Card>

          {/* Charts */}
          {visitas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-blue-600" />Visitas (Último Año)</CardTitle>
                </CardHeader>
                <div className="h-56 px-2 pb-4 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visitasPorMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-base"><PieChartIcon className="h-4 w-4 text-emerald-600" />Distribución por Tipo</CardTitle>
                </CardHeader>
                <div className="flex h-60 items-center justify-center gap-6 px-4 pb-4">
                  <div className="h-full w-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={tipoChartData} cx="50%" cy="50%" outerRadius={70} innerRadius={45} dataKey="value" paddingAngle={5}>
                          {tipoChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    {tipoChartData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2.5 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-600 font-medium">{item.name}</span>
                        <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Columna Derecha (Lateral) */}
        <div className="lg:col-span-4 space-y-6">
          
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-blue-500" />Datos Personales</CardTitle>
            </CardHeader>
            <div className="p-5 space-y-5">
              <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Estado Civil</p><p className="text-sm font-semibold text-slate-800">{asociada.tipoPersona || "—"}</p></div>
              <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Teléfono</p><p className="text-sm font-semibold text-slate-800 flex items-center gap-2">{asociada.telefono || "—"}</p></div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Menores</p><p className="text-xl font-bold text-slate-800">{asociada.menoresHogar ?? 0}</p></div>
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Hogar</p><p className="text-xl font-bold text-slate-800">{asociada.numPersonas ?? "—"}</p></div>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base"><Sprout className="h-4 w-4 text-emerald-500" />Detalles de Huerta</CardTitle>
            </CardHeader>
            <div className="p-5 space-y-5">
              <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Fecha de Siembra</p><p className="text-sm font-semibold text-slate-800">{asociada.fechaSiembra ? parseLocalDate(asociada.fechaSiembra).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}</p></div>
              <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Última Visita Registrada</p><p className="text-sm font-semibold text-slate-800">{asociada.fechaUltimaVisita ? parseLocalDate(asociada.fechaUltimaVisita).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}</p></div>
              
              {productos.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Productos Cultivados</p>
                  <div className="flex flex-wrap gap-2">
                    {productos.map((p) => (
                      <span key={p} className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {asociada.observaciones && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Observaciones Generales</p>
                  <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 text-sm text-slate-700 leading-relaxed italic">
                    "{asociada.observaciones}"
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-slate-200 shadow-sm flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-blue-500" />Historial ({visitas.length})</CardTitle>
            </CardHeader>
            {visitas.length === 0 ? (
              <div className="p-8 text-center flex-1">
                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"><Clock className="h-6 w-6 text-slate-300" /></div>
                <p className="text-sm font-medium text-slate-500">No hay visitas registradas</p>
              </div>
            ) : (
              <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {visitas.map((v) => (
                  <div key={v.id} className="relative pl-5 border-l-2 border-slate-100 pb-2 last:pb-0 group">
                    <div className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white ${v.tipo === "visita" ? "bg-blue-400" : v.tipo === "seguimiento" ? "bg-amber-400" : "bg-emerald-400"} group-hover:scale-125 transition-transform`} />
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${typeColors[v.tipo]}`}>{TIPO_LABELS[v.tipo] || v.tipo}</span>
                      <span className="text-[11px] font-bold text-slate-400">{parseLocalDate(v.fecha).toLocaleDateString("es-CO", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {v.observaciones && <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">{v.observaciones}</p>}
                    {v.proximaVisita && (
                      <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md mt-2 border border-blue-100">
                        <CalendarClock className="h-3 w-3" /> Próxima: {parseLocalDate(v.proximaVisita).toLocaleDateString("es-CO")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>

      <FormularioAsociada 
        open={isEditing} 
        onClose={() => setIsEditing(false)} 
        onSave={handleSaveEdit} 
        initialData={asociada} 
      />

      <GaleriaFotosModal 
        open={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)} 
        asociada={asociada} 
      />
    </section>
  );
}

export default PerfilAsociadaPage;
