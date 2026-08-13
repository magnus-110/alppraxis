const ZEITZONE = "Europe/Berlin";

export const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function zeit(wert: string | Date) {
  return new Date(wert).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZEITZONE,
  });
}

export function datum(wert: string | Date) {
  return new Date(wert).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ZEITZONE,
  });
}

export function datumLang(wert: string | Date) {
  return new Date(wert).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: ZEITZONE,
  });
}

export function datumZeit(wert: string | Date) {
  return `${datum(wert)}, ${zeit(wert)} Uhr`;
}

/** YYYY-MM-DD in deutscher Zeit */
export function isoTag(d: Date) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: ZEITZONE }).format(d);
}

export function tageAddieren(d: Date, tage: number) {
  const neu = new Date(d);
  neu.setDate(neu.getDate() + tage);
  return neu;
}

export function montagDerWoche(d: Date) {
  const neu = new Date(d);
  const tag = (neu.getDay() + 6) % 7;
  neu.setDate(neu.getDate() - tag);
  neu.setHours(0, 0, 0, 0);
  return neu;
}

export function initialen(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((t) => t[0]?.toUpperCase() ?? "")
    .join("");
}
