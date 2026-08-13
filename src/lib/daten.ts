import { supabase } from "@/integrations/supabase/client";

/* ============================================================
   Fachliche Typen
   ============================================================ */

export type Standort = {
  id: string;
  code: string;
  name: string;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  hinweis: string | null;
  oeffentlich_buchbar: boolean;
  aktiv: boolean;
  sortierung: number;
};

export type Behandlungsart = {
  id: string;
  name: string;
  kurztext: string | null;
  beschreibung: string | null;
  kategorie: "physiotherapie" | "naturheilkunde" | "wellness";
  dauer_minuten: number;
  preis: number | null;
  sichtbar_website_praxis: boolean;
  sichtbar_website_hotel: boolean;
  sichtbar_rezeption: boolean;
  online_buchbar: boolean;
  aktiv: boolean;
  sortierung: number;
};

export type FreieZeit = {
  start: string;
  ende: string;
  practitioner_id: string;
  practitioner_name: string;
  rang: number;
};

export type Termin = {
  id: string;
  patient_id: string | null;
  location_id: string;
  practitioner_id: string;
  treatment_type_id: string | null;
  start: string;
  ende: string;
  status: "gebucht" | "wahrgenommen" | "abgesagt" | "nicht_erschienen";
  quelle: "website_praxis" | "website_hotel" | "rezeption" | "praxis";
  anliegen: string | null;
  notiz_intern: string | null;
  ist_intern: boolean;
  prescription_id: string | null;
  abgerechnet: boolean;
};

export type Anfrage = {
  id: string;
  location_id: string;
  patient_id: string | null;
  treatment_type_id: string | null;
  name: string | null;
  email: string | null;
  telefon: string | null;
  hotel_zimmer: string | null;
  wunsch_datum: string;
  wunsch_von: string | null;
  wunsch_bis: string | null;
  flexibel: boolean;
  anliegen: string | null;
  status: "offen" | "zugesagt" | "abgelehnt" | "zurueckgezogen";
  created_at: string;
  entschieden_am: string | null;
  entscheidung_notiz: string | null;
};

export type Patient = {
  id: string;
  anrede: string | null;
  vorname: string;
  nachname: string;
  email: string | null;
  telefon: string | null;
  geburtsdatum: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  ist_hotelgast: boolean;
  hotel_zimmer: string | null;
  notizen: string | null;
};

export type Rezept = {
  id: string;
  patient_id: string;
  nummer: string | null;
  ausstellender_arzt: string | null;
  ausstellungsdatum: string | null;
  gueltig_bis: string | null;
  diagnose: string | null;
  heilmittel: string | null;
  einheiten_gesamt: number;
  dauer_minuten: number;
  hausbesuch: boolean;
  status: "aktiv" | "abgeschlossen" | "abgelaufen";
  notiz: string | null;
  einheiten_genutzt?: number;
  einheiten_offen?: number;
  naechster_termin?: string | null;
  vorname?: string;
  nachname?: string;
};

export type Gebuehrenziffer = {
  id: string;
  ziffer: string;
  beschreibung: string;
  einzelbetrag: number;
  aktiv: boolean;
  sortierung: number;
};

export type Rechnung = {
  id: string;
  rechnungsnummer: string | null;
  patient_id: string;
  datum: string;
  faelligkeitsdatum: string | null;
  betrag: number;
  bezahlt: number;
  status: "offen" | "bezahlt" | "ueberfaellig" | "storniert";
  empfaenger_anrede: string | null;
  empfaenger_name: string | null;
  empfaenger_strasse: string | null;
  empfaenger_plz: string | null;
  empfaenger_ort: string | null;
  ust_hinweis: string | null;
  freitext: string | null;
};

export type Rechnungsposten = {
  id: string;
  invoice_id: string;
  appointment_id: string | null;
  fee_code_id: string | null;
  ziffer: string | null;
  bezeichnung: string;
  behandlungsdatum: string | null;
  anzahl: number;
  einzelbetrag: number;
  betrag: number;
  sortierung: number;
};

/* ============================================================
   Abfragen
   ============================================================ */

export async function standorteLaden(nurCodes: string[] = []) {
  let q = supabase.from("locations").select("*").eq("aktiv", true).order("sortierung");
  if (nurCodes.length > 0) q = q.in("code", nurCodes);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Standort[];
}

export async function behandlungsartenLaden(opts: {
  standortId?: string;
  kanal?: "website_praxis" | "website_hotel" | "rezeption" | "praxis";
}) {
  const { data, error } = await supabase
    .from("treatment_types")
    .select("*, treatment_type_locations(location_id)")
    .eq("aktiv", true)
    .order("sortierung");
  if (error) throw error;

  const spalte =
    opts.kanal === "website_hotel"
      ? "sichtbar_website_hotel"
      : opts.kanal === "rezeption"
        ? "sichtbar_rezeption"
        : opts.kanal === "website_praxis"
          ? "sichtbar_website_praxis"
          : null;

  return (data ?? [])
    .filter((t: any) => (spalte ? t[spalte] : true))
    .filter((t: any) => (opts.kanal && opts.kanal !== "praxis" ? t.online_buchbar : true))
    .filter((t: any) => {
      if (!opts.standortId) return true;
      const zuordnung = t.treatment_type_locations ?? [];
      if (zuordnung.length === 0) return true;
      return zuordnung.some((z: any) => z.location_id === opts.standortId);
    }) as Behandlungsart[];
}

