/* 
 * AgroMap — Sistema de Gestión de Asociadas
 * © 2026 WolfEnterprise. Todos los derechos reservados.
 * Software desarrollado por WolfEnterprise.
 * Prohibida la reproducción total o parcial sin autorización.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
