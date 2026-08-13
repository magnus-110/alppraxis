export type Rolle = "verwaltung" | "therapeut" | "rezeption" | "patient";

export const rollenLabel: Record<Rolle, string> = {
  verwaltung: "Praxisleitung",
  therapeut: "Therapeutin oder Therapeut",
  rezeption: "Rezeption Hotel",
  patient: "Patientin oder Patient",
};

/** Wo die jeweilige Rolle nach der Anmeldung landet. */
export const startseite: Record<Rolle, string> = {
  verwaltung: "/praxis/heute",
  therapeut: "/praxis/heute",
  rezeption: "/rezeption",
  patient: "/",
};

export type Therapeut = {
  id: string;
  name: string;
  kuerzel: string | null;
  farbe: string;
  ist_leitung: boolean;
};
