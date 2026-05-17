/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshing = useRef(false);

  const fetchVisitas = useCallback(async () => {
    const { data, error } = await supabase
      .from("visitas")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error cargando visitas:", error.message);
      return null;
    }
    return (data || []).map(toFrontend);
  }, []);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const mapped = await fetchVisitas();
      if (mapped) {
        setVisitas(mapped);
        setLastUpdated(Date.now());
      }
    } finally {
      refreshing.current = false;
    }
  }, [fetchVisitas]);

  useEffect(() => {
    fetchVisitas().then((mapped) => {
      if (mapped) {
        setVisitas(mapped);
        setLastUpdated(Date.now());
      }
      setLoading(false);
    });
  }, [fetchVisitas]);

  useEffect(() => {
    const id = setInterval(async () => {
      const mapped = await fetchVisitas();
      if (mapped) setVisitas(mapped);
    }, 15000);

    return () => clearInterval(id);
  }, [fetchVisitas]);

  useEffect(() => {
    const channel = supabase
      .channel("visitas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visitas" },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setVisitas((prev) => prev.filter((v) => v.id !== payload.old.id));
            return;
          }

          const { data, error } = await supabase
            .from("visitas")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (error || !data) return;

          const mapped = toFrontend(data);

          setVisitas((prev) => {
            const idx = prev.findIndex((v) => v.id === mapped.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = mapped;
              return next;
            }
            return [mapped, ...prev];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addVisita = useCallback(async (visita) => {
    const { data: newRow, error } = await supabase
      .from("visitas")
      .insert(toDB(visita))
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(error.message);
    }

    const mapped = toFrontend(newRow);
    setVisitas((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const editVisita = useCallback(async (id, data) => {
    const { error } = await supabase
      .from("visitas")
      .update(toDB(data))
      .eq("id", id);

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(error.message);
    }

    setVisitas((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  }, []);

  const deleteVisita = useCallback(async (id) => {
    const { error } = await supabase.from("visitas").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(error.message);
    }
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
    <VisitasContext.Provider value={{ visitas, loading, addVisita, editVisita, deleteVisita, getVisitasByAsociada, getProximasVisitas, refresh, lastUpdated }}>
      {children}
    </VisitasContext.Provider>
  );
}

export function useVisitasContext() {
  const ctx = useContext(VisitasContext);
  if (!ctx) throw new Error("useVisitasContext must be used within VisitasProvider");
  return ctx;
}
