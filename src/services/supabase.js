import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY. " +
    "Copia .env.example a .env y completa los valores."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
