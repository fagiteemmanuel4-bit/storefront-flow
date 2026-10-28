// Supabase browser client.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config";

function isPublishableKey(value: string): boolean {
  // Legacy JWT anon keys are also safe in the browser; modern secret keys are not.
  return value.startsWith("sb_publishable_") || value.startsWith("eyJ");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (!isPublishableKey(supabaseKey)) {
      throw new Error("Strap is configured with an invalid browser Supabase key. Use the publishable/anon key only.");
    }

    if (supabaseKey.startsWith("sb_publishable_") && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  const url = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || SUPABASE_URL;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"] || SUPABASE_PUBLISHABLE_KEY;

  if (typeof window !== "undefined" && !isPublishableKey(key)) {
    throw new Error("Strap browser configuration is invalid: a Supabase secret key must never be exposed to the client.");
  }

  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
