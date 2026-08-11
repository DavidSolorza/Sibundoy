/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../core/http/api";
import { toFrontendAsociada, toBackendAsociada } from "../../shared/utils/normalizer";
import { io } from "socket.io-client";

const AsociadasContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:5000";

export function AsociadasProvider({ children }) {
  const [asociadas, setAsociadas] = useState([]);
  const [sectorMap, setSectorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshing = useRef(false);

  const socketConnectedRef = useRef(false);

  useEffect(() => {
    api.getSectores()
      .then((res) => {
        const map = {};
        const items = Array.isArray(res) ? res : (res?.data || []);
        items.forEach((s) => { if (s?.nombre && s?.id) map[s.nombre] = s.id; });
        setSectorMap(map);
      })
      .catch((err) => console.error("Error cargando sectores:", err.message));
  }, []);

  const fetchAsociadas = useCallback(async () => {
    try {
      const res = await api.getAsociadas();
      const items = Array.isArray(res) ? res : (res?.data || []);
      return items.map(toFrontendAsociada).filter(Boolean);
    } catch (error) {
      console.error("Error cargando asociadas:", error.message);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchAsociadas().then((mapped) => {
      if (mapped) {
        setAsociadas(mapped);
        setLastUpdated(Date.now());
      }
      setLoading(false);
    });
  }, [fetchAsociadas]);

  // Polling como fallback solo si los WebSockets están desconectados
  useEffect(() => {
    const id = setInterval(async () => {
      if (socketConnectedRef.current) return; // Omitir polling si hay socket activo
      const mapped = await fetchAsociadas();
      if (mapped) setAsociadas(mapped);
    }, 15000);
    return () => clearInterval(id);
  }, [fetchAsociadas]);

  // Sockets
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socketConnectedRef.current = true;
      console.log("Conectado en tiempo real al backend (Asociadas)");
    });

    socket.on("disconnect", () => {
      socketConnectedRef.current = false;
      console.warn("Desconectado de tiempo real, activando fallback de polling (Asociadas)");
    });

    socket.on("custom-insert", (payload) => {
      if (payload?.table !== "asociadas" || !payload.new) return;
      const mapped = toFrontendAsociada(payload.new);
      if (!mapped) return;
      setAsociadas((prev) => {
        const idx = prev.findIndex((a) => a.id === mapped.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = mapped;
          return next;
        }
        return [...prev, mapped];
      });
    });

    socket.on("custom-update", (payload) => {
      if (payload?.table !== "asociadas" || !payload.new) return;
      const mapped = toFrontendAsociada(payload.new);
      if (!mapped) return;
      setAsociadas((prev) => prev.map(a => a.id === mapped.id ? mapped : a));
    });

    socket.on("custom-delete", (payload) => {
      if (payload?.table !== "asociadas" || !payload.old?.id) return;
      setAsociadas((prev) => prev.filter((a) => a.id !== payload.old.id));
    });

    return () => {
      socketConnectedRef.current = false;
      socket.disconnect();
    };
  }, []);

  const addAsociada = useCallback(async (data) => {
    let sectorId = sectorMap[data.sector];
    if (!sectorId) {
      try {
        const sectorRes = await api.createSector({ nombre: data.sector });
        if (sectorRes?.id) {
          sectorId = sectorRes.id;
          setSectorMap(prev => ({ ...prev, [data.sector]: sectorId }));
        }
      } catch (err) {
        console.error("Error al crear sector:", err);
      }
    }

    const backendData = toBackendAsociada({ ...data, sectorId });
    const res = await api.createAsociada(backendData);
    const mapped = toFrontendAsociada(res);
    if (!mapped) {
      throw new Error("No se pudo procesar la asociada creada");
    }
    setAsociadas((prev) => [...prev, mapped]);
    return mapped;
  }, [sectorMap]);

  const updateAsociada = useCallback(async (id, data) => {
    let sectorId = undefined;
    if (data.sector !== undefined) {
      if (data.sector === "" || data.sector === null) {
        sectorId = null;
      } else {
        sectorId = sectorMap[data.sector];
        if (!sectorId) {
          try {
            const sectorRes = await api.createSector({ nombre: data.sector });
            sectorId = (sectorRes.data || sectorRes).id;
            setSectorMap(prev => ({ ...prev, [data.sector]: sectorId }));
          } catch (err) {
            console.error("Error al crear sector:", err);
            sectorId = null;
          }
        }
      }
    }

    const backendData = toBackendAsociada({ ...data, sectorId });
    if (backendData.sector_id === undefined) delete backendData.sector_id;

    await api.updateAsociada(id, backendData);
    
    // Optimizamos en memoria asumiendo éxito
    setAsociadas((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }, [sectorMap]);

  const deleteAsociada = useCallback(async (id) => {
    await api.deleteAsociada(id);
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
