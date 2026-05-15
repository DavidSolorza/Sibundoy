const sectores = ["Sector A", "Sector B", "Sector C", "Sector D", "Sector E"];

const nombres = [
  "María López", "Ana Martínez", "Carmen García", "Rosa Pérez", "Lucía Ramírez",
  "Sofía Torres", "Elena Vargas", "Laura Mendoza", "Patricia Ríos", "Diana Castro",
  "Martha Jiménez", "Claudia Ortiz", "Verónica Ruiz", "Silvia Herrera", "Gloria Medina",
  "Teresa Vega", "Ruth Silva", "Liliana Peña", "Beatriz Campos", "Julia Delgado",
  "Adriana Flores", "Carolina Mora", "Gabriela Rivas", "Isabel Acosta", "Marina Guzmán",
  "Angélica Cruz", "Paola Navarro", "Raquel Salazar", "Natalia Paredes", "Andrea Lozano",
  "Yolanda Rojas", "Esperanza Gil", "Luisa Sandoval", "Rocío Chávez", "Inés Molina",
  "Cecilia Roldán", "Elsa Cárdenas", "Olga Fuentes", "Alicia Bravo", "Berta Tovar",
  "Amanda Vega", "Sara Pineda", "Mónica Espinoza", "Manuela Cordero", "Leticia Arenas",
];

const telefonos = [
  "3101234567", "3107654321", "3209876543", "3204567890", "3112345678",
  "3123456789", "3134567890", "3145678901", "3156789012", "3167890123",
];

const productosPorSector = {
  "Sector A": "Tomate, Cebolla, Lechuga, Maíz, Yuca",
  "Sector B": "Zanahoria, Papa, Fríjol, Arveja, Habas",
  "Sector C": "Espinaca, Acelga, Brócoli, Coliflor, Apio",
  "Sector D": "Pimentón, Repollo, Cilantro, Perejil, Lechuga",
  "Sector E": "Plátano, Yuca, Ñame, Batata, Malanga",
};

const observaciones = [
  "Huerta en buen estado",
  "Necesita abono orgánico",
  "Producción excelente",
  "Control de plagas necesario",
  "Sistema de riego recomendado",
  "Cosecha próxima",
  "Suelo en preparación",
  "Requiere capacitación técnica",
  "Implementando compostaje",
  "Buen manejo del cultivo",
];

function generarFechaSiembra(index) {
  const diasAtras = 60 + index * 3;
  const fecha = new Date("2025-03-21");
  fecha.setDate(fecha.getDate() - diasAtras);
  return fecha.toISOString().split("T")[0];
}

function generarFechaVisita(index) {
  const diasAtras = Math.floor(Math.random() * 30) + 5;
  const fecha = new Date("2025-03-21");
  fecha.setDate(fecha.getDate() - diasAtras);
  return fecha.toISOString().split("T")[0];
}

function generarCoordenadas(sector, index) {
  const bases = {
    "Sector A": { lat: 1.203, lng: -76.920 },
    "Sector B": { lat: 1.205, lng: -76.922 },
    "Sector C": { lat: 1.207, lng: -76.924 },
    "Sector D": { lat: 1.201, lng: -76.918 },
    "Sector E": { lat: 1.209, lng: -76.926 },
  };
  const base = bases[sector];
  return {
    lat: +(base.lat + (index % 7 - 3) * 0.002).toFixed(4),
    lng: +(base.lng + (Math.floor(index / 7) - 2) * 0.002).toFixed(4),
  };
}

const asociadas = nombres.map((nombre, i) => {
  const sector = sectores[i % sectores.length];
  const coord = generarCoordenadas(sector, i);
  return {
    id: i + 1,
    nombre,
    edad: 25 + (i % 28),
    telefono: telefonos[i % telefonos.length],
    numPersonas: 2 + (i % 4),
    sector,
    areaHuerta: `${20 + (i % 7) * 10} m²`,
    productos: productosPorSector[sector],
    fechaSiembra: generarFechaSiembra(i),
    fechaUltimaVisita: generarFechaVisita(i),
    numVisitas: 1 + (i % 6),
    observaciones: observaciones[i % observaciones.length],
    ...coord,
  };
});

export default asociadas;
