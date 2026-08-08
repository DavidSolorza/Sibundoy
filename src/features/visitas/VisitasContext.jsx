/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../core/http/api";
import { toFrontendVisita, toBackendVisita } from "../../shared/utils/normalizer";
import { io } from "socket.io-client";

const VisitasContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:5000";

export function VisitasProvider({ children }) {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshing = useRef(false);

  const fetchVisitas = useCallback(async () => {
    try {
      const res = await api.getVisitas();
      const items = Array.isArray(res) ? res : (res.data || []);
      return items.map(toFrontendVisita);
    } catch (error) {
      console.error("Error cargando visitas:", error.message);
      return null;
    }
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
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Conectado en tiempo real al backend (Visitas)");
    });

    socket.on("visita-inserted", (data) => {
      const mapped = toFrontendVisita(data);
      setVisitas((prev) => {
        const idx = prev.findIndex((v) => v.id === mapped.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = mapped;
          return next;
        }
        return [mapped, ...prev];
      });
    });

    socket.on("visita-updated", (data) => {
      const mapped = toFrontendVisita(data);
      setVisitas((prev) => prev.map((v) => (v.id === mapped.id ? mapped : v)));
    });

    socket.on("visita-deleted", (data) => {
      setVisitas((prev) => prev.filter((v) => v.id !== data.id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addVisita = useCallback(async (visita) => {
    const backendData = toBackendVisita(visita);
    const res = await api.createVisita(backendData);
    // api.js already unwraps { data: [...] } -> firstOrNull -> object
    const mapped = toFrontendVisita(Array.isArray(res) ? res[0] : res);
    setVisitas((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const editVisita = useCallback(async (id, data) => {
    const backendData = toBackendVisita(data);
    await api.updateVisita(id, backendData);
    setVisitas((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  }, []);

  const marcarRealizada = useCallback(async (id) => {
    const visita = visitas.find(v => v.id === id);
    if (!visita) return;
    // PUT requires full object — send existing data with realizada = true
    const backendData = toBackendVisita({ ...visita, realizada: true });
    await api.updateVisita(id, backendData);
    setVisitas((prev) => prev.map((v) => (v.id === id ? { ...v, realizada: true } : v)));
  }, [visitas]);

  const deleteVisita = useCallback(async (id) => {
    await api.deleteVisita(id);
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
      .filter((v) => v.fecha >= today && !v.realizada)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [visitas]);

  return (
    <VisitasContext.Provider value={{ visitas, loading, addVisita, editVisita, deleteVisita, marcarRealizada, getVisitasByAsociada, getProximasVisitas, refresh, lastUpdated }}>
      {children}
    </VisitasContext.Provider>
  );
}

export function useVisitasContext() {
  const ctx = useContext(VisitasContext);
  if (!ctx) throw new Error("useVisitasContext must be used within VisitasProvider");
  return ctx;
}
