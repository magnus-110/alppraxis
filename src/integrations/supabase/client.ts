import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function istNeuerSchluessel(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function supabaseFetch(schluessel: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (istNeuerSchluessel(schluessel) && headers.get("Authorization") === `Bearer ${schluessel}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", schluessel);
    return fetch(input, { ...init, headers });
  };
}

function clientErzeugen() {
  const URL_ = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const KEY = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!URL_ || !KEY) {
    throw new Error(
      "Die Zugangsdaten für Supabase fehlen. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_PUBLISHABLE_KEY in .env eintragen.",
    );
  }

  return createClient<Database>(URL_, KEY, {
    global: { fetch: supabaseFetch(KEY) },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _client: ReturnType<typeof clientErzeugen> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof clientErzeugen>, {
  get(_, prop, receiver) {
    if (!_client) _client = clientErzeugen();
    return Reflect.get(_client, prop, receiver);
  },
});
