/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../services/supabase";

const AsociadasContext = createContext(null);

function toFrontend(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    edad: row.edad,
    telefono: row.telefono,
    numPersonas: row.num_personas,
    menoresHogar: row.menores_hogar,
    sector: row.sector || "",
    areaHuerta: row.area_huerta,
    productos: row.productos,
    fechaSiembra: row.fecha_siembra,
    fechaUltimaVisita: row.fecha_ultima_visita,
    numVisitas: row.num_visitas,
    tipoPersona: row.tipo_persona,
    observaciones: row.observaciones,
    lat: row.lat,
    lng: row.lng,
  };
}

function toDB(data, sectorId) {
  return {
    nombre: data.nombre,
    edad: data.edad === "" ? null : (data.edad ?? null),
    telefono: data.telefono || null,
    num_personas: data.numPersonas === "" ? null : (data.numPersonas ?? null),
    menores_hogar: data.menoresHogar === "" ? null : (data.menoresHogar ?? null),
    sector_id: sectorId,
    area_huerta: data.areaHuerta || null,
    productos: data.productos || null,
    fecha_siembra: data.fechaSiembra || null,
    fecha_ultima_visita: data.fechaUltimaVisita || null,
    num_visitas: data.numVisitas === "" ? null : (data.numVisitas ?? null),
    tipo_persona: data.tipoPersona || null,
    observaciones: data.observaciones || null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
  };
}

export function AsociadasProvider({ children }) {
  const [asociadas, setAsociadas] = useState([]);
  const [sectorMap, setSectorMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("sectores")
      .select("id, nombre")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error cargando sectores:", error.message);
          return;
        }
        const map = {};
        data.forEach((s) => { map[s.nombre] = s.id; });
        setSectorMap(map);
      });
  }, []);

  const fetchAsociadas = useCallback(async () => {
    const { data, error } = await supabase
      .from("asociadas")
      .select("*, sectores(nombre)")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error cargando asociadas:", error.message);
      return null;
    }

    const mapped = (data || []).map((row) => {
      const { sectores, ...rest } = row;
      return toFrontend({ ...rest, sector: sectores?.nombre || "" });
    });
    return mapped;
  }, []);

  useEffect(() => {
    fetchAsociadas().then((mapped) => {
      if (mapped) {
        setAsociadas(mapped);
        setLastUpdated(Date.now());
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
  }, [fetchAsociadas]);

  useEffect(() => {
    const id = setInterval(async () => {
      const mapped = await fetchAsociadas();
      if (mapped) setAsociadas(mapped);
    }, 15000);

    return () => clearInterval(id);
  }, [fetchAsociadas]);

  useEffect(() => {
    const channel = supabase
      .channel("asociadas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "asociadas" },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setAsociadas((prev) => prev.filter((a) => a.id !== payload.old.id));
            return;
          }

          const { data, error } = await supabase
            .from("asociadas")
            .select("*, sectores(nombre)")
            .eq("id", payload.new.id)
            .single();

          if (error || !data) return;

          const { sectores, ...rest } = data;
          const mapped = toFrontend({ ...rest, sector: sectores?.nombre || "" });

          setAsociadas((prev) => {
            const idx = prev.findIndex((a) => a.id === mapped.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = mapped;
              return next;
            }
            return [...prev, mapped];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addAsociada = useCallback(async (data) => {
    let sectorId = sectorMap[data.sector];
    if (!sectorId) {
      const { data: sectorRow } = await supabase
        .from("sectores")
        .select("id")
        .eq("nombre", data.sector)
        .single();
      if (!sectorRow) throw new Error(`Sector "${data.sector}" no encontrado`);
      sectorId = sectorRow.id;
    }

    const { data: newRow, error } = await supabase
      .from("asociadas")
      .insert(toDB(data, sectorId))
      .select("*, sectores(nombre)")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(error.message);
    }

    const { sectores, ...rest } = newRow;
    const mapped = toFrontend({ ...rest, sector: sectores?.nombre || "" });
    setAsociadas((prev) => [...prev, mapped]);
    return mapped;
  }, [sectorMap]);

  const updateAsociada = useCallback(async (id, data) => {
    let sectorId = data.sector ? sectorMap[data.sector] : undefined;
    if (data.sector && !sectorId) {
      const { data: sectorRow } = await supabase
        .from("sectores")
        .select("id")
        .eq("nombre", data.sector)
        .single();
      sectorId = sectorRow?.id;
    }

    const dbData = toDB(data, sectorId);
    if (!sectorId) delete dbData.sector_id;

    const { error } = await supabase
      .from("asociadas")
      .update(dbData)
      .eq("id", id);

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(error.message);
    }

    setAsociadas((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }, [sectorMap]);

  const deleteAsociada = useCallback(async (id) => {
    const { error } = await supabase.from("asociadas").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(error.message);
    }
    setAsociadas((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getAsociada = useCallback((id) => asociadas.find((a) => a.id === id), [asociadas]);

  const getSectores = useCallback(() => {
    const sectores = {};
    asociadas.forEach((a) => {
      if (!sectores[a.sector]) sectores[a.sector] = [];
      sectores[a.sector].push(a);
    });
    return sectores;
  }, [asociadas]);

  const findDuplicates = useCallback(({ nombre, sector, telefono, lat, lng, excludeId }) => {
    const n = (s) => s?.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    const nn = n(nombre);

    return asociadas
      .filter((a) => a.id !== excludeId)
      .filter((a) => !sector || a.sector === sector)
      .map((a) => {
        const reasons = [];
        if (n(a.nombre) === nn) reasons.push("Nombre");
        if (telefono && a.telefono === telefono) reasons.push("Teléfono");
        if (lat != null && a.lat != null && lng != null && a.lng != null) {
          if (Math.abs(a.lat - lat) < 0.0001 && Math.abs(a.lng - lng) < 0.0001) {
            reasons.push("Ubicación");
          }
        }
        return reasons.length > 0 ? { id: a.id, nombre: a.nombre, sector: a.sector, reasons } : null;
      })
      .filter(Boolean);
  }, [asociadas]);

  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const mapped = await fetchAsociadas();
      if (mapped) {
        setAsociadas(mapped);
        setLastUpdated(Date.now());
      }
    } finally {
      refreshing.current = false;
    }
  }, [fetchAsociadas]);

  return (
    <AsociadasContext.Provider value={{ asociadas, loading, addAsociada, updateAsociada, deleteAsociada, getAsociada, getSectores, findDuplicates, refresh, lastUpdated }}>
      {children}
    </AsociadasContext.Provider>
  );
}

export function useAsociadasContext() {
  const ctx = useContext(AsociadasContext);
  if (!ctx) throw new Error("useAsociadasContext must be used within AsociadasProvider");
  return ctx;
}
