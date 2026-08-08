const parseBoolean = (val) => {
  if (val === 1 || val === "1" || val === true || val === "true") return true;
  return false;
};

// Convierte lo que viene del Backend (snake_case) al formato de React (camelCase)
export function toFrontendAsociada(row) {
  if (!row) return null;

  // Manejar fotos (array o string JSON)
  const baseFotos = Array.isArray(row.fotos)
    ? row.fotos
    : JSON.parse(row.fotos || "[]");

  // Extraer el nombre del sector
  let sectorNombre = "";
  if (typeof row.sector === "object" && row.sector?.nombre) {
    sectorNombre = row.sector.nombre;
  } else if (typeof row.sector === "string") {
    sectorNombre = row.sector;
  } else if (row.sector_nombre) {
    sectorNombre = row.sector_nombre;
  }

  return {
    id: Number(row.id),
    nombre: row.nombre ?? row.asociada_nombre ?? row.asociadaNombre ?? "",
    edad: row.edad ?? null,
    telefono: row.telefono || "",
    numPersonas: row.num_personas ?? row.numPersonas ?? 1,
    menoresHogar: row.menores_hogar ?? row.menoresHogar ?? 0,
    sectorId: row.sector_id ?? row.sectorId ?? null,
    sector: sectorNombre,
    areaHuerta: row.area_huerta ?? row.areaHuerta ?? "",
    productos: row.productos ?? "",
    fechaSiembra: row.fecha_siembra ?? row.fechaSiembra ?? null,
    fechaUltimaVisita: row.fecha_ultima_visita ?? row.fechaUltimaVisita ?? row.ultima_visita ?? null,
    numVisitas: row.num_visitas ?? row.numVisitas ?? 0,
    tipoPersona: row.tipo_persona ?? row.tipoPersona ?? null,
    observaciones: row.observaciones || "",
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    fotos: baseFotos,
    urlFoto: row.url_foto ?? row.urlFoto ?? (baseFotos[0] || null),
    diasSinVisita: row.dias_sin_visita ?? row.diasSinVisita,
    alertaSinVisita: parseBoolean(row.alerta_sin_visita ?? row.alertaSinVisita),
    alertaBajaFrecuencia: parseBoolean(row.alerta_baja_frecuencia ?? row.alertaBajaFrecuencia),
  };
}

// Convierte del formulario de React al formato que espera la Base de Datos
export function toBackendAsociada(data) {
  return {
    nombre: data.nombre,
    edad: data.edad === "" ? null : data.edad,
    telefono: data.telefono || null,
    num_personas: data.numPersonas || 1,
    menores_hogar: data.menoresHogar || 0,
    sector_id: data.sectorId || null,
    area_huerta: data.areaHuerta || null,
    productos: data.productos || null,
    fecha_siembra: data.fechaSiembra || null,
    fecha_ultima_visita: data.fechaUltimaVisita || null,
    num_visitas: data.numVisitas || 0,
    tipo_persona: data.tipoPersona || null,
    observaciones: data.observaciones || null,
    lat: data.lat || null,
    lng: data.lng || null,
    url_foto: data.urlFoto || null,
    fotos: data.fotos || [],
  };
}

export function toFrontendVisita(row) {
  if (!row) return null;

  return {
    id: row.id,
    asociadaId: row.asociada_id ?? row.asociadaId,
    asociadaNombre: row.asociada_nombre ?? row.asociadaNombre ?? "",
    fecha: row.fecha,
    tipo: row.tipo || "visita",
    observaciones: row.observaciones || "",
    proximaVisita: row.proxima_visita ?? row.proximaVisita ?? null,
    realizada: parseBoolean(row.realizada),
  };
}

export function toBackendVisita(data) {
  return {
    asociada_id: data.asociadaId,
    fecha: data.fecha,
    tipo: data.tipo,
    observaciones: data.observaciones || null,
    proxima_visita: data.proximaVisita || null,
    realizada: data.realizada ?? false,
  };
}
