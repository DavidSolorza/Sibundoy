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

  try {
    const response = await fetch(url, config);

    if (response.status === 204) return null;

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[404] El recurso en ${url} no existe.`);
        return null;
      } else if (response.status === 400) {
        const errText = await response.text();
        console.warn(`[400] Los datos enviados a ${url} no son válidos. Server says: ${errText}`);
        return null;
      } else if (response.status === 502 || response.status === 503) {
        console.warn(`[${response.status}] El servidor backend está temporalmente fuera de línea.`);
        return null;
      } else if (response.status === 429) {
        throw new Error("Demasiadas peticiones (Rate Limit Exceeded). Intente nuevamente.");
      }
      const text = await response.text();
      console.warn(`Error ${response.status} en ${url}: ${text}`);
      return null;
    }

    const text = await response.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      return text;
    }


    // El servidor envuelve los datos en { data: [...] }
    if (parsed && typeof parsed === "object" && "data" in parsed) {
      return parsed.data;
    }

    return parsed;

  } catch (error) {
    console.warn(`Error de red o CORS al conectar con ${endpoint}:`, error.message);
    return null;
  }
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
  // METRICS & DASHBOARD
  // =========================================================
  getDashboard: () => request("/dashboard"),
  getAlertas: () => request("/alertas"),

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

  getProximasVisitas: () => request("/asociadas").catch(() => []),
};
