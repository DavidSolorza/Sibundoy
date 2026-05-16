/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import data from "./asociadas.data";

const STORAGE_KEY = "sibundoy_asociadas";
const DATA_VERSION = 3;

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed._version === DATA_VERSION) return parsed.items;
    }
  } catch { /* ignore */ }
  return data;
}

function saveData(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ _version: DATA_VERSION, items }));
  } catch { /* ignore */ }
}

const AsociadasContext = createContext(null);

export function AsociadasProvider({ children }) {
  const [asociadas, setAsociadas] = useState(loadData);

  useEffect(() => { saveData(asociadas); }, [asociadas]);

  const addAsociada = (asociada) => {
    const newId = asociadas.length > 0 ? Math.max(...asociadas.map((a) => a.id)) + 1 : 1;
    setAsociadas([...asociadas, { ...asociada, id: newId }]);
  };

  const updateAsociada = (id, updatedData) => {
    setAsociadas(asociadas.map((a) => (a.id === id ? { ...a, ...updatedData } : a)));
  };

  const deleteAsociada = (id) => {
    setAsociadas(asociadas.filter((a) => a.id !== id));
  };

  const getAsociada = (id) => asociadas.find((a) => a.id === id);

  const getSectores = () => {
    const sectores = {};
    asociadas.forEach((a) => {
      if (!sectores[a.sector]) sectores[a.sector] = [];
      sectores[a.sector].push(a);
    });
    return sectores;
  };

  return (
    <AsociadasContext.Provider value={{ asociadas, addAsociada, updateAsociada, deleteAsociada, getAsociada, getSectores }}>
      {children}
    </AsociadasContext.Provider>
  );
}

export function useAsociadasContext() {
  const ctx = useContext(AsociadasContext);
  if (!ctx) throw new Error("useAsociadasContext must be used within AsociadasProvider");
  return ctx;
}
