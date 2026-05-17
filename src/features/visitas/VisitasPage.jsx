import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Calendar, ClipboardList, Plus, X, Search, Clock, Trash2, Filter, LayoutList, Edit3, CalendarClock, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import useDebounce from "../../shared/lib/useDebounce";
import { formatTimeAgo } from "../../shared/lib/dates";
import useAsociadas from "../asociadas/useAsociadas";
import useVisitas from "./useVisitas";
import { Card } from "../../shared/ui/Card";
import Modal from "../../shared/ui/Modal";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { Input, Select } from "../../shared/ui/Input";
import { useToast } from "../../shared/ui/Toast";
import { CalendarView, DayDetailModal } from "./CalendarView";
import { parseLocalDate, getLocalDateString } from "../../shared/lib/dates";

const TIPOS_VISITA = ["visita", "seguimiento", "capacitacion"];
const typeColors = { visita: "bg-blue-100 text-blue-700", seguimiento: "bg-amber-100 text-amber-700", capacitacion: "bg-emerald-100 text-emerald-700" };
const typeDots = { visita: "bg-blue-500", seguimiento: "bg-amber-500", capacitacion: "bg-emerald-500" };

function getEmptyForm() {
  return { asociadaId: "", fecha: getLocalDateString(), tipo: "visita", observaciones: "", proximaVisita: "" };
}

