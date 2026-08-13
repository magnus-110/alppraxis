/**
 * E-Mail-Versand – vorbereitet, aber noch nicht mit einem Anbieter verbunden.
 *
 * Alle E-Mails an Gäste werden zuerst in der Tabelle email_protokoll vorgemerkt
 * (Status "vorgemerkt"). Diese Funktion baut daraus den fertigen Text.
 *
 * Ohne RESEND_API_KEY wird nichts verschickt: Der Eintrag bekommt den Status
 * "bereit" und den fertigen Text als Meldung. So lässt sich in der App genau
 * sehen, was verschickt würde.
 *
 * Sobald der Schlüssel gesetzt ist (Supabase → Edge Functions → Secrets),
 * verschickt dieselbe Funktion die E-Mails wirklich – ohne Codeänderung.
 *
 * Datenschutz: In den Texten stehen niemals Diagnosen oder Behandlungsinhalte.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Eintrag = {
  id: string;
  art: string;
  empfaenger: string;
  betreff: string | null;
  bezug_id: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: offen, error } = await supabase
    .from("email_protokoll")
    .select("id, art, empfaenger, betreff, bezug_id")
    .eq("status", "vorgemerkt")
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ fehler: error.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const { data: praxis } = await supabase.from("practice_settings").select("*").eq("id", 1).single();
  const schluessel = Deno.env.get("RESEND_API_KEY");
  const absender = praxis?.email_absender
    ? `${praxis.email_absender_name ?? "Alppraxis"} <${praxis.email_absender}>`
    : null;

  let verschickt = 0;
  let vorbereitet = 0;

  for (const eintrag of (offen ?? []) as Eintrag[]) {
    const text = await textBauen(supabase, eintrag, praxis);

    if (!schluessel || !absender || !praxis?.email_aktiv) {
      await supabase
        .from("email_protokoll")
        .update({ status: "bereit", meldung: text })
        .eq("id", eintrag.id);
      vorbereitet++;
      continue;
    }

    const antwort = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${schluessel}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: absender,
        to: [eintrag.empfaenger],
        subject: eintrag.betreff ?? "Nachricht aus der Alppraxis",
        text,
      }),
    });

    await supabase
      .from("email_protokoll")
      .update({
        status: antwort.ok ? "gesendet" : "fehler",
        meldung: antwort.ok ? text : await antwort.text(),
        gesendet_am: antwort.ok ? new Date().toISOString() : null,
      })
      .eq("id", eintrag.id);

    if (antwort.ok) verschickt++;
  }

  return new Response(JSON.stringify({ verschickt, vorbereitet }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});

async function textBauen(supabase: any, eintrag: Eintrag, praxis: any): Promise<string> {
  const fuss = [
    "",
    "Herzliche Grüße",
    praxis?.inhaberin ?? "Katrin Kaufmann",
    praxis?.praxis_name ?? "Alppraxis",
    [praxis?.strasse, [praxis?.plz, praxis?.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    praxis?.telefon ?? "",
  ].join("\n");

  if (eintrag.art === "anfrage_absage") {
    return [
      "Guten Tag,",
      "",
      "vielen Dank für Deine Terminanfrage. Leider können wir zum gewünschten Zeitpunkt",
      "keinen Termin anbieten. Melde Dich gerne telefonisch – oft findet sich doch noch etwas.",
      fuss,
    ].join("\n");
  }

  const { data: termin } = await supabase
    .from("appointments")
    .select("start, ende, treatment_types(name), practitioners(name), locations(name, strasse, plz, ort)")
    .eq("id", eintrag.bezug_id)
    .maybeSingle();

  if (!termin) return "Nachricht aus der Alppraxis.";

  const start = new Date(termin.start);
  const wann = start.toLocaleString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });

  const ort = [
    termin.locations?.name,
    termin.locations?.strasse,
    [termin.locations?.plz, termin.locations?.ort].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  if (eintrag.art === "termin_absage") {
    return [
      "Guten Tag,",
      "",
      `Dein Termin am ${wann} Uhr musste leider abgesagt werden.`,
      "Melde Dich gerne bei uns, dann finden wir einen neuen Zeitpunkt.",
      fuss,
    ].join("\n");
  }

  const einleitung =
    eintrag.art === "anfrage_zusage"
      ? "gerne konnten wir Deine Anfrage einrichten. Wir haben folgenden Termin für Dich reserviert:"
      : "wir haben Deinen Termin notiert:";

  return [
    "Guten Tag,",
    "",
    einleitung,
    "",
    `${wann} Uhr`,
    termin.treatment_types?.name ?? "",
    termin.practitioners?.name ? `bei ${termin.practitioners.name}` : "",
    ort,
    "",
    "Solltest Du den Termin nicht wahrnehmen können, sag uns bitte rechtzeitig Bescheid.",
    fuss,
  ]
    .filter((z) => z !== null)
    .join("\n");
}
