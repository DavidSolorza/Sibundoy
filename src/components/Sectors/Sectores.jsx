import { useState } from "react";
import { MapPin, User, Phone, Sprout } from "lucide-react";
import useAsociadas from "../../hooks/useAsociadas";
import Mapa from "../Map/Mapa";
import Badge from "../ui/Badge";
import { Card, CardTitle } from "../ui/Card";

function Sectores() {
  const { getSectores } = useAsociadas();
  const sectores = getSectores();
  const [activeSector, setActiveSector] = useState(null);

  const sectorNames = Object.keys(sectores);
  const filtered = activeSector ? sectores[activeSector] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {sectorNames.map((sector) => {
          const isActive = activeSector === sector;
          return (
            <button
              key={sector}
              onClick={() => setActiveSector(isActive ? null : sector)}
              className={`cursor-pointer inline-flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "border-slate-800 bg-slate-800 text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:shadow-sm"
              }`}
            >
              <MapPin className="h-4 w-4" />
              {sector}
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {sectores[sector].length}
              </span>
            </button>
          );
        })}
      </div>

      {activeSector && (
        <Card className="border-l-4 border-l-slate-800">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {activeSector}
          </CardTitle>
          <ul className="mt-3 space-y-1.5">
            {sectores[activeSector].map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2.5 text-sm text-gray-700"
              >
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{a.nombre}</span>
                <span className="text-gray-300">|</span>
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{a.telefono}</span>
                <Badge variant="primary" className="flex items-center gap-1">
                  <Sprout className="h-3 w-3" />
                  {a.areaHuerta}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Mapa filteredAsociadas={filtered} />
    </div>
  );
}

export default Sectores;
