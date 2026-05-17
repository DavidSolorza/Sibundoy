import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, Calendar } from "lucide-react";
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
          if (!cell) return <div key={`empty-${i}`} className="bg-white min-h-[85px]" />;
          const isToday = cell.dateStr === todayStr;
          const isFuture = cell.dateStr > todayStr;
          return (
            <button
              key={cell.dateStr}
              onClick={() => onDayClick(cell.dateStr)}
              className={`cursor-pointer bg-white px-1.5 py-1.5 text-left transition-colors hover:bg-slate-50 min-h-[85px] flex flex-col relative
                ${isToday ? "ring-2 ring-inset ring-slate-800" : ""}
                ${cell.visitCount === 0 && !isToday ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${isToday ? "text-slate-800" : "text-slate-500"}`}>
                  {cell.day}
                </span>
                {cell.visitCount > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">{cell.visitCount}</span>
                )}
                {isFuture && cell.visitCount === 0 && (
                  <span className="text-[9px] text-slate-300">—</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 mt-auto">
                {cell.visits.slice(0, 3).map((v) => (
                  <div key={v.id} className="flex items-center gap-1">
                    <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${typeColors[v.tipo]}`} />
                    <span className="text-[9px] text-slate-500 truncate leading-none">
                      {v.tipo === "visita" ? "V" : v.tipo === "seguimiento" ? "S" : "C"}
                    </span>
                  </div>
                ))}
                {cell.visits.length > 3 && (
                  <span className="text-[9px] text-slate-400 font-medium">+{cell.visits.length - 3} más</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayDetailModal({ dateStr, visits, asociadaMap, onClose }) {
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
              <div key={v.id} className="flex items-start gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${v.tipo === "visita" ? "bg-blue-50" : v.tipo === "seguimiento" ? "bg-amber-50" : "bg-emerald-50"}`}>
                  <Clock className={`h-3 w-3 ${v.tipo === "visita" ? "text-blue-500" : v.tipo === "seguimiento" ? "text-amber-500" : "text-emerald-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${typeBg[v.tipo]}`}>{v.tipo}</span>
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
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export { CalendarView, DayDetailModal };
