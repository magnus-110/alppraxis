import { datum, euro } from "./format";

export type PraxisDaten = {
  praxis_name: string;
  inhaberin: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  telefon: string | null;
  email: string | null;
  steuernummer: string | null;
  bank_inhaber: string | null;
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
  ust_hinweis: string | null;
  zahlungsziel_tage: number;
};

export type RechnungDaten = {
  rechnungsnummer: string;
  datum: string;
  faelligkeitsdatum: string | null;
  betrag: number;
  empfaenger_anrede: string | null;
  empfaenger_name: string | null;
  empfaenger_strasse: string | null;
  empfaenger_plz: string | null;
  empfaenger_ort: string | null;
  ust_hinweis: string | null;
  freitext: string | null;
};

export type PostenDaten = {
  behandlungsdatum: string | null;
  ziffer: string | null;
  bezeichnung: string;
  anzahl: number;
  einzelbetrag: number;
  betrag: number;
};

/**
 * Druckfertige Rechnung als HTML im DIN-A4-Format.
 * Wird im Browser geöffnet und dort über "Drucken" als PDF gespeichert –
 * so ist kein zusätzlicher Dienst nötig und nichts verlässt die eigene Umgebung.
 */
export function rechnungHtml(
  praxis: PraxisDaten,
  rechnung: RechnungDaten,
  posten: PostenDaten[],
): string {
  const zeilen = posten
    .map(
      (p) => `<tr>
        <td>${p.behandlungsdatum ? datum(p.behandlungsdatum) : ""}</td>
        <td>${p.ziffer ?? ""}</td>
        <td>${escape_(p.bezeichnung)}</td>
        <td class="r">${p.anzahl}</td>
        <td class="r">${euro.format(p.einzelbetrag)}</td>
        <td class="r">${euro.format(p.betrag)}</td>
      </tr>`,
    )
    .join("");

  const absender = [
    praxis.praxis_name,
    praxis.strasse,
    [praxis.plz, praxis.ort].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" · ");

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<title>Rechnung ${escape_(rechnung.rechnungsnummer)}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #27343a; font-size: 10.5pt; line-height: 1.5; }
  .kopf { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 28mm; }
  .kopf h1 { font-size: 15pt; margin: 0 0 2px; color: #4e6772; letter-spacing: .02em; }
  .kopf .klein { font-size: 8.5pt; color: #6b7c83; }
  .absender { font-size: 7.5pt; color: #6b7c83; border-bottom: .5pt solid #dce4e6; padding-bottom: 2px; margin-bottom: 6px; }
  .anschrift { min-height: 30mm; }
  .meta { margin: 10mm 0 6mm; display: flex; justify-content: space-between; }
  h2 { font-size: 13pt; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6mm; }
  th { text-align: left; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .06em;
       color: #6b7c83; border-bottom: .8pt solid #27343a; padding: 4px 6px; }
  td { padding: 5px 6px; border-bottom: .4pt solid #dce4e6; vertical-align: top; }
  td.r, th.r { text-align: right; }
  .summe { margin-top: 4mm; display: flex; justify-content: flex-end; }
  .summe table { width: auto; min-width: 70mm; }
  .summe td { border: 0; padding: 3px 6px; }
  .summe .gesamt td { border-top: .8pt solid #27343a; font-weight: bold; font-size: 12pt; padding-top: 6px; }
  .hinweis { margin-top: 8mm; font-size: 9.5pt; }
  footer { position: fixed; bottom: 0; left: 0; right: 0; font-size: 7.5pt; color: #6b7c83;
           border-top: .4pt solid #dce4e6; padding-top: 4px; display: flex; justify-content: space-between; gap: 12px; }
  @media screen { body { max-width: 210mm; margin: 0 auto; padding: 20mm 18mm 40mm; } }
</style></head>
<body>
  <div class="kopf">
    <div>
      <h1>${escape_(praxis.praxis_name)}</h1>
      <div class="klein">${escape_(praxis.inhaberin ?? "")}</div>
    </div>
    <div class="klein" style="text-align:right">
      ${escape_(praxis.strasse ?? "")}<br>
      ${escape_([praxis.plz, praxis.ort].filter(Boolean).join(" "))}<br>
      ${escape_(praxis.telefon ?? "")}<br>
      ${escape_(praxis.email ?? "")}
    </div>
  </div>

  <div class="anschrift">
    <div class="absender">${escape_(absender)}</div>
    ${escape_(rechnung.empfaenger_anrede ?? "")}<br>
    <strong>${escape_(rechnung.empfaenger_name ?? "")}</strong><br>
    ${escape_(rechnung.empfaenger_strasse ?? "")}<br>
    ${escape_([rechnung.empfaenger_plz, rechnung.empfaenger_ort].filter(Boolean).join(" "))}
  </div>

  <div class="meta">
    <h2>Rechnung ${escape_(rechnung.rechnungsnummer)}</h2>
    <div class="klein" style="text-align:right">
      Datum: ${datum(rechnung.datum)}<br>
      ${rechnung.faelligkeitsdatum ? `Zahlbar bis: ${datum(rechnung.faelligkeitsdatum)}` : ""}
    </div>
  </div>

  ${rechnung.freitext ? `<p>${escape_(rechnung.freitext)}</p>` : ""}

  <table>
    <thead><tr>
      <th style="width:20mm">Datum</th>
      <th style="width:18mm">Ziffer</th>
      <th>Leistung</th>
      <th class="r" style="width:14mm">Anz.</th>
      <th class="r" style="width:22mm">Einzel</th>
      <th class="r" style="width:24mm">Betrag</th>
    </tr></thead>
    <tbody>${zeilen}</tbody>
  </table>

  <div class="summe"><table><tbody>
    <tr class="gesamt"><td>Gesamtbetrag</td><td class="r">${euro.format(rechnung.betrag)}</td></tr>
  </tbody></table></div>

  <div class="hinweis">
    <p>${escape_(rechnung.ust_hinweis ?? praxis.ust_hinweis ?? "")}</p>
    <p>Bitte überweise den Betrag innerhalb von ${praxis.zahlungsziel_tage} Tagen auf das unten genannte Konto
       und gib dabei die Rechnungsnummer an. Vielen Dank.</p>
  </div>

  <footer>
    <span>${escape_(praxis.praxis_name)} · ${escape_(praxis.strasse ?? "")} · ${escape_([praxis.plz, praxis.ort].filter(Boolean).join(" "))}</span>
    <span>${escape_(praxis.bank_inhaber ?? "")} · ${escape_(praxis.iban ?? "")} · ${escape_(praxis.bic ?? "")}</span>
    <span>${praxis.steuernummer ? "St.-Nr. " + escape_(praxis.steuernummer) : ""}</span>
  </footer>

  <script>window.addEventListener("load", function(){ setTimeout(function(){ window.print(); }, 300); });</script>
</body></html>`;
}

function escape_(text: string) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function rechnungDrucken(html: string) {
  const fenster = window.open("", "_blank", "width=900,height=1200");
  if (!fenster) return false;
  fenster.document.write(html);
  fenster.document.close();
  return true;
}
