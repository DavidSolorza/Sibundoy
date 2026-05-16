import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function createMockClient() {
  const mock = () => Promise.resolve({ data: null, error: { message: "Supabase no configurado" } });
  return { from: () => ({ select: mock, insert: mock, update: mock, delete: mock, order: () => ({ then: mock }), eq: () => ({ then: mock }), single: mock }) };
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : (console.warn("⚠️ Supabase no configurado. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY."), createMockClient());
