import { useState, useMemo } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { Map, Sprout, ClipboardList, Download, Upload, Settings, Menu, X, Bell } from "lucide-react";
import useVisitas from "../../features/visitas/useVisitas";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [params] = useSearchParams();
  const isViewOnly = useMemo(() => params.has("view"), [params]);
  const closeMobile = () => setMobileOpen(false);
  const { getProximasVisitas } = useVisitas();
  const proximas = useMemo(() => getProximasVisitas(), [getProximasVisitas]);
  const notifCount = proximas.length;

  const links = useMemo(() => {
    const all = [
      { to: "/", label: "Mapa", icon: Map },
      { to: "/huertas", label: "Huertas", icon: Sprout },
      { to: "/visitas", label: "Visitas", icon: ClipboardList, badge: notifCount > 0 ? notifCount : undefined },
    ];
    if (!isViewOnly) {
      all.push(
        { to: "/exportacion", label: "Exportar", icon: Download },
        { to: "/importar", label: "Importar", icon: Upload },
        { to: "/admin", label: "Admin", icon: Settings },
      );
    }
    return all;
  }, [isViewOnly, notifCount]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[1100] flex items-center gap-3 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 md:hidden">
        <button onClick={() => setMobileOpen(true)} className="cursor-pointer rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200" aria-label="Abrir menú de navegación" aria-expanded={mobileOpen}>
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-800">AgroMap</span>
        {notifCount > 0 && (
          <button onClick={() => { setMobileOpen(true); }} className="ml-auto cursor-pointer relative p-1.5 text-amber-600">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">{notifCount}</span>
          </button>
        )}
      </header>

      {mobileOpen && <div className="fixed inset-0 z-[1100] bg-black/40 md:hidden" onClick={closeMobile} role="presentation" />}

      <aside className={`fixed inset-y-0 left-0 z-[1200] flex w-64 flex-col bg-white shadow-xl transition-transform duration-300 ease-out md:static md:z-[1] md:w-56 md:translate-x-0 md:shadow-none md:border-r md:border-slate-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} role="navigation" aria-label="Navegación principal" aria-hidden={!mobileOpen}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white text-sm font-bold" aria-hidden="true">
              A
            </span>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">AgroMap</h1>
              <p className="text-[11px] text-slate-400">Asociadas · Sibundoy</p>
            </div>
          </div>
          <button onClick={closeMobile} className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:hidden" aria-label="Cerrar menú de navegación">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-4">
          {links.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 md:py-2.5 ${
                  isActive ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0 md:h-4 md:w-4" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-[11px] text-slate-400">Sistema Asociadas v1.0</p>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
