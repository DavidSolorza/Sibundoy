import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const MOCK_RESULT = { data: null, error: { message: "Supabase no configurado" } };

function mockQueryBuilder() {
  const handler = {
    get(_, prop) {
      if (prop === "then") return (resolve) => Promise.resolve(resolve(MOCK_RESULT));
      if (prop === "single") return () => mockQueryBuilder();
      return () => mockQueryBuilder();
    },
  };
  return new Proxy(() => {}, handler);
}

function createMockClient() {
  const qb = mockQueryBuilder();
  return {
    from: () => ({
      select: () => qb,
      insert: () => qb,
      update: () => qb,
      delete: () => qb,
    }),
  };
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : (console.warn("⚠️ Supabase no configurado. Copia .env.example a .env con tus credenciales."), createMockClient());
