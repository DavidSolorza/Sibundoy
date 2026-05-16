import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AsociadasProvider } from "./context/AsociadasContext";
import Navbar from "./components/ui/Navbar";
import MapaPage from "./pages/MapaPage";

const HuertasPage = lazy(() => import("./pages/HuertasPage"));
const ExportacionPage = lazy(() => import("./pages/ExportacionPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

function App() {
  return (
    <BrowserRouter>
      <AsociadasProvider>
        <div className="min-h-screen bg-gray-50 md:flex">
          <Navbar />
          <main className="flex-1 overflow-auto px-4 pb-4 pt-14 md:px-8 md:py-8">
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            }>
              <Routes>
                <Route path="/" element={<MapaPage />} />
                <Route path="/huertas" element={<HuertasPage />} />
                <Route path="/exportacion" element={<ExportacionPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </AsociadasProvider>
    </BrowserRouter>
  );
}

export default App;
