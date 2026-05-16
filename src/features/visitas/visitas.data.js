const tipos = ["visita", "seguimiento", "capacitacion"];
const observaciones = [
  "Revisión general de la huerta. Buen estado.",
  "Se aplicó abono orgánico. Cultivos en crecimiento.",
  "Capacitación en control de plagas. Asistencia completa.",
  "Seguimiento de siembra. Todo en orden.",
  "Recomendación de sistema de riego. Pendiente implementar.",
  "Cosecha exitosa. Se registró producción.",
  "Se entregaron semillas de tomate y lechuga.",
  "Taller de compostaje. Participación activa.",
  "Revisión de suelo. Se recomienda abono nitrogenado.",
  "Visita de rutina. Huerta en mantenimiento.",
];

function generarVisitas(asociadas) {
  const visitas = [];
  let id = 1;
  const today = new Date();

  asociadas.forEach((a) => {
    const numVisitas = a.numVisitas || 1;
    const ultimaFecha = new Date(a.fechaUltimaVisita);

    for (let i = 0; i < numVisitas; i++) {
      const fecha = new Date(ultimaFecha);
      fecha.setDate(fecha.getDate() - i * 20);

      const prox = new Date(fecha);
      prox.setDate(prox.getDate() + 30 + (a.id % 5) * 7);

      visitas.push({
        id: id++,
        asociadaId: a.id,
        fecha: fecha.toISOString().split("T")[0],
        tipo: tipos[i % tipos.length],
        observaciones: observaciones[(a.id + i) % observaciones.length],
        proximaVisita: prox > today ? prox.toISOString().split("T")[0] : null,
      });
    }
  });

  return visitas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export default function seedVisitas(asociadas) {
  return generarVisitas(asociadas);
}
