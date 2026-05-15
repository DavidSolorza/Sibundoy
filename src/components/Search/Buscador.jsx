import { useState } from "react";
import { Search, User, MapPin } from "lucide-react";
import useAsociadas from "../../hooks/useAsociadas";
import Mapa from "../Map/Mapa";
import { Input, Select } from "../ui/Input";
import Badge from "../ui/Badge";

function Buscador() {
  const { asociadas } = useAsociadas();
  const [query, setQuery] = useState("");
  const [filterBy, setFilterBy] = useState("nombre");
  const [selected, setSelected] = useState(null);

  const filtered = asociadas.filter((a) => {
    const val = a[filterBy]?.toLowerCase() || "";
    return val.includes(query.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="w-44"
        >
          <option value="nombre">Nombre</option>
          <option value="sector">Sector</option>
        </Select>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={`Buscar por ${filterBy}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filtered.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(selected?.id === a.id ? null : a)}
            className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              selected?.id === a.id
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <User className="h-4 w-4" />
            {a.nombre}{" "}
            <Badge variant={selected?.id === a.id ? "primary" : "default"}>
              {a.sector}
            </Badge>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 py-2 flex items-center gap-1.5">
            <Search className="h-4 w-4" />
            Sin resultados
          </p>
        )}
      </div>

      <Mapa filteredAsociadas={selected ? [selected] : filtered} />
    </div>
  );
}

export default Buscador;
