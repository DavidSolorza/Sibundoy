import { Search } from "lucide-react";
import Buscador from "../components/Search/Buscador";

function BuscadorPage() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Search className="h-6 w-6" />
          Buscador Inteligente
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Busque asociadas por nombre o sector y visualice su ubicaci\u00f3n en el mapa.
        </p>
      </div>
      <Buscador />
    </section>
  );
}

export default BuscadorPage;
