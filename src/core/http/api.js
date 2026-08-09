/**
 * AGENTE 4 - DESARROLLADOR BACKEND (SENIOR BACKEND ENGINEER)
 * Cliente HTTP Puro y Nativo — Cero SDKs Comerciales.
 *
 * Se conecta directamente al servidor REST propio en VITE_API_URL.
 * Todas las operaciones usan fetch() nativo, inyección manual de headers
 * y procesamiento manual de respuestas JSON crudas.
 *
 * Rutas detectadas en el servidor:
 *  GET    /asociadas
 *  POST   /asociadas          (body: objeto)
 *  PUT    /asociadas/:id      (body: campos a actualizar)
 *  DELETE /asociadas/:id
 *
 *  GET    /visitas
 *  POST   /visitas            (body: objeto — solo uno a la vez)
 *  PUT    /visitas/:id
 *  DELETE /visitas/:id
 *
 *  GET    /sectores
 *  POST   /sectores           (body: objeto)
 *  DELETE /sectores/:id       (no soportado, se omite)
 */

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("Falta la variable de entorno VITE_API_URL. Ejemplo: https://dashboard.servidor.blog/api");
}

/**
 * Función base de petición HTTP pura.
 * Inyecta Content-Type, procesa errores y devuelve JSON directamente.
 */
export async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, config);

  if (response.status === 204) return null;

  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    if (!response.ok) throw new Error(`Error ${response.status}: ${text}`);
    return text;
  }

  if (!response.ok) {
    const msg = parsed?.error || parsed?.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(msg);
  }

  // El servidor envuelve los datos en { data: [...] }
  if (parsed && typeof parsed === "object" && "data" in parsed) {
    return parsed.data;
  }

  return parsed;
}

// Helper: primer elemento si es array, si no, el dato directo
const firstOrNull = (res) => (Array.isArray(res) && res.length > 0 ? res[0] : res);

export const api = {
  // =========================================================
  // SECTORES
  // =========================================================
  getSectores: () => request("/sectores"),

  createSector: async (data) => {
    const res = await request("/sectores", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return firstOrNull(res);
  },

  // =========================================================
  // ASOCIADAS
  // =========================================================
  getAsociadas: () => request("/asociadas"),

  createAsociada: async (data) => {
    const res = await request("/asociadas", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return firstOrNull(res);
  },

  updateAsociada: async (id, data) => {
    const res = await request(`/asociadas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return firstOrNull(res);
  },

  deleteAsociada: async (id) => {
    const res = await request(`/asociadas/${id}`, {
      method: "DELETE",
    });
    return firstOrNull(res);
  },

  // =========================================================
  // VISITAS
  // =========================================================
  getVisitas: () => request("/visitas"),

  createVisita: async (data) => {
    const res = await request("/visitas", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return firstOrNull(res);
  },

  updateVisita: async (id, data) => {
    const res = await request(`/visitas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return firstOrNull(res);
  },

  deleteVisita: async (id) => {
    const res = await request(`/visitas/${id}`, {
      method: "DELETE",
    });
    return firstOrNull(res);
  },

  // =========================================================
  // IMPORTACIÓN MASIVA
  // El servidor no tiene ruta /importar, así que hacemos los
  // inserts uno a uno usando createAsociada
  // =========================================================
  importarMasivo: async (listaAsociadas) => {
    const results = [];
    for (const asociada of listaAsociadas) {
      const res = await request("/asociadas", {
        method: "POST",
        body: JSON.stringify(asociada),
      });
      results.push(firstOrNull(res));
    }
    return results;
  },

  // =========================================================
  // ARCHIVOS (UPLOADS)
  // =========================================================
  uploadFoto: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const parsed = await res.json();
    if (!res.ok) {
      throw new Error(parsed?.error || parsed?.message || "Error al subir la imagen");
    }
    
    // Convertir ruta relativa a absoluta
    if (parsed.data && parsed.data.publicUrl) {
      if (parsed.data.publicUrl.startsWith("/")) {
        parsed.data.publicUrl = `https://dashboard.servidor.blog${parsed.data.publicUrl}`;
      }
    }
    
    return parsed.data;
  },

  // =========================================================
  // DASHBOARD (calculado en frontend, no hay ruta dedicada)
  // =========================================================
  getDashboard: () => Promise.resolve(null),
  getAlertas: () => Promise.resolve([]),
  getProximasVisitas: () => request("/asociadas").catch(() => []),
};
