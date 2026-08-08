import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, Calendar, AlertTriangle, CheckCircle2, ClipboardList, Info, Trash2 } from "lucide-react";
import Modal from "../../shared/ui/Modal";
import { parseLocalDate, getLocalDateString } from "../../shared/lib/dates";
import useAsociadas from "../asociadas/useAsociadas";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const typeColors = { visita: "bg-blue-500", seguimiento: "bg-amber-500", capacitacion: "bg-emerald-500" };
const typeBg = { visita: "bg-blue-100 text-blue-750", seguimiento: "bg-amber-100 text-amber-750", capacitacion: "bg-emerald-100 text-emerald-750" };
const TIPOS = ["visita", "seguimiento", "capacitacion"];

function CalendarView({ visitas, onDayClick }) {
  const { asociadas } = useAsociadas();
  const [baseDate, setBaseDate] = useState(() => new Date());

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const todayStr = getLocalDateString();
  const [todayYear, todayMonth] = todayStr.split("-").map(Number);

  // Map asociadas for easy lookup
  const asociadaMap = useMemo(() => {
    const m = {};
    asociadas.forEach((a) => {
      m[a.id] = a;
    });
    return m;
  }, [asociadas]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const visitsByDate = useMemo(() => {
    const m = {};
    visitas.forEach((v) => {
      if (!m[v.fecha]) m[v.fecha] = [];
      m[v.fecha].push(v);
    });
    return m;
  }, [visitas]);

  const weeks = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayVisits = visitsByDate[dateStr] || [];
      cells.push({ day: d, dateStr, visitCount: dayVisits.length, visits: dayVisits });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const w = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [daysInMonth, firstDay, visitsByDate, year, month]);

  const goToToday = useCallback(() => setBaseDate(new Date()), []);
  const prevMonth = useCallback(() => setBaseDate(new Date(year, month - 1, 1)), [year, month]);
  const nextMonth = useCallback(() => setBaseDate(new Date(year, month + 1, 1)), [year, month]);
  const prevYear = useCallback(() => setBaseDate(new Date(year - 1, month, 1)), [year, month]);
  const nextYear = useCallback(() => setBaseDate(new Date(year + 1, month, 1)), [year, month]);

  const isCurrentMonth = month === todayMonth - 1 && year === todayYear;
  const monthTotal = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return visitas.filter((v) => v.fecha.startsWith(prefix)).length;
  }, [visitas, year, month]);

  // Sidebar Analytics: Overdue and This Week pending tasks
  const sidebarData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

    const formattedStart = startOfWeek.toISOString().slice(0, 10);
    const formattedEnd = endOfWeek.toISOString().slice(0, 10);

    const retrasadas = [];
    const estaSemana = [];

    visitas.forEach((v) => {
      if (v.realizada) return;

      if (v.fecha < todayStr) {
        retrasadas.push(v);
      } else if (v.fecha >= formattedStart && v.fecha <= formattedEnd) {
        estaSemana.push(v);
      }
    });

    return {
      retrasadas: retrasadas.slice(0, 8),
      totalRetrasadas: retrasadas.length,
      estaSemana: estaSemana.slice(0, 8),
      totalEstaSemana: estaSemana.length,
    };
  }, [visitas, todayStr]);

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      
      {/* Left Column: Calendar Main View */}
      <div className="flex-1">
        {/* Calendar Nav Toolbar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button onClick={prevYear} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors" title="Año anterior">
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button onClick={prevMonth} className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors" title="Mes anterior">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 min-w-[160px] text-center">
              {MONTHS[month]} {year}
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
              {monthTotal} visitas
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={nextMonth} className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors" title="Mes siguiente">
              <ChevronRight className="h-5 w-5" />
            </button>
            <button onClick={nextYear} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors" title="Año siguiente">
              <ChevronsRight className="h-4 w-4" />
            </button>
            {!isCurrentMonth && (
              <button onClick={goToToday} className="cursor-pointer ml-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Ir a hoy
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mb-3 text-[10px] text-slate-400 font-semibold">
          <span className="font-bold text-slate-500">Actividad:</span>
          {TIPOS.map((t) => (
            <span key={t} className="flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-full ${typeColors[t]}`} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          ))}
        </div>

        {/* Month grid layout */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
          {DAYS.map((d) => (
            <div key={d} className="bg-slate-50 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              {d}
            </div>
          ))}
          {weeks.flat().map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[105px]" />;
            
            const isToday = cell.dateStr === todayStr;
            const allCompleted = cell.visits.length > 0 && cell.visits.every(v => v.realizada);
            const hasOverdue = cell.visits.length > 0 && cell.visits.some(v => !v.realizada && cell.dateStr < todayStr);

            return (
              <div
                key={cell.dateStr}
                className="bg-white min-h-[105px] flex flex-col p-1.5 border-r border-b border-slate-100 relative group"
              >
                {/* Day header */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold rounded px-1.5 py-0.5 ${
                    isToday ? "bg-slate-800 text-white shadow-sm" : "text-slate-400"
                  }`}>
                    {cell.day}
                  </span>
                  
                  {cell.visitCount > 0 && (
                    <span className={`h-2 w-2 rounded-full ${
                      hasOverdue ? "bg-red-500 animate-ping" : allCompleted ? "bg-slate-300" : "bg-blue-500"
                    }`} />
                  )}
                </div>

                {/* Day events list */}
                {cell.visitCount > 0 && (
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden mt-1 select-none">
                    {cell.visits.slice(0, 3).map((v) => {
                      const asocName = asociadaMap[v.asociadaId]?.nombre || "—";
                      const color = typeColors[v.tipo] || "bg-slate-500";
                      return (
                        <div 
                          key={v.id} 
                          onClick={() => onDayClick(cell.dateStr)}
                          className={`cursor-pointer text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center justify-between text-white transition-opacity hover:opacity-85 ${color} ${
                            v.realizada ? "opacity-45" : ""
                          }`}
                        >
                          <span className="truncate max-w-[50px]">{asocName.split(" ")[0]}</span>
                          <span className="scale-75 shrink-0">{v.realizada ? "✓" : "⌛"}</span>
                        </div>
                      );
                    })}
                    {cell.visits.length > 3 && (
                      <button 
                        onClick={() => onDayClick(cell.dateStr)}
                        className="cursor-pointer text-left text-[8px] text-slate-400 font-bold hover:text-slate-700 mt-0.5"
                      >
                        +{cell.visits.length - 3} más...
                      </button>
                    )}
                  </div>
                )}

                {/* Day Click Handler overlay */}
                <div 
                  onClick={() => onDayClick(cell.dateStr)} 
                  className="absolute inset-0 cursor-pointer bg-transparent hover:bg-slate-900/[0.02] transition-colors"
                />

                {/* CSS Tooltip on Hover */}
                {cell.visitCount > 0 && (
                  <div className="absolute hidden group-hover:flex flex-col z-[100] bg-slate-900/95 backdrop-blur-md text-white text-[10px] rounded-xl p-3 shadow-xl w-56 -top-2 left-1/2 -translate-x-1/2 -translate-y-full border border-slate-700 pointer-events-none transition-all duration-200">
                    <p className="font-bold text-xs border-b border-slate-700 pb-1.5 mb-1.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-blue-400" />
                      {parseLocalDate(cell.dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {cell.visits.map((v) => {
                        const asoc = asociadaMap[v.asociadaId];
                        return (
                          <div key={v.id} className="border-b border-slate-800 last:border-0 pb-1.5 last:pb-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 truncate max-w-[120px]">{asoc?.nombre}</span>
                              <span className={`text-[8px] px-1 rounded font-bold uppercase ${
                                v.tipo === "visita" ? "bg-blue-500/20 text-blue-300" :
                                v.tipo === "seguimiento" ? "bg-amber-500/20 text-amber-300" :
                                "bg-emerald-500/20 text-emerald-300"
                              }`}>{v.tipo}</span>
                            </div>
                            <p className="text-slate-400 text-[9px] mt-0.5">{asoc?.sector?.replace("Vereda ", "")}</p>
                            {v.observaciones && <p className="italic text-slate-400 mt-1 line-clamp-2">"{v.observaciones}"</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Tasks/Activities Sidebar */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
        
        {/* Retrasadas / Overdue Tasks panel */}
        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/80 to-white shadow-sm p-4 flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-red-700 mb-3">
            <AlertTriangle className="h-4 w-4" />
            <span>Visitas Vencidas ({sidebarData.totalRetrasadas})</span>
          </div>
          
          {sidebarData.totalRetrasadas > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {sidebarData.retrasadas.map((v) => {
                const asoc = asociadaMap[v.asociadaId];
                return (
                  <div 
                    key={v.id} 
                    onClick={() => onDayClick(v.fecha)}
                    className="cursor-pointer bg-white border border-red-100 hover:border-red-300 rounded-xl p-3 text-[10px] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate max-w-[110px]">{asoc?.nombre}</span>
                      <span className="text-[8px] text-red-500 font-semibold">{parseLocalDate(v.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5 truncate">{asoc?.sector?.replace("Vereda ", "")}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${typeColors[v.tipo]}`} />
                      <span className="capitalize">{v.tipo}</span>
                    </div>
                  </div>
                );
              })}
              {sidebarData.totalRetrasadas > 8 && (
                <p className="text-[9px] text-red-400 font-semibold text-center mt-1">y {sidebarData.totalRetrasadas - 8} visitas más pendientes...</p>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 italic py-2 text-center bg-white rounded-lg border border-slate-100">Al día. Sin visitas atrasadas.</p>
          )}
        </div>

        {/* Esta semana / Current week tasks panel */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white shadow-sm p-4 flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-blue-800 mb-3">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Pendientes Esta Semana ({sidebarData.totalEstaSemana})</span>
          </div>

          {sidebarData.totalEstaSemana > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sidebarData.estaSemana.map((v) => {
                const asoc = asociadaMap[v.asociadaId];
                return (
                  <div 
                    key={v.id} 
                    onClick={() => onDayClick(v.fecha)}
                    className="cursor-pointer bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3 text-[10px] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate max-w-[110px]">{asoc?.nombre}</span>
                      <span className="text-[8px] text-blue-600 font-semibold">{parseLocalDate(v.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5 truncate">{asoc?.sector?.replace("Vereda ", "")}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-1">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${typeColors[v.tipo]}`} />
                        <span className="capitalize">{v.tipo}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
              {sidebarData.totalEstaSemana > 8 && (
                <p className="text-[9px] text-slate-400 font-semibold text-center mt-1">y {sidebarData.totalEstaSemana - 8} visitas más programadas...</p>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 italic py-2 text-center bg-white rounded-lg border border-slate-100">Sin actividades programadas.</p>
          )}
        </div>

      </div>

    </div>
  );
}

function DayDetailModal({ dateStr, visits, asociadaMap, onClose, onEdit, onDelete, onMarcarRealizada }) {
  const formatted = dateStr
    ? parseLocalDate(dateStr).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "";
  return (
    <Modal open={!!dateStr} onClose={onClose} title={<span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" />{formatted}</span>}>
      {visits.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No hay visitas este día.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {visits.map((v) => {
            const a = asociadaMap[v.asociadaId];
            return (
              <div key={v.id} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 ${v.realizada ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-100"}`}>
                <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${v.realizada ? "bg-slate-100" : v.tipo === "visita" ? "bg-blue-50" : v.tipo === "seguimiento" ? "bg-amber-50" : "bg-emerald-50"}`}>
                  <Clock className={`h-3 w-3 ${v.realizada ? "text-slate-400" : v.tipo === "visita" ? "text-blue-500" : v.tipo === "seguimiento" ? "text-amber-500" : "text-emerald-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.realizada ? "bg-slate-200 text-slate-500" : typeBg[v.tipo]}`}>{v.tipo}</span>
                    {v.realizada ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-700 text-white">
                        <CheckCircle2 className="h-3 w-3" /> Realizada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-800 truncate">{a?.nombre || "—"}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{a?.sector?.replace("Vereda ", "")}</span>
                  </div>
                  {v.observaciones && <p className="text-xs text-slate-500 mt-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">Observación: {v.observaciones}</p>}
                  {v.proximaVisita && v.proximaVisita !== v.fecha && (
                    <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1 font-semibold">
                      <Clock className="h-3 w-3" /> Próxima: {parseLocalDate(v.proximaVisita).toLocaleDateString("es-CO")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0 ml-auto">
                  {!v.realizada && (
                    <button onClick={() => { onMarcarRealizada(v.id); onClose(); }}
                      className="cursor-pointer rounded-md p-1.5 text-emerald-500 hover:bg-emerald-50 transition-colors" title="Marcar como realizada">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => { onEdit(v); onClose(); }}
                    className="cursor-pointer rounded-md p-1.5 text-blue-500 hover:bg-blue-50 transition-colors" title="Editar">
                    <Clock className="h-4 w-4" />
                  </button>
                  <button onClick={() => { onDelete(v); onClose(); }}
                    className="cursor-pointer rounded-md p-1.5 text-red-400 hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export { CalendarView, DayDetailModal };
