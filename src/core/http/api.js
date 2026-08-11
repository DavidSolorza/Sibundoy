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
const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

if (!API_URL) {
  console.error("Falta la variable de entorno VITE_API_URL. Ejemplo: https://dashboard.servidor.blog/api");
}

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
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
      "Authorization": `Bearer ${API_TOKEN}`,
      ...options.headers,
    },
  };

  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);

    if (response.status === 204) return null;

    if (!response.ok) {
      const text = await response.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}
      
      let errorMsg = parsed?.error || parsed?.message || text || "Error en la petición";
      
      if (response.status === 404) {
        errorMsg = `[404] El recurso en ${endpoint} no existe.`;
      } else if (response.status === 400) {
        errorMsg = `[400] Datos inválidos: ${errorMsg}`;
      } else if (response.status === 502 || response.status === 503) {
        errorMsg = `[${response.status}] El servidor backend está temporalmente fuera de línea.`;
      } else if (response.status === 429) {
        errorMsg = "Demasiadas peticiones (Rate Limit Exceeded). Intente nuevamente.";
      }
      
      console.warn(`Error ${response.status} en ${url}:`, errorMsg);
      throw new ApiError(errorMsg, response.status, parsed);
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
    if (error instanceof ApiError) {
      throw error;
    }
    console.warn(`Error de red o CORS al conectar con ${endpoint}:`, error.message);
    throw new ApiError(`Error de conexión: ${error.message}`, 0);
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
  importarMasivo: async (listaAsociadas, batchSize = 5) => {
    const results = [];
    for (let i = 0; i < listaAsociadas.length; i += batchSize) {
      const batch = listaAsociadas.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((asociada) =>
          request("/asociadas", {
            method: "POST",
            body: JSON.stringify(asociada),
          }).catch(() => null)
        )
      );
      batchResults.forEach((res) => results.push(firstOrNull(res)));
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
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
      },
      body: formData,
    });

    const parsed = await res.json();
    if (!res.ok) {
      throw new Error(parsed?.error || parsed?.message || "Error al subir la imagen");
    }
    
    // Convertir ruta relativa a absoluta
    if (parsed.data && parsed.data.publicUrl) {
      if (parsed.data.publicUrl.startsWith("/")) {
        const baseUrl = API_URL ? API_URL.replace(/\/api$/, '') : "";
        parsed.data.publicUrl = `${baseUrl}${parsed.data.publicUrl}`;
      }
    }
    
    return parsed.data;
  },

  getProximasVisitas: () => request("/asociadas").catch(() => []),
};
