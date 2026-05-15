import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/ui/Navbar";
import MapaPage from "./pages/MapaPage";
import TablaPage from "./pages/TablaPage";
import BuscadorPage from "./pages/BuscadorPage";
import SectoresPage from "./pages/SectoresPage";
import ExportacionPage from "./pages/ExportacionPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 overflow-auto px-8 py-8">
          <Routes>
            <Route path="/" element={<MapaPage />} />
            <Route path="/tabla" element={<TablaPage />} />
            <Route path="/buscador" element={<BuscadorPage />} />
            <Route path="/sectores" element={<SectoresPage />} />
            <Route path="/exportacion" element={<ExportacionPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
