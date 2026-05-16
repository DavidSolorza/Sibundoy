const sectores = [
  "El Municipio",
  "Vereda Bellavista", "Vereda Cabrera", "Vereda Cabuyayaco",
  "Vereda Campoalegre", "Vereda El Cedro", "Vereda El Ejido",
  "Vereda Fátima Carrizayaco", "Vereda La Cumbre",
  "Vereda Las Cochas", "Vereda Leandro Agreda", "Vereda Llano Grande",
  "Vereda Machindinoy", "Vereda Palmas",
  "Vereda Sagrado Corazón de Jesús", "Vereda San Félix Sinsayaco",
  "Vereda San José la Hidráulica", "Vereda Tamabioy",
  "Vereda Villaflor"
];

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
  "El Municipio": "Tiendas, Comercio, Servicios, Artesanías, Comida",
  "Vereda Bellavista": "Tomate, Cebolla, Lechuga, Pimentón, Repollo",
  "Vereda Cabrera": "Papa, Maíz, Fríjol, Arveja, Habas",
  "Vereda Cabuyayaco": "Yuca, Plátano, Ñame, Caña, Cacao",
  "Vereda Campoalegre": "Zanahoria, Papa, Fríjol, Arveja, Habichuela",
  "Vereda El Cedro": "Madera, Café, Plátano, Yuca, Maíz",
  "Vereda El Ejido": "Fresa, Mora, Lulo, Granadilla, Curuba",
  "Vereda Fátima Carrizayaco": "Café, Cacao, Caña, Plátano, Yuca",
  "Vereda La Cumbre": "Papa, Habas, Arveja, Maíz, Cebolla",
  "Vereda Las Cochas": "Espinaca, Acelga, Brócoli, Coliflor, Apio",
  "Vereda Leandro Agreda": "Café, Cacao, Caña, Plátano, Yuca",
  "Vereda Llano Grande": "Plátano, Yuca, Ñame, Batata, Malanga",
  "Vereda Machindinoy": "Maíz, Fríjol, Calabaza, Pepino, Lechuga",
  "Vereda Palmas": "Pimentón, Repollo, Cilantro, Perejil, Tomate",
  "Vereda Sagrado Corazón de Jesús": "Fresa, Mora, Granadilla, Lulo, Curuba",
  "Vereda San Félix Sinsayaco": "Tomate, Cebolla, Lechuga, Maíz, Yuca",
  "Vereda San José la Hidráulica": "Zanahoria, Papa, Fríjol, Arveja, Habas",
  "Vereda Tamabioy": "Caña, Plátano, Yuca, Cacao, Café",
  "Vereda Villaflor": "Zanahoria, Papa, Fríjol, Arveja, Habas",
};

const tiposPersona = ["madre cabeza de hogar", "Adulto mayor", "viuda"];

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

function generarFechaVisita() {
  const diasAtras = Math.floor(Math.random() * 30) + 5;
  const fecha = new Date("2025-03-21");
  fecha.setDate(fecha.getDate() - diasAtras);
  return fecha.toISOString().split("T")[0];
}

function generarCoordenadas(sector, index) {
  const bases = {
    "El Municipio": { lat: 1.2035, lng: -76.919 },
    "Vereda Bellavista": { lat: 1.238, lng: -76.942 },
    "Vereda Cabrera": { lat: 1.182, lng: -76.905 },
    "Vereda Cabuyayaco": { lat: 1.170, lng: -76.928 },
    "Vereda Campoalegre": { lat: 1.210, lng: -76.916 },
    "Vereda El Cedro": { lat: 1.200, lng: -76.930 },
    "Vereda El Ejido": { lat: 1.183, lng: -76.925 },
    "Vereda Fátima Carrizayaco": { lat: 1.198, lng: -76.905 },
    "Vereda La Cumbre": { lat: 1.195, lng: -76.895 },
    "Vereda Las Cochas": { lat: 1.172, lng: -76.918 },
    "Vereda Leandro Agreda": { lat: 1.158, lng: -76.935 },
    "Vereda Llano Grande": { lat: 1.168, lng: -76.938 },
    "Vereda Machindinoy": { lat: 1.195, lng: -76.925 },
    "Vereda Palmas": { lat: 1.188, lng: -76.935 },
    "Vereda Sagrado Corazón de Jesús": { lat: 1.187, lng: -76.920 },
    "Vereda San Félix Sinsayaco": { lat: 1.166, lng: -76.915 },
    "Vereda San José la Hidráulica": { lat: 1.206, lng: -76.908 },
    "Vereda Tamabioy": { lat: 1.175, lng: -76.898 },
    "Vereda Villaflor": { lat: 1.215, lng: -76.925 },
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
    tipoPersona: tiposPersona[i % tiposPersona.length],
    ...coord,
  };
});

export default asociadas;
