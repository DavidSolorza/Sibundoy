/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabase";

const AsociadasContext = createContext(null);

function toFrontend(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    edad: row.edad,
    telefono: row.telefono,
    numPersonas: row.num_personas,
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
    edad: data.edad,
    telefono: data.telefono || null,
    num_personas: data.numPersonas,
    sector_id: sectorId,
    area_huerta: data.areaHuerta || null,
    productos: data.productos || null,
    fecha_siembra: data.fechaSiembra || null,
    fecha_ultima_visita: data.fechaUltimaVisita || null,
    num_visitas: data.numVisitas || 0,
    tipo_persona: data.tipoPersona || null,
    observaciones: data.observaciones || null,
    lat: data.lat || null,
    lng: data.lng || null,
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

  useEffect(() => {
    supabase
      .from("asociadas")
      .select("*, sectores(nombre)")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error cargando asociadas:", error.message);
          setLoading(false);
          return;
        }
        const mapped = (data || []).map((row) => {
          const { sectores, ...rest } = row;
          return toFrontend({ ...rest, sector: sectores?.nombre || "" });
        });
        setAsociadas(mapped);
        setLoading(false);
      });
  }, []);

  const addAsociada = useCallback(async (data) => {
    const sectorId = sectorMap[data.sector];
    if (!sectorId) throw new Error(`Sector "${data.sector}" no encontrado`);

    const { data: newRow, error } = await supabase
      .from("asociadas")
      .insert(toDB(data, sectorId))
      .select("*, sectores(nombre)")
      .single();

    if (error) throw error;

    const { sectores, ...rest } = newRow;
    const mapped = toFrontend({ ...rest, sector: sectores?.nombre || "" });
    setAsociadas((prev) => [...prev, mapped]);
    return mapped;
  }, [sectorMap]);

  const updateAsociada = useCallback(async (id, data) => {
    const sectorId = data.sector ? sectorMap[data.sector] : undefined;

    const { error } = await supabase
      .from("asociadas")
      .update(toDB(data, sectorId))
      .eq("id", id);

    if (error) throw error;

    setAsociadas((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }, [sectorMap]);

  const deleteAsociada = useCallback(async (id) => {
    const { error } = await supabase.from("asociadas").delete().eq("id", id);
    if (error) throw error;
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

  return (
    <AsociadasContext.Provider value={{ asociadas, loading, addAsociada, updateAsociada, deleteAsociada, getAsociada, getSectores }}>
      {children}
    </AsociadasContext.Provider>
  );
}

export function useAsociadasContext() {
  const ctx = useContext(AsociadasContext);
  if (!ctx) throw new Error("useAsociadasContext must be used within AsociadasProvider");
  return ctx;
}
