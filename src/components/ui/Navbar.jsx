import { NavLink } from "react-router-dom";
import { Map, ClipboardList, Search, MapPin, Download, Settings } from "lucide-react";

const links = [
  { to: "/", label: "Mapa", icon: Map },
  { to: "/tabla", label: "Tabla", icon: ClipboardList },
  { to: "/buscador", label: "Buscador", icon: Search },
  { to: "/sectores", label: "Sectores", icon: MapPin },
  { to: "/exportacion", label: "Exportar", icon: Download },
  { to: "/admin", label: "Admin", icon: Settings },
];

function Navbar() {
  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-white shadow-2xl">
      <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
          <Map className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Mapa Interactivo</h1>
          <p className="text-xs text-slate-400">Asociadas - Sibundoy</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold">
            SA
          </span>
          <div className="text-xs">
            <p className="font-medium text-white">Sistema Asociadas</p>
            <p className="text-slate-400">v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Navbar;
