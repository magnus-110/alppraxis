import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { datum, euro } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabelle, Kopf, Zeile, Th, Td } from "@/components/ui/tabelle";

export const Route = createFileRoute("/praxis/rechnung-neu/$patientId")({
  ssr: false,
  component: Seite,
});

type Posten = {
  appointment_id: string | null;
  fee_code_id: string | null;
  ziffer: string | null;
  bezeichnung: string;
  behandlungsdatum: string | null;
  anzahl: number;
  einzelbetrag: number;
};

function Seite() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const [posten, setPosten] = useState<Posten[]>([]);
  const [freitext, setFreitext] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", patientId).single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: termine } = useQuery({
    queryKey: ["termine-offen", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, treatment_types(name, preis)")
        .eq("patient_id", patientId)
        .eq("abgerechnet", false)
        .in("status", ["gebucht", "wahrgenommen"])
        .lte("start", new Date().toISOString())
        .order("start");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: ziffern } = useQuery({
    queryKey: ["gebuehrenziffern"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_codes")
        .select("*")
        .eq("aktiv", true)
        .order("sortierung");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: praxis } = useQuery({
    queryKey: ["praxisdaten"],
    queryFn: async () => {
      const { data, error } = await supabase.from("practice_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as any;
    },
  });

  const summe = useMemo(
    () => posten.reduce((s, p) => s + p.anzahl * p.einzelbetrag, 0),
    [posten],
  );

  function terminUebernehmen(t: any) {
    if (posten.some((p) => p.appointment_id === t.id)) return;
    setPosten([
      ...posten,
      {
        appointment_id: t.id,
        fee_code_id: null,
        ziffer: null,
        bezeichnung: t.treatment_types?.name ?? "Behandlung",
        behandlungsdatum: String(t.start).slice(0, 10),
        anzahl: 1,
        einzelbetrag: Number(t.treatment_types?.preis ?? 0),
      },
    ]);
  }

  function zifferHinzu(id: string) {
    const z = (ziffern ?? []).find((x: any) => x.id === id);
    if (!z) return;
    setPosten([
      ...posten,
      {
        appointment_id: null,
        fee_code_id: z.id,
        ziffer: z.ziffer,
        bezeichnung: z.beschreibung,
        behandlungsdatum: null,
        anzahl: 1,
        einzelbetrag: Number(z.einzelbetrag),
      },
    ]);
  }

  async function erstellen() {
    if (posten.length === 0) {
      toast.error("Bitte mindestens eine Leistung auswählen.");
      return;
    }
    setLaeuft(true);
    try {
      const { data: nummer, error: nrFehler } = await supabase.rpc("naechste_rechnungsnummer");
      if (nrFehler) throw nrFehler;

      const heute = new Date();
      const faellig = new Date(heute);
      faellig.setDate(faellig.getDate() + (praxis?.zahlungsziel_tage ?? 14));

      const { data: rechnung, error } = await supabase
        .from("invoices")
        .insert({
          rechnungsnummer: nummer,
          patient_id: patientId,
          datum: heute.toISOString().slice(0, 10),
          faelligkeitsdatum: faellig.toISOString().slice(0, 10),
          empfaenger_anrede: patient?.anrede ?? null,
          empfaenger_name: `${patient?.vorname ?? ""} ${patient?.nachname ?? ""}`.trim(),
          empfaenger_strasse: patient?.strasse ?? null,
          empfaenger_plz: patient?.plz ?? null,
          empfaenger_ort: patient?.ort ?? null,
          ust_hinweis: praxis?.ust_hinweis ?? null,
          freitext: freitext || null,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: postenFehler } = await supabase.from("invoice_items").insert(
        posten.map((p, i) => ({ ...p, invoice_id: (rechnung as any).id, sortierung: i })),
      );
      if (postenFehler) throw postenFehler;

      toast.success(`Rechnung ${nummer} erstellt.`);
      navigate({ to: "/praxis/rechnungen" });
    } catch (e: any) {
      toast.error(String(e?.message ?? "Das hat nicht geklappt."));
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl">
        Rechnung für {patient?.vorname} {patient?.nachname}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Die Termine stehen bereits im Kalender – hier wird nur ausgewählt, was auf die Rechnung soll.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Noch nicht abgerechnete Termine</CardTitle>
              <CardDescription>Ein Klick übernimmt den Termin in die Rechnung.</CardDescription>
            </CardHeader>
            <Tabelle>
              <Kopf>
                <tr>
                  <Th>Datum</Th>
                  <Th>Behandlung</Th>
                  <Th className="text-right">Preis</Th>
                  <Th />
                </tr>
              </Kopf>
              <tbody>
                {(termine ?? []).map((t: any) => (
                  <Zeile key={t.id}>
                    <Td>{datum(t.start)}</Td>
                    <Td>{t.treatment_types?.name}</Td>
                    <Td className="text-right">
                      {t.treatment_types?.preis ? euro.format(t.treatment_types.preis) : "—"}
                    </Td>
                    <Td className="text-right">
                      <Button size="sm" variant="outline" onClick={() => terminUebernehmen(t)}>
                        <Plus /> Übernehmen
                      </Button>
                    </Td>
                  </Zeile>
                ))}
              </tbody>
            </Tabelle>
            {(termine ?? []).length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">Alles abgerechnet.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rechnungsposten</CardTitle>
            </CardHeader>
            <Tabelle>
              <Kopf>
                <tr>
                  <Th>Datum</Th>
                  <Th>Ziffer</Th>
                  <Th>Leistung</Th>
                  <Th>Anzahl</Th>
                  <Th>Einzel</Th>
                  <Th className="text-right">Betrag</Th>
                  <Th />
                </tr>
              </Kopf>
              <tbody>
                {posten.map((p, i) => (
                  <Zeile key={i}>
                    <Td>
                      <Input
                        type="date"
                        className="h-8 w-36"
                        value={p.behandlungsdatum ?? ""}
                        onChange={(e) => {
                          const neu = [...posten];
                          neu[i] = { ...p, behandlungsdatum: e.target.value };
                          setPosten(neu);
                        }}
                      />
                    </Td>
                    <Td>
                      <Input
                        className="h-8 w-20"
                        value={p.ziffer ?? ""}
                        onChange={(e) => {
                          const neu = [...posten];
                          neu[i] = { ...p, ziffer: e.target.value };
                          setPosten(neu);
                        }}
                      />
                    </Td>
                    <Td>
                      <Input
                        className="h-8"
                        value={p.bezeichnung}
                        onChange={(e) => {
                          const neu = [...posten];
                          neu[i] = { ...p, bezeichnung: e.target.value };
                          setPosten(neu);
                        }}
                      />
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        step="0.5"
                        className="h-8 w-20"
                        value={p.anzahl}
                        onChange={(e) => {
                          const neu = [...posten];
                          neu[i] = { ...p, anzahl: Number(e.target.value) };
                          setPosten(neu);
                        }}
                      />
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 w-24"
                        value={p.einzelbetrag}
                        onChange={(e) => {
                          const neu = [...posten];
                          neu[i] = { ...p, einzelbetrag: Number(e.target.value) };
                          setPosten(neu);
                        }}
                      />
                    </Td>
                    <Td className="text-right">{euro.format(p.anzahl * p.einzelbetrag)}</Td>
                    <Td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPosten(posten.filter((_, j) => j !== i))}
                      >
                        <Trash2 />
                      </Button>
                    </Td>
                  </Zeile>
                ))}
              </tbody>
            </Tabelle>
            <CardContent className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="ziffer">Gebührenziffer hinzufügen</Label>
                <Select
                  id="ziffer"
                  className="w-64"
                  value=""
                  onChange={(e) => e.target.value && zifferHinzu(e.target.value)}
                >
                  <option value="">bitte wählen</option>
                  {(ziffern ?? []).map((z: any) => (
                    <option key={z.id} value={z.id}>
                      {z.ziffer} · {z.beschreibung} · {euro.format(z.einzelbetrag)}
                    </option>
                  ))}
                </Select>
              </div>
              <p className="text-lg">
                Summe <strong>{euro.format(summe)}</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Rechnungsempfänger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              {patient?.anrede} {patient?.vorname} {patient?.nachname}
              <br />
              {patient?.strasse}
              <br />
              {patient?.plz} {patient?.ort}
            </p>
            {(!patient?.strasse || !patient?.ort) && (
              <p className="rounded-md bg-warning/15 p-3 text-warning">
                Für den Postversand fehlt noch die Anschrift. Sie lässt sich in der Patientenakte
                nachtragen.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="freitext">Einleitender Text</Label>
              <Textarea
                id="freitext"
                value={freitext}
                onChange={(e) => setFreitext(e.target.value)}
                placeholder="Für die durchgeführten Behandlungen erlaube ich mir zu berechnen:"
              />
            </div>
            <Button className="w-full" onClick={erstellen} disabled={laeuft}>
              {laeuft ? <Loader2 className="animate-spin" /> : <Receipt />} Rechnung erstellen
            </Button>
            <p className="text-xs text-muted-foreground">
              Die Rechnungsnummer wird fortlaufend vergeben. Das druckfertige PDF gibt es danach in der
              Rechnungsübersicht.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
