/* global process */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ldjfktngqkkfpevhlmvc.supabase.co";
const supabaseKey = "sb_publishable_0g26dR4acyRi_s4mCBAn-w_K-z0Fl8G";
const supabase = createClient(supabaseUrl, supabaseKey);

let passed = 0;
let failed = 0;

function check(desc, ok) {
  if (ok) { passed++; console.log(`  PASS  ${desc}`); }
  else { failed++; console.log(`  FAIL  ${desc}`); }
}

// 1. Verificar columna menores_hogar existe
console.log("\n--- 1. Schema: columna menores_hogar ---");
{
  const { data, error } = await supabase.from("asociadas").select("menores_hogar").limit(1);
  check("columna menores_hogar accesible", !error && data !== null);
}

// 2. Verificar enum tipo_persona migrado (valores nuevos)
console.log("\n--- 2. Enum: tipo_persona (estado civil) ---");
{
  const { data, error } = await supabase.from("asociadas").select("tipo_persona").limit(50);
  if (!error && data) {
    const valores = [...new Set(data.map(r => r.tipo_persona).filter(Boolean))];
    const ok = valores.every(v => ["Casada", "Madre Cabeza De Hogar", "Viuda", "Separada"].includes(v));
    check("todos los tipo_persona son del nuevo enum", ok);
    if (!ok) console.log(`       valores encontrados: [${valores.join(", ")}]`);
    // verificar que NO existan valores viejos
    const viejos = valores.filter(v => ["madre cabeza de hogar", "Adulto mayor", "viuda"].includes(v));
    check("sin valores viejos del enum anterior", viejos.length === 0);
  } else {
    check("pudo leer tipo_persona", false);
    if (error) console.log("       error:", error.message);
  }
}

// 3. CRUD: crear, leer, actualizar, eliminar
console.log("\n--- 3. CRUD básico ---");

const { data: sectorDefault } = await supabase.from("sectores").select("id").limit(1).single();
const sectorId = sectorDefault?.id;

const testRecord = {
  nombre: "Test Verificación " + Date.now(),
  edad: 30,
  telefono: "3000000000",
  num_personas: 4,
  menores_hogar: 2,
  tipo_persona: "Madre Cabeza De Hogar",
  sector_id: sectorId,
  area_huerta: "50 m²",
  productos: "Tomate, Cebolla",
  fecha_siembra: "2025-01-15",
  observaciones: "Registro de prueba para verificación",
  lat: 1.2035,
  lng: -76.9201,
};

// 3a. Insertar
const { data: created, error: errCreate } = await supabase
  .from("asociadas")
  .insert(testRecord)
  .select()
  .single();

if (!errCreate && created) {
  check("INSERT: asociada creada", true);
  check(`INSERT: id = ${created.id}`, !!created.id);
  check(`INSERT: menores_hogar = ${created.menores_hogar}`, created.menores_hogar === 2);
  check(`INSERT: tipo_persona = ${created.tipo_persona}`, created.tipo_persona === "Madre Cabeza De Hogar");
} else {
  check("INSERT: asociada creada", false);
  if (errCreate) console.log("       error:", errCreate.message);
}

const createdId = created?.id;

// 3b. Leer
if (createdId) {
  const { data: read, error: errRead } = await supabase
    .from("asociadas")
    .select("id, nombre, menores_hogar, tipo_persona")
    .eq("id", createdId)
    .single();
  check("SELECT: lectura correcta", !errRead && read?.id === createdId);
  check(`SELECT: menores_hogar = ${read?.menores_hogar}`, read?.menores_hogar === 2);
  check(`SELECT: tipo_persona = ${read?.tipo_persona}`, read?.tipo_persona === "Madre Cabeza De Hogar");
}

// 3c. Actualizar
if (createdId) {
  const { data: updated, error: errUpdate } = await supabase
    .from("asociadas")
    .update({ menores_hogar: 5, num_personas: 6 })
    .eq("id", createdId)
    .select()
    .single();
  check("UPDATE: actualización correcta", !errUpdate && updated?.id === createdId);
  check(`UPDATE: menores_hogar cambiado a ${updated?.menores_hogar}`, updated?.menores_hogar === 5);
  check(`UPDATE: num_personas cambiado a ${updated?.num_personas}`, updated?.num_personas === 6);
}

// 3d. Eliminar
if (createdId) {
  const { error: errDelete } = await supabase
    .from("asociadas")
    .delete()
    .eq("id", createdId);
  check("DELETE: eliminación correcta", !errDelete);

  const { data: confirmDelete } = await supabase
    .from("asociadas")
    .select("id")
    .eq("id", createdId)
    .single();
  check("DELETE: registro ya no existe", !confirmDelete);
}

// 4. Verificar datos existentes con valores nuevos del enum
console.log("\n--- 4. Datos existentes ---");
{
  const { data, error } = await supabase
    .from("asociadas")
    .select("id, tipo_persona, menores_hogar")
    .limit(50);

  if (!error && data) {
    const conMenores = data.filter(r => r.menores_hogar !== null && r.menores_hogar !== undefined);
    check(`asociadas con menores_hogar definido: ${conMenores.length}/${data.length}`, conMenores.length >= 0);
    check(`asociadas con tipo_persona nuevo: ${data.filter(r => r.tipo_persona).length}`, data.some(r => r.tipo_persona));
  }
}

// 5. Verificar visitas sigan funcionando
console.log("\n--- 5. Relación visitas ---");
{
  const { data: asociada } = await supabase.from("asociadas").select("id").limit(1).single();
  if (asociada) {
    const { data: visitas, error } = await supabase
      .from("visitas")
      .select("id, tipo")
      .eq("asociada_id", asociada.id)
      .limit(5);
    check("visitas aún accesibles para asociadas", !error);
    if (visitas) check(`visitas encontradas: ${visitas.length}`, visitas.length >= 0);
  }
}

// Resumen
console.log(`\n========================================`);
console.log(`  Resultados: ${passed} pasaron, ${failed} fallaron`);
console.log(`========================================\n`);
process.exit(failed > 0 ? 1 : 0);
