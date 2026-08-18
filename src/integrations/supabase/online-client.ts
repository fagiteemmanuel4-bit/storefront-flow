import { createClient } from "@supabase/supabase-js";
import type { OnlineDatabase } from "./online-types";

const url = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];

if (!url || !key) {
  throw new Error("Missing Supabase environment variables");
}

export const onlineSupabase = createClient<OnlineDatabase>(url, key, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