export async function freieZeitenLaden(args: {
  standortId: string;
  behandlungsartId: string;
  von: string;
  bis: string;
  therapeutId?: string | null;
}) {
  const { data, error } = await supabase.rpc("freie_zeiten", {
    _location_id: args.standortId,
    _treatment_type_id: args.behandlungsartId,
    _von: args.von,
    _bis: args.bis,
    _practitioner_id: args.therapeutId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as FreieZeit[];
}

export type BuchungsDaten = {
  standortId: string;
  behandlungsartId: string;
  start: string;
  anrede?: string | null;
  vorname: string;
  nachname: string;
  email?: string | null;
  telefon?: string | null;
  quelle: "website_praxis" | "website_hotel" | "rezeption" | "praxis";
  therapeutId?: string | null;
  anliegen?: string | null;
  hotelZimmer?: string | null;
  patientId?: string | null;
};

export async function terminBuchen(d: BuchungsDaten) {
  const { data, error } = await supabase.rpc("termin_buchen", {
    _location_id: d.standortId,
    _treatment_type_id: d.behandlungsartId,
    _start: d.start,
    _anrede: d.anrede ?? null,
    _vorname: d.vorname,
    _nachname: d.nachname,
    _email: d.email ?? null,
    _telefon: d.telefon ?? null,
    _quelle: d.quelle,
    _practitioner_id: d.therapeutId ?? null,
    _anliegen: d.anliegen ?? null,
    _hotel_zimmer: d.hotelZimmer ?? null,
    _patient_id: d.patientId ?? null,
  });
  if (error) throw error;
  const treffer = Array.isArray(data) ? data[0] : data;
  return treffer as {
    appointment_id: string;
    patient_id: string;
    practitioner_name: string;
    start: string;
    ende: string;
  };
}

export async function anfrageStellen(d: {
  standortId: string;
  behandlungsartId: string | null;
  wunschDatum: string;
  wunschVon: string | null;
  wunschBis: string | null;
  name: string;
  email: string | null;
  telefon: string | null;
  hotelZimmer?: string | null;
  anliegen?: string | null;
  flexibel?: boolean;
  patientId?: string | null;
}) {
  const { data, error } = await supabase.rpc("anfrage_stellen", {
    _location_id: d.standortId,
    _treatment_type_id: d.behandlungsartId,
    _wunsch_datum: d.wunschDatum,
    _wunsch_von: d.wunschVon,
    _wunsch_bis: d.wunschBis,
    _name: d.name,
    _email: d.email,
    _telefon: d.telefon,
    _hotel_zimmer: d.hotelZimmer ?? null,
    _anliegen: d.anliegen ?? null,
    _flexibel: d.flexibel ?? true,
    _patient_id: d.patientId ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function anfrageEntscheiden(d: {
  anfrageId: string;
  zusage: boolean;
  therapeutId?: string | null;
  start?: string | null;
  dauerMinuten?: number | null;
  notiz?: string | null;
}) {
  const { data, error } = await supabase.rpc("anfrage_entscheiden", {
    _request_id: d.anfrageId,
    _zusage: d.zusage,
    _practitioner_id: d.therapeutId ?? null,
    _start: d.start ?? null,
    _dauer_minuten: d.dauerMinuten ?? null,
    _notiz: d.notiz ?? null,
  });
  if (error) throw error;
  return data as string | null;
}

export async function terminAbsagen(terminId: string, grund?: string) {
  const { error } = await supabase.rpc("termin_absagen", {
    _appointment_id: terminId,
    _grund: grund ?? null,
  });
  if (error) throw error;
}

export async function therapeutenLaden() {
  const { data, error } = await supabase
    .from("practitioners")
    .select("id, name, kuerzel, farbe, ist_leitung, aktiv, sortierung, practitioner_locations(location_id)")
    .eq("aktiv", true)
    .order("sortierung");
  if (error) throw error;
  return data ?? [];
}

export async function terminePeriode(vonISO: string, bisISO: string, standortId?: string) {
  let q = supabase
    .from("appointments")
    .select(
      "*, patients(id, vorname, nachname, telefon, email, hotel_zimmer), treatment_types(name, dauer_minuten), practitioners(name, farbe, kuerzel), locations(code, name)",
    )
    .gte("start", vonISO)
    .lt("start", bisISO)
    .neq("status", "abgesagt")
    .order("start");
  if (standortId) q = q.eq("location_id", standortId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function offeneAnfragen() {
  const { data, error } = await supabase
    .from("requests")
    .select("*, treatment_types(name, dauer_minuten), locations(code, name), patients(vorname, nachname)")
    .eq("status", "offen")
    .order("wunsch_datum");
  if (error) throw error;
  return data ?? [];
}

export async function patientenSuchen(suche: string) {
  let q = supabase.from("patients").select("*").order("nachname").limit(50);
  if (suche.trim()) {
    const s = `%${suche.trim()}%`;
    q = q.or(`vorname.ilike.${s},nachname.ilike.${s},email.ilike.${s},telefon.ilike.${s}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Patient[];
}
