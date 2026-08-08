const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper genérico para peticiones HTTP
async function request(endpoint, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || `Error ${response.status}: ${response.statusText}`);
  }

  return json;
}

export const api = {
  // === SECTORES ===
  getSectores: () => request("/agromap/sectores"),
  createSector: (data) =>
    request("/agromap/sectores", { method: "POST", body: JSON.stringify(data) }),

  // === ASOCIADAS ===
  getAsociadas: () => request("/agromap/asociadas"),
  createAsociada: (data) =>
    request("/agromap/asociadas", { method: "POST", body: JSON.stringify(data) }),
  updateAsociada: (id, data) =>
    request(`/agromap/asociadas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAsociada: (id) => request(`/agromap/asociadas/${id}`, { method: "DELETE" }),

  // === VISITAS ===
  getVisitas: () => request("/agromap/visitas"),
  createVisita: (data) =>
    request("/agromap/visitas", { method: "POST", body: JSON.stringify(data) }),
  updateVisita: (id, data) =>
    request(`/agromap/visitas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVisita: (id) => request(`/agromap/visitas/${id}`, { method: "DELETE" }),

  // === DASHBOARD Y VISTAS ===
  getDashboard: () => request("/agromap/dashboard"),
  getAlertas: () => request("/agromap/alertas"),
  getProximasVisitas: () => request("/agromap/proximas-visitas"),

  // === IMPORTACIÓN MASIVA ===
  importarMasivo: (listaAsociadas) =>
    request("/agromap/import", {
      method: "POST",
      body: JSON.stringify({ asociadas: listaAsociadas }),
    }),

  // === SUBIDA DE FOTOS / MULTIMEDIA ===
  uploadFoto: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL.replace("/api", "")}/api/upload`, {
      method: "POST",
      body: formData, // No seteamos Content-Type, fetch lo hace automáticamente con el boundary para FormData
    });
    return await res.json();
  },
};
