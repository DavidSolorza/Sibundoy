import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Map, Sprout, Download, Settings, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";

const links = [
  { to: "/", label: "Mapa", icon: Map },
  { to: "/huertas", label: "Huertas", icon: Sprout },
  { to: "/exportacion", label: "Exportar", icon: Download },
  { to: "/admin", label: "Admin", icon: Settings },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-[1100] flex items-center gap-3 bg-slate-900 px-4 py-3 text-white shadow-lg md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/10"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <Map className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold">AgroMap</span>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[1100] bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[1100] flex flex-col bg-slate-900 text-white shadow-2xl transition-all duration-300 ease-in-out
          md:static md:z-[1]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${collapsed ? "w-16" : "w-64"}`}
      >
        {/* Desktop header */}
        <div className="hidden border-b border-slate-700 md:flex md:items-center md:gap-3 md:px-4 md:py-5">
          {collapsed ? (
            <div className="relative mx-auto">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                <Map className="h-5 w-5" />
              </div>
              <button
                onClick={() => setCollapsed(false)}
                className="absolute -right-3 -top-1 cursor-pointer rounded-full bg-slate-700 p-0.5 text-slate-300 shadow transition-colors hover:bg-slate-600"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
                  <Map className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold tracking-tight">AgroMap</h1>
                  <p className="truncate text-xs text-slate-400">Asociadas - Sibundoy</p>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="ml-auto cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-6 md:px-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={closeMobile}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}

              {/* Tooltip on hover when collapsed */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-lg group-hover:md:block">
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`border-t border-slate-700 px-4 py-4 ${collapsed ? "text-center" : ""}`}>
          {collapsed ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold">
              SA
            </span>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold">
                SA
              </span>
              <div className="min-w-0 text-xs">
                <p className="truncate font-medium text-white">Sistema Asociadas</p>
                <p className="truncate text-slate-400">v1.0.0</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Navbar;
