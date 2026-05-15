import { Map } from "lucide-react";
import Mapa from "../components/Map/Mapa";

function MapaPage() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Map className="h-6 w-6" />
          Mapa Interactivo
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Visualizaci\u00f3n geogr\u00e1fica de todas las asociadas registradas.
        </p>
      </div>
      <Mapa />
    </section>
  );
}

export default MapaPage;
