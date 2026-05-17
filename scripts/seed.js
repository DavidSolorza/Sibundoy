import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ldjfktngqkkfpevhlmvc.supabase.co";
const supabaseKey = "sb_publishable_0g26dR4acyRi_s4mCBAn-w_K-z0Fl8G";
const supabase = createClient(supabaseUrl, supabaseKey);

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

const tiposPersona = ["Casada", "Madre Cabeza De Hogar", "Viuda", "Separada"];
const tiposVisita = ["visita", "seguimiento", "capacitacion"];

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

const productosPorSector = {
  "Cabecera Municipal": "Tiendas, Comercio, Servicios, Artesanías, Comida",
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

const { data: sectores } = await supabase.from("sectores").select("id, nombre, lat_base, lng_base");
const sectorMap = {};
sectores.forEach((s) => { sectorMap[s.nombre] = s; });

console.log(`Insertando ${nombres.length} asociadas...`);

for (let idx = 0; idx < nombres.length; idx++) {
  const sectorNombres = Object.keys(sectorMap);
  const sectorNombre = sectorNombres[idx % sectorNombres.length];
  const sector = sectorMap[sectorNombre];

  const latBase = sector.lat_base;
  const lngBase = sector.lng_base;
  const latFinal = Number((latBase + (((idx) % 7) - 3) * 0.002).toFixed(4));
  const lngFinal = Number((lngBase + (Math.floor((idx) / 7.0) - 2) * 0.002).toFixed(4));

  const { data: asociada, error } = await supabase
    .from("asociadas")
    .insert({
      nombre: nombres[idx],
      edad: 25 + (idx % 28),
      telefono: telefonos[idx % 10],
      num_personas: 2 + (idx % 4),
      sector_id: sector.id,
      area_huerta: `${20 + (idx % 7) * 10} m²`,
      productos: productosPorSector[sectorNombre],
      fecha_siembra: new Date(2025, 2, 21 - (60 + idx * 3)).toISOString().split("T")[0],
      fecha_ultima_visita: new Date(2025, 2, 21 - (5 + (idx % 30))).toISOString().split("T")[0],
      num_visitas: 1 + (idx % 6),
      tipo_persona: tiposPersona[idx % tiposPersona.length],
      observaciones: observaciones[idx % 10],
      lat: latFinal,
      lng: lngFinal,
    })
    .select()
    .single();

  if (error) {
    console.error(`Error insertando ${nombres[idx]}:`, error.message);
    continue;
  }

  const numVisitas = 1 + (idx % 6);
  for (let v = 0; v < numVisitas; v++) {
    const vFecha = new Date(2025, 2, 21 - v * 20).toISOString().split("T")[0];
    const vProx = new Date(new Date(vFecha).getTime() + (30 + (idx % 5) * 7) * 86400000).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    await supabase.from("visitas").insert({
      asociada_id: asociada.id,
      fecha: vFecha,
      tipo: tiposVisita[v % 3],
      observaciones: observaciones[(idx + v) % 10],
      proxima_visita: vProx > today ? vProx : null,
    });
  }

  if ((idx + 1) % 10 === 0) console.log(`  ${idx + 1}/${nombres.length}...`);
}

console.log("Seed completado!");
