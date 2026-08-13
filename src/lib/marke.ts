/**
 * Zwei Oberflaechen, eine Datenbasis.
 * Hier stehen alle sichtbaren Texte und Bilder je Marke an einer Stelle.
 * Farben und Schriften liegen in src/styles.css.
 */

export type MarkeSchluessel = "alppraxis" | "schlossanger";

export type Marke = {
  schluessel: MarkeSchluessel;
  name: string;
  titel: string;
  untertitel: string;
  logo: string;
  logoAlt: string;
  bild: string;
  telefon: string;
  email: string;
  website: string;
  /** Standorte, die in dieser Oberflaeche sichtbar sind. Leer = alle. */
  standorte: string[];
  duzen: boolean;
};

export const MARKEN: Record<MarkeSchluessel, Marke> = {
  alppraxis: {
    schluessel: "alppraxis",
    name: "Alppraxis",
    titel: "Termin vereinbaren",
    untertitel:
      "Privatpraxis für Physiotherapie und Naturheilkunde in Pfronten und Roßhaupten.",
    logo: "https://static.wixstatic.com/media/e7e474_e18f1d0a000b488cbe9b2c47a8e5a2b8~mv2.png/v1/fill/w_379,h_208,al_c,lg_1,q_85,enc_avif,quality_auto/Neues%20Logo%20Alppraxis_edited.png",
    logoAlt: "Alppraxis",
    bild: "https://static.wixstatic.com/media/11062b_c0e21e358f59438ba4159e3c2574c45bf000.jpg/v1/fill/w_1200,h_560,al_c,q_85,enc_avif,quality_auto/bergpanorama.jpg",
    // PLATZHALTER bis Telefon, E-Mail und Domain der Praxis feststehen
    telefon: "+49 8363 91 4550",
    email: "termin@alppraxis-platzhalter.de",
    website: "https://www.alppraxis.com",
    standorte: [],
    duzen: true,
  },
  schlossanger: {
    schluessel: "schlossanger",
    name: "ALPPRAXIS im SCHLOSSANGER",
    titel: "Behandlungstermin reservieren",
    untertitel:
      "Physiotherapie, Naturheilkunde und Wellness im ALP SPA – sieben Tage die Woche.",
    logo: "https://www.schlossanger.de/wp-content/uploads/logo-1.png",
    logoAlt: "SCHLOSSANGER ALP",
    bild: "https://www.schlossanger.de/wp-content/uploads/alppraxis.jpg",
    telefon: "+49 8363 91 4550",
    email: "info@schlossanger.de",
    website: "https://www.schlossanger.de/wellnesshotel-allgaeu/alppraxis/",
    standorte: ["pfronten"],
    duzen: true,
  },
};

export function markeAus(wert: string | undefined | null): Marke {
  return wert === "schlossanger" ? MARKEN.schlossanger : MARKEN.alppraxis;
}
