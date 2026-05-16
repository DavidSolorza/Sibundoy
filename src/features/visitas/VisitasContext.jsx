/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import useAsociadas from "../asociadas/useAsociadas";
import seedVisitas from "./visitas.data";

const STORAGE_KEY = "sibundoy_visitas";
const DATA_VERSION = 2;

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed._version === DATA_VERSION) return parsed.items;
    }
  } catch { /* ignore */ }
  return null;
}

function saveData(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ _version: DATA_VERSION, items }));
  } catch { /* ignore */ }
}

const VisitasContext = createContext(null);

export function VisitasProvider({ children }) {
  const { asociadas } = useAsociadas();
  const init = loadData();
  const [visitas, setVisitas] = useState(() => init || []);
  const seededRef = useRef(!!init);

  useEffect(() => {
    if (seededRef.current || asociadas.length === 0) return;
    seededRef.current = true;
    setVisitas(seedVisitas(asociadas));
  }, [asociadas]);

  useEffect(() => {
    if (seededRef.current && visitas.length > 0) saveData(visitas);
  }, [visitas]);

  const addVisita = useCallback((visita) => {
    setVisitas((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((v) => v.id)) + 1 : 1;
      return [{ ...visita, id: newId }, ...prev];
    });
  }, []);

  const editVisita = useCallback((id, data) => {
    setVisitas((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  }, []);

  const deleteVisita = useCallback((id) => {
    setVisitas((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const getVisitasByAsociada = useCallback((asociadaId) => {
    return visitas.filter((v) => v.asociadaId === asociadaId).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [visitas]);

  const getProximasVisitas = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return visitas.filter((v) => v.proximaVisita && v.proximaVisita >= today)
      .sort((a, b) => new Date(a.proximaVisita) - new Date(b.proximaVisita));
  }, [visitas]);

  return (
    <VisitasContext.Provider value={{ visitas, addVisita, editVisita, deleteVisita, getVisitasByAsociada, getProximasVisitas }}>
      {children}
    </VisitasContext.Provider>
  );
}

export function useVisitasContext() {
  const ctx = useContext(VisitasContext);
  if (!ctx) throw new Error("useVisitasContext must be used within VisitasProvider");
  return ctx;
}
