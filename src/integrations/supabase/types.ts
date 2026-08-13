/**
 * Locker gehaltene Typdefinition, damit der Supabase-Client funktioniert.
 * Die fachlichen Typen stehen in src/lib/daten.ts.
 *
 * Wer die exakten Typen aus der Datenbank erzeugen moechte:
 *   npx supabase gen types typescript --project-id cbrunatvbazchnadsars > src/integrations/supabase/types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type Tabelle = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: Record<string, Tabelle>;
    Views: Record<string, Tabelle>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: any }>;
    Enums: {
      app_role: "verwaltung" | "therapeut" | "rezeption" | "patient";
      termin_status: "gebucht" | "wahrgenommen" | "abgesagt" | "nicht_erschienen";
      termin_quelle: "website_praxis" | "website_hotel" | "rezeption" | "praxis";
      anfrage_status: "offen" | "zugesagt" | "abgelehnt" | "zurueckgezogen";
      verfuegbarkeit_typ: "offen" | "geschlossen";
      rechnung_status: "offen" | "bezahlt" | "ueberfaellig" | "storniert";
      rezept_status: "aktiv" | "abgeschlossen" | "abgelaufen";
      behandlung_kategorie: "physiotherapie" | "naturheilkunde" | "wellness";
    };
    CompositeTypes: Record<string, never>;
  };
};