function VisitasPage() {
  const { asociadas } = useAsociadas();
  const { visitas, loading, addVisita, editVisita, deleteVisita, getProximasVisitas, refresh, lastUpdated } = useVisitas();
  const { showToast, ToastDisplay } = useToast();

  const searchRef = useRef(null);
  const PER_PAGE = 10;
  const [view, setView] = useState("list");
  const [page, setPage] = useState(0);
  const [deletingVisita, setDeletingVisita] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getEmptyForm());
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [filterTipo, setFilterTipo] = useState(null);
  const [filterAsociada, setFilterAsociada] = useState(null);
  const [quickFilter, setQuickFilter] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const asociadaMap = useMemo(() => {
    const m = {};
    asociadas.forEach((a) => { m[a.id] = a; });
    return m;
  }, [asociadas]);

  const proximas = useMemo(() => getProximasVisitas(), [getProximasVisitas]);

  const stats = useMemo(() => {
    const now = getLocalDateString().slice(0, 7);
    const thisMonth = visitas.filter((v) => v.fecha.startsWith(now));
    const uniqueAsociadas = new Set(visitas.map((v) => v.asociadaId)).size;
    const byType = {};
    visitas.forEach((v) => { byType[v.tipo] = (byType[v.tipo] || 0) + 1; });
    const mostType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return { total: visitas.length, thisMonth: thisMonth.length, uniqueAsociadas, byType, mostType };
  }, [visitas]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const today = new Date().toISOString().split("T")[0];
    return visitas.filter((v) => {
      const a = asociadaMap[v.asociadaId];
      const matchesSearch = !q || a?.nombre?.toLowerCase().includes(q) || a?.sector?.toLowerCase().includes(q);
      const matchesTipo = !filterTipo || v.tipo === filterTipo;
      const matchesAsociada = !filterAsociada || v.asociadaId === filterAsociada;
      let matchesQuick = true;
      if (quickFilter === "today") matchesQuick = v.fecha === today;
      else if (quickFilter === "week") {
        const d = new Date(v.fecha);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesQuick = d >= weekAgo;
      }       else if (quickFilter === "month") {
        matchesQuick = v.fecha.startsWith(getLocalDateString().slice(0, 7));
      }
      return matchesSearch && matchesTipo && matchesAsociada && matchesQuick;
    });
  }, [visitas, debouncedSearch, filterTipo, filterAsociada, quickFilter, asociadaMap]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((v) => {
      if (!groups[v.fecha]) groups[v.fecha] = [];
      groups[v.fecha].push(v);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [filtered]);

  const totalPages = Math.ceil(grouped.length / PER_PAGE);
  const paginatedGroups = grouped.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const hasFilters = searchQuery || filterTipo || filterAsociada || quickFilter;

  const openAddForm = useCallback(() => {
    setEditingId(null);
    setFormData(getEmptyForm());
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((v) => {
    setEditingId(v.id);
    setFormData({
      asociadaId: v.asociadaId,
      fecha: v.fecha,
      tipo: v.tipo,
      observaciones: v.observaciones || "",
      proximaVisita: v.proximaVisita || "",
    });
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.asociadaId) return;
    const payload = { ...formData, proximaVisita: formData.proximaVisita || null };
    try {
      if (editingId) {
        await editVisita(editingId, payload);
        showToast("Visita actualizada correctamente");
      } else {
        await addVisita(payload);
        showToast("Visita registrada correctamente");
      }
      setFormData(getEmptyForm());
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error("Error guardando visita:", err);
      showToast(err?.message || "Error al guardar la visita");
    }
  }, [formData, editingId, addVisita, editVisita, showToast]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingVisita) return;
    try {
      await deleteVisita(deletingVisita.id);
      setDeletingVisita(null);
      showToast("Visita eliminada");
    } catch (err) {
      console.error("Error eliminando visita:", err);
      showToast(err?.message || "Error al eliminar la visita");
    }
  }, [deletingVisita, deleteVisita, showToast]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, filterTipo, filterAsociada, quickFilter]);

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterTipo(null);
    setFilterAsociada(null);
    setQuickFilter(null);
  }, []);

  const quickFilters = [
    { key: "today", label: "Hoy" },
    { key: "week", label: "7 días" },
    { key: "month", label: "Este mes" },
  ];

  return (
    <section>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Visitas
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Registro y seguimiento de visitas a asociadas.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setView("list")} className={`cursor-pointer px-3 py-2 text-xs font-medium transition-colors ${view === "list" ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
              <LayoutList className="h-4 w-4 inline-block mr-1" /> Lista
            </button>
            <button onClick={() => setView("calendar")} className={`cursor-pointer px-3 py-2 text-xs font-medium transition-colors ${view === "calendar" ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
              <Calendar className="h-4 w-4 inline-block mr-1" /> Calendario
            </button>
          </div>
          <button onClick={openAddForm} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 active:bg-slate-900">
            <Plus className="h-4 w-4" /> Nueva Visita
          </button>
        </div>
      </div>

      {proximas.length > 0 && (
        <Card className="mb-4 !border-blue-200 !bg-blue-50/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
            <CalendarClock className="h-4 w-4" /> Próximas Visitas Programadas ({proximas.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {proximas.slice(0, 5).map((v) => {
              const a = asociadaMap[v.asociadaId];
              return (
                <div key={v.id} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-blue-200 px-2.5 py-1.5 text-xs text-slate-700 shadow-sm">
                  <span className={`inline-block h-2 w-2 rounded-full ${typeDots[v.tipo]}`} />
                  <span className="font-medium">{a?.nombre || "—"}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-blue-600 font-medium">{parseLocalDate(v.proximaVisita).toLocaleDateString("es-CO")}</span>
                </div>
              );
            })}
            {proximas.length > 5 && (
              <span className="inline-flex items-center text-xs text-slate-400">+{proximas.length - 5} más</span>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Totales</p>
          <p className="mt-0.5 text-xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Este Mes</p>
          <p className="mt-0.5 text-xl font-bold text-slate-800">{stats.thisMonth}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Asociadas Visitadas</p>
          <p className="mt-0.5 text-xl font-bold text-slate-800">{stats.uniqueAsociadas}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Más Frecuente</p>
          <p className="mt-0.5 text-xl font-bold text-slate-800 flex items-center gap-1.5">
            {stats.mostType ? (
              <>
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${typeDots[stats.mostType]}`} />
                {stats.mostType.charAt(0).toUpperCase() + stats.mostType.slice(1)}
                <span className="text-sm font-normal text-slate-400">({stats.byType[stats.mostType]})</span>
              </>
            ) : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Actualizado</p>
            <p className="mt-0.5 text-xs text-slate-500">{lastUpdated ? formatTimeAgo(lastUpdated) : "—"}</p>
          </div>
          <button onClick={refresh} disabled={loading} className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-default" title="Actualizar datos">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
            </div>
          ) : (
            <CalendarView visitas={visitas} onDayClick={setSelectedDay} />
          )}
        </Card>
      ) : (
        <Card>
          <div className="space-y-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input ref={searchRef} type="text" placeholder="Buscar por asociada o sector... (presiona /)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {quickFilters.map(({ key, label }) => (
                <button key={key} onClick={() => setQuickFilter(quickFilter === key ? null : key)}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    quickFilter === key ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Filter className="h-3 w-3" />
                {quickFilter && <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">{quickFilters.find(f => f.key === quickFilter)?.label} <button onClick={() => setQuickFilter(null)} className="cursor-pointer hover:text-slate-900"><X className="h-3 w-3" /></button></span>}
                {filterTipo && <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">{filterTipo} <button onClick={() => setFilterTipo(null)} className="cursor-pointer hover:text-slate-900"><X className="h-3 w-3" /></button></span>}
                {filterAsociada && <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">{asociadaMap[filterAsociada]?.nombre} <button onClick={() => setFilterAsociada(null)} className="cursor-pointer hover:text-slate-900"><X className="h-3 w-3" /></button></span>}
                <button onClick={clearFilters} className="cursor-pointer ml-auto text-slate-400 hover:text-slate-600">Limpiar</button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No hay visitas registradas</p>
              <p className="text-xs text-slate-400 mt-1">Programa la primera visita para empezar el seguimiento.</p>
            </div>
          ) : (
            <div className="space-y-4 pr-1">
              {paginatedGroups.map(([fecha, items]) => (
                <div key={fecha}>
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {parseLocalDate(fecha).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    <span className="text-slate-300 font-normal">({items.length})</span>
                  </p>
                  <div className="space-y-2">
                    {items.map((v) => {
                      const a = asociadaMap[v.asociadaId];
                      return (
                        <div key={v.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5 hover:border-slate-200 transition-colors">
                          <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${v.tipo === "visita" ? "bg-blue-50" : v.tipo === "seguimiento" ? "bg-amber-50" : "bg-emerald-50"}`}>
                            <Clock className={`h-3 w-3 ${v.tipo === "visita" ? "text-blue-500" : v.tipo === "seguimiento" ? "text-amber-500" : "text-emerald-500"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`cursor-pointer inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors[v.tipo]}`}
                                onClick={() => setFilterTipo(filterTipo === v.tipo ? null : v.tipo)}>
                                {v.tipo}
                              </span>
                              <span className="text-xs font-medium text-slate-800 truncate">{a?.nombre || "—"}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">{a?.sector?.replace("Vereda ", "")}</span>
                              {v.proximaVisita && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 font-medium ml-auto">
                                  <CalendarClock className="h-3 w-3" />
                                  {new Date(v.proximaVisita + "T00:00:00").toLocaleDateString("es-CO")}
                                </span>
                              )}
                            </div>
                            {v.observaciones && <p className="text-xs text-slate-500 mt-1">{v.observaciones}</p>}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button onClick={() => openEditForm(v)} className="cursor-pointer rounded-md p-1 text-slate-300 transition-colors hover:bg-blue-50 hover:text-blue-500" title="Editar Visita">
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeletingVisita(v)} className="cursor-pointer rounded-md p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500" title="Eliminar Visita">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filtered.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, grouped.length)} de {grouped.length} fechas
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="cursor-pointer disabled:opacity-30 disabled:cursor-default text-slate-500 hover:text-slate-800 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)}
                      className={`cursor-pointer h-2 rounded-full transition-all duration-200 ${i === page ? "w-6 bg-slate-800" : "w-2 bg-slate-300 hover:bg-slate-400"}`} />
                  ))}
                </div>
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1}
                  className="cursor-pointer disabled:opacity-30 disabled:cursor-default text-slate-500 hover:text-slate-800 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {view === "calendar" && (
        <DayDetailModal dateStr={selectedDay} visits={selectedDay ? (visitas.filter((v) => v.fecha === selectedDay)) : []} asociadaMap={asociadaMap} onClose={() => setSelectedDay(null)} />
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? "Editar Visita" : "Registrar Visita"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Asociada <span className="text-red-400">*</span></label>
            <Select name="asociadaId" value={formData.asociadaId} onChange={(e) => setFormData({ ...formData, asociadaId: e.target.value ? Number(e.target.value) : "" })} required>
              <option value="">Seleccionar...</option>
              {asociadas.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre} — {a.sector.replace("Vereda ", "")}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Fecha de la visita</label>
            <Input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Tipo</label>
            <div className="flex gap-2">
              {TIPOS_VISITA.map((t) => (
                <label key={t} className={`cursor-pointer flex-1 rounded-lg border px-3 py-2 text-xs font-medium text-center transition-colors ${formData.tipo === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                  <input type="radio" name="tipo" value={t} checked={formData.tipo === t} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="sr-only" />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Observaciones</label>
            <textarea value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Notas sobre la visita..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
              Programar próxima visita <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <Input type="date" value={formData.proximaVisita} onChange={(e) => setFormData({ ...formData, proximaVisita: e.target.value })}
              min={formData.fecha} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" className="cursor-pointer rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700">
              {editingId ? "Actualizar Visita" : "Guardar Visita"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!deletingVisita} title="Eliminar Visita"
        message={`¿Estás seguro de eliminar esta visita de ${deletingVisita ? (asociadaMap[deletingVisita.asociadaId]?.nombre || "—") : ""}? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingVisita(null)} />
      {ToastDisplay}
    </section>
  );
}

export default VisitasPage;
