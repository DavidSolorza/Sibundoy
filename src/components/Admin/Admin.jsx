import { Users, BarChart3, ClipboardList, CheckCircle, MapPin, Calendar, UserCheck } from "lucide-react";
import useAsociadas from "../../hooks/useAsociadas";
import StatCard from "../ui/StatCard";
import { Card, CardHeader, CardTitle } from "../ui/Card";

function Admin() {
  const { asociadas } = useAsociadas();

  const sectores = {};
  asociadas.forEach((a) => {
    sectores[a.sector] = (sectores[a.sector] || 0) + 1;
  });

  const totalVisitas = asociadas.reduce((sum, a) => sum + a.numVisitas, 0);
  const promedioEdad = (asociadas.reduce((sum, a) => sum + a.edad, 0) / asociadas.length).toFixed(1);
  const activas = asociadas.filter((a) => a.numVisitas > 0).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Asociadas" value={asociadas.length} icon={Users} />
        <StatCard label="Promedio Edad" value={`${promedioEdad} años`} icon={BarChart3} />
        <StatCard label="Total Visitas" value={totalVisitas} icon={ClipboardList} />
        <StatCard label="Asociadas Activas" value={activas} icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Distribuci\u00f3n por Sector
            </CardTitle>
          </CardHeader>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Sector
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {Object.entries(sectores).map(([sector, count]) => (
                  <tr key={sector} className="transition-colors duration-150 hover:bg-blue-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sector}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resumen R\u00e1pido
            </CardTitle>
          </CardHeader>
          <ul className="space-y-3">
            <li className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                Total Sectores
              </span>
              <span className="font-semibold text-gray-900">{Object.keys(sectores).length}</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Promedio Visitas por Asociada
              </span>
              <span className="font-semibold text-gray-900">
                {(totalVisitas / asociadas.length).toFixed(1)}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Total Personas Beneficiadas
              </span>
              <span className="font-semibold text-gray-900">
                {asociadas.reduce((sum, a) => sum + a.numPersonas, 0)}
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default Admin;
