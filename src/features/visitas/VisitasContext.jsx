/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabase";

const VisitasContext = createContext(null);

function toFrontend(row) {
  return {
    id: row.id,
    asociadaId: row.asociada_id,
    fecha: row.fecha,
    tipo: row.tipo,
    observaciones: row.observaciones || "",
    proximaVisita: row.proxima_visita || null,
  };
}

function toDB(data) {
  return {
    asociada_id: data.asociadaId,
    fecha: data.fecha,
    tipo: data.tipo,
    observaciones: data.observaciones || null,
    proxima_visita: data.proximaVisita || null,
  };
}

export function VisitasProvider({ children }) {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("visitas")
      .select("*")
      .order("fecha", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error cargando visitas:", error.message);
          setLoading(false);
          return;
        }
        setVisitas((data || []).map(toFrontend));
        setLoading(false);
      });
  }, []);

  const addVisita = useCallback(async (visita) => {
    const { data: newRow, error } = await supabase
      .from("visitas")
      .insert(toDB(visita))
      .select()
      .single();

    if (error) throw error;

    const mapped = toFrontend(newRow);
    setVisitas((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const editVisita = useCallback(async (id, data) => {
    const { error } = await supabase
      .from("visitas")
      .update(toDB(data))
      .eq("id", id);

    if (error) throw error;

    setVisitas((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  }, []);

  const deleteVisita = useCallback(async (id) => {
    const { error } = await supabase.from("visitas").delete().eq("id", id);
    if (error) throw error;
    setVisitas((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const getVisitasByAsociada = useCallback((asociadaId) => {
    return visitas
      .filter((v) => v.asociadaId === asociadaId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [visitas]);

  const getProximasVisitas = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return visitas
      .filter((v) => v.proximaVisita && v.proximaVisita >= today)
      .sort((a, b) => new Date(a.proximaVisita) - new Date(b.proximaVisita));
  }, [visitas]);

  return (
    <VisitasContext.Provider value={{ visitas, loading, addVisita, editVisita, deleteVisita, getVisitasByAsociada, getProximasVisitas }}>
      {children}
    </VisitasContext.Provider>
  );
}

export function useVisitasContext() {
  const ctx = useContext(VisitasContext);
  if (!ctx) throw new Error("useVisitasContext must be used within VisitasProvider");
  return ctx;
}
