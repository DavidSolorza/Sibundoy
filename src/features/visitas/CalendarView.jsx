import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, Calendar, Edit3, Trash2, CheckCircle } from "lucide-react";
import Modal from "../../shared/ui/Modal";
import { parseLocalDate, getLocalDateString } from "../../shared/lib/dates";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const typeColors = { visita: "bg-blue-500", seguimiento: "bg-amber-500", capacitacion: "bg-emerald-500" };
const typeBg = { visita: "bg-blue-100 text-blue-700", seguimiento: "bg-amber-100 text-amber-700", capacitacion: "bg-emerald-100 text-emerald-700" };
const TIPOS = ["visita", "seguimiento", "capacitacion"];

function CalendarView({ visitas, onDayClick }) {
  const [baseDate, setBaseDate] = useState(() => new Date());

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const todayStr = getLocalDateString();
  const [todayYear, todayMonth] = todayStr.split("-").map(Number);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button onClick={prevYear} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors" title="Año anterior">
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button onClick={prevMonth} className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors" title="Mes anterior">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-800 min-w-[180px] text-center">
            {MONTHS[month]} {year}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium bg-slate-100 rounded-full px-2 py-0.5">
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
            <button onClick={goToToday} className="cursor-pointer ml-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Ir a hoy
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-[11px] text-slate-500">
        <span className="font-medium">Leyenda:</span>
        {TIPOS.map((t) => (
          <span key={t} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${typeColors[t]}`} />
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
        {DAYS.map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {d}
          </div>
        ))}
        {weeks.flat().map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="bg-white min-h-[95px]" />;
          const isToday = cell.dateStr === todayStr;
          const isFuture = cell.dateStr > todayStr;
          const allPastOrCompleted = cell.visits.length > 0 && cell.visits.every(v => v.realizada || cell.dateStr < todayStr);
          return (
            <button
              key={cell.dateStr}
              onClick={() => onDayClick(cell.dateStr)}
              className={`cursor-pointer px-1.5 py-1.5 text-left transition-colors min-h-[95px] flex flex-col relative
                ${cell.visitCount > 0
                  ? allPastOrCompleted
                    ? "bg-gradient-to-b from-white to-slate-100/60 hover:to-slate-200/80 shadow-[inset_0_-2px_0_0_rgba(148,163,184,0.3)]"
                    : "bg-gradient-to-b from-white to-blue-50/60 hover:to-blue-100/80 shadow-[inset_0_-2px_0_0_rgba(59,130,246,0.3)]"
                  : "bg-white hover:bg-slate-50"
                }
                ${isToday ? "ring-2 ring-inset ring-slate-800" : ""}
                ${cell.visitCount === 0 && !isToday ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                {cell.visitCount > 0 ? (
                  <span className={`flex items-center justify-center h-6 w-6 rounded-full text-white text-[11px] font-bold leading-none ${
                    allPastOrCompleted ? "bg-slate-400" : "bg-blue-600"
                  }`}>
                    {cell.visitCount}
                  </span>
                ) : (
                  <span className={`text-xs font-medium ${isToday ? "text-slate-800" : "text-slate-500"}`}>
                    {cell.day}
                  </span>
                )}
              </div>
              {cell.visitCount > 0 ? (
                <div className="flex flex-col gap-1 mt-auto">
                  <div className="flex flex-wrap gap-1">
                    {(["visita", "seguimiento", "capacitacion"]).map((tipo) => {
                      const count = cell.visits.filter((v) => v.tipo === tipo).length;
                      if (!count) return null;
                      const muted = allPastOrCompleted;
                      return (
                        <span key={tipo} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${
                          muted
                            ? "bg-slate-200 text-slate-500"
                            : tipo === "visita" ? "bg-blue-200 text-blue-800" :
                              tipo === "seguimiento" ? "bg-amber-200 text-amber-800" :
                              "bg-emerald-200 text-emerald-800"
                        }`}>
                          {tipo === "visita" ? "V" : tipo === "seguimiento" ? "S" : "C"}
                          <span className="text-[11px] font-bold">{count}</span>
                        </span>
                      );
                    })}
                  </div>
                  {cell.visits.length > 5 && (
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">+{cell.visits.length - 5} más</span>
                  )}
                </div>
              ) : isFuture ? (
                <span className="text-[9px] text-slate-300 mt-auto">—</span>
              ) : null}
            </button>
          );
        })}
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
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${v.realizada ? "bg-slate-200 text-slate-500" : typeBg[v.tipo]}`}>{v.tipo}</span>
                    {v.realizada && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-300 text-slate-600">Realizada</span>}
                    <span className="text-xs font-medium text-slate-800 truncate">{a?.nombre || "—"}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{a?.sector?.replace("Vereda ", "")}</span>
                  </div>
                  {v.observaciones && <p className="text-xs text-slate-500 mt-1">{v.observaciones}</p>}
                  {v.proximaVisita && (
                    <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Próxima: {parseLocalDate(v.proximaVisita).toLocaleDateString("es-CO")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0 ml-auto">
                  {!v.realizada && (
                    <button onClick={() => { onMarcarRealizada(v.id); onClose(); }}
                      className="cursor-pointer rounded-md p-1.5 text-emerald-500 hover:bg-emerald-50 transition-colors" title="Marcar como realizada">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => { onEdit(v); onClose(); }}
                    className="cursor-pointer rounded-md p-1.5 text-blue-500 hover:bg-blue-50 transition-colors" title="Editar">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { onDelete(v); onClose(); }}
                    className="cursor-pointer rounded-md p-1.5 text-red-400 hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-3.5 w-3.5" />
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
