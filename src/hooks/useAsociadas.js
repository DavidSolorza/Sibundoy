import { useState } from "react";
import data from "../data/asociadas";

export default function useAsociadas() {
  const [asociadas, setAsociadas] = useState(data);

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

  return {
    asociadas,
    addAsociada,
    updateAsociada,
    deleteAsociada,
    getAsociada,
    getSectores,
  };
}
