import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Rolle, Therapeut } from "./rollen";

export type Sitzung = {
  userId: string;
  email: string | null;
  name: string;
  rolle: Rolle;
  therapeut: Therapeut | null;
  standorte: { id: string; code: string; name: string }[];
};

/**
 * Prueft die Anmeldung und laedt Rolle, Therapeuten-Datensatz und
 * die Standorte, die diese Person sehen darf.
 */
export async function sitzungLaden(erlaubt: Rolle[], anmeldeMarke?: "schlossanger"): Promise<Sitzung> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({
      to: "/anmelden",
      search: anmeldeMarke ? { marke: anmeldeMarke } : {},
    });
  }

  const [rollen, therapeut, profil, standorte] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", data.user.id),
    supabase
      .from("practitioners")
      .select("id, name, kuerzel, farbe, ist_leitung")
      .eq("user_id", data.user.id)
      .maybeSingle(),
    supabase.from("profiles").select("name").eq("id", data.user.id).maybeSingle(),
    supabase.from("locations").select("id, code, name").eq("aktiv", true).order("sortierung"),
  ]);

  const gefunden = (rollen.data ?? []).map((r: any) => r.role as Rolle);
  const rolle: Rolle =
    gefunden.find((r) => r === "verwaltung") ??
    gefunden.find((r) => r === "therapeut") ??
    gefunden.find((r) => r === "rezeption") ??
    "patient";

  if (!erlaubt.includes(rolle)) {
    throw redirect({ to: "/", search: {} });
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    name: (profil.data as any)?.name || data.user.email || "",
    rolle,
    therapeut: (therapeut.data as Therapeut) ?? null,
    standorte: (standorte.data ?? []) as { id: string; code: string; name: string }[],
  };
}

export async function abmelden() {
  await supabase.auth.signOut();
  window.location.href = "/anmelden";
}
