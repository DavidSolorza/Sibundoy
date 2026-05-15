import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AsociadasProvider } from "./context/AsociadasContext";
import Navbar from "./components/ui/Navbar";
import MapaPage from "./pages/MapaPage";
import HuertasPage from "./pages/HuertasPage";
import ExportacionPage from "./pages/ExportacionPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <BrowserRouter>
      <AsociadasProvider>
        <div className="min-h-screen bg-gray-50 md:flex">
          <Navbar />
          <main className="flex-1 overflow-auto px-4 pb-20 pt-16 md:px-8 md:py-8">
            <Routes>
              <Route path="/" element={<MapaPage />} />
              <Route path="/huertas" element={<HuertasPage />} />
              <Route path="/exportacion" element={<ExportacionPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
        </div>
      </AsociadasProvider>
    </BrowserRouter>
  );
}

export default App;
