const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY)");
}

const REST_URL = `${SUPABASE_URL}/rest/v1`;

/**
 * Cliente HTTP puro (Cero SDKs Comerciales).
 * Se encarga de inyectar los headers obligatorios y procesar las respuestas crudas de Supabase.
 */
export async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      ...options.headers,
    },
  };

  const response = await fetch(`${REST_URL}${endpoint}`, config);
  
  if (response.status === 204) {
    return null; // No content (e.g. DELETE without return=representation)
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Error ${response.status}: ${response.statusText}`);
  }

  return data;
}

// Helper para extraer el primer elemento de un array devuelto por Supabase al insertar/actualizar
const firstOrNull = (arr) => (Array.isArray(arr) && arr.length > 0 ? arr[0] : arr);

export const api = {
  // === SECTORES ===
  getSectores: () => request("/sectores?select=*"),
  createSector: async (data) => {
    const res = await request("/sectores", { 
      method: "POST", 
      body: JSON.stringify(data),
      headers: { "Prefer": "return=representation" }
    });
    return firstOrNull(res);
  },

  // === ASOCIADAS ===
  getAsociadas: () => request("/asociadas?select=*,sectores(nombre)&order=id.asc"),
  createAsociada: async (data) => {
    const res = await request("/asociadas", { 
      method: "POST", 
      body: JSON.stringify(data),
      headers: { "Prefer": "return=representation" }
    });
    return firstOrNull(res);
  },
  updateAsociada: async (id, data) => {
    const res = await request(`/asociadas?id=eq.${id}`, { 
      method: "PATCH", // Update en PostgREST se hace con PATCH
      body: JSON.stringify(data),
      headers: { "Prefer": "return=representation" }
    });
    return firstOrNull(res);
  },
  deleteAsociada: async (id) => {
    const res = await request(`/asociadas?id=eq.${id}`, { 
      method: "DELETE",
      headers: { "Prefer": "return=representation" }
    });
    return firstOrNull(res);
  },

  // === VISITAS ===
  getVisitas: () => request("/visitas?select=*"),
  createVisita: async (data) => {
    const res = await request("/visitas", { 
      method: "POST", 
      body: JSON.stringify(data),
      headers: { "Prefer": "return=representation" }
    });
    return firstOrNull(res);
  },
  updateVisita: async (id, data) => {
    const res = await request(`/visitas?id=eq.${id}`, { 
      method: "PATCH", 
      body: JSON.stringify(data),
      headers: { "Prefer": "return=representation" }
    });
    return firstOrNull(res);
  },
  deleteVisita: async (id) => {
    const res = await request(`/visitas?id=eq.${id}`, { 
      method: "DELETE",
      headers: { "Prefer": "return=representation" }
    });
    return firstOrNull(res);
  },

  // === DASHBOARD Y VISTAS ===
  // Para el dashboard podemos intentar usar la vista si la tenemos o devolver null para que el frontend lo calcule
  getDashboard: () => request("/rpc/get_dashboard_stats", { method: "POST" }).catch(() => null),
  getAlertas: () => request("/alertas_asociadas?select=*").catch(() => []),
  getProximasVisitas: () => request("/asociadas?select=id,nombre,fecha_ultima_visita,sector_id,num_visitas&order=fecha_ultima_visita.asc&limit=10").catch(() => []),

  // === IMPORTACIÓN MASIVA ===
  importarMasivo: async (listaAsociadas) => {
    // PostgREST soporta bulk insert enviando un array
    const res = await request("/asociadas", {
      method: "POST",
      body: JSON.stringify(listaAsociadas),
      headers: { "Prefer": "return=representation" }
    });
    return res;
  },
};
