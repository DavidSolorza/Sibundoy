import { MapPin } from "lucide-react";
import Sectores from "../components/Sectors/Sectores";

function SectoresPage() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <MapPin className="h-6 w-6" />
          Sectores Interactivos
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Explore los sectores y visualice las asociadas en el mapa.
        </p>
      </div>
      <Sectores />
    </section>
  );
}

export default SectoresPage;
