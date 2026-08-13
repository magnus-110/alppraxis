import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { euro } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tabelle, Kopf, Zeile, Th, Td } from "@/components/ui/tabelle";

export const Route = createFileRoute("/praxis/einstellungen")({ ssr: false, component: Seite });

const PRAXIS_FELDER = [
  ["praxis_name", "Name der Praxis"],
  ["inhaberin", "Inhaberin"],
  ["strasse", "Straße und Hausnummer"],
  ["plz", "PLZ"],
  ["ort", "Ort"],
  ["telefon", "Telefon"],
  ["email", "E-Mail"],
  ["website", "Website"],
  ["steuernummer", "Steuernummer"],
  ["bank_inhaber", "Kontoinhaberin"],
  ["iban", "IBAN"],
  ["bic", "BIC"],
  ["bank_name", "Bank"],
  ["zahlungsziel_tage", "Zahlungsziel in Tagen"],
  ["rechnungsnummer_praefix", "Kürzel vor der Rechnungsnummer"],
  ["ust_hinweis", "Hinweis zur Umsatzsteuer"],
] as const;

const BUCHUNG_FELDER = [
  ["raster_minuten", "Zeitraster in Minuten"],
  ["vorlauf_stunden", "Vorlauf in Stunden"],
  ["buchungsfenster_tage", "Wie weit im Voraus buchbar (Tage)"],
  ["puffer_minuten", "Puffer zwischen Terminen (Minuten)"],
  ["storno_stunden", "Absage möglich bis (Stunden vorher)"],
] as const;

function Seite() {
  const qc = useQueryClient();

  const { data: praxis } = useQuery({
    queryKey: ["praxisdaten"],
    queryFn: async () => {
      const { data, error } = await supabase.from("practice_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: buchung } = useQuery({
    queryKey: ["buchungseinstellungen"],
    queryFn: async () => {
      const { data, error } = await supabase.from("booking_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: ziffern } = useQuery({
    queryKey: ["gebuehrenziffern-alle"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_codes").select("*").order("sortierung");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: behandlungen } = useQuery({
    queryKey: ["behandlungsarten-alle"],
    queryFn: async () => {
      const { data, error } = await supabase.from("treatment_types").select("*").order("sortierung");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [praxisEntwurf, setPraxisEntwurf] = useState<any>(null);
  const [buchungEntwurf, setBuchungEntwurf] = useState<any>(null);
  const pw = praxisEntwurf ?? praxis ?? {};
  const bw = buchungEntwurf ?? buchung ?? {};

  const speichern = useMutation({
    mutationFn: async ({ tabelle, werte }: { tabelle: string; werte: any }) => {
      const { id, updated_at, ...rest } = werte;
      const { error } = await supabase.from(tabelle).update(rest).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gespeichert.");
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(String(e?.message)),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl">Einstellungen</h1>

      <Tabs defaultValue="praxis">
        <TabsList className="mb-4">
          <TabsTrigger value="praxis">Praxis</TabsTrigger>
          <TabsTrigger value="buchung">Buchung</TabsTrigger>
          <TabsTrigger value="behandlungen">Behandlungen</TabsTrigger>
          <TabsTrigger value="ziffern">Gebührenziffern</TabsTrigger>
        </TabsList>

        <TabsContent value="praxis">
          <Card>
            <CardHeader>
              <CardTitle>Stammdaten der Praxis</CardTitle>
              <CardDescription>Diese Angaben stehen auf jeder Rechnung.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {PRAXIS_FELDER.map(([feld, label]) => (
                <div key={feld} className="space-y-1.5">
                  <Label htmlFor={feld}>{label}</Label>
                  <Input
                    id={feld}
                    value={pw[feld] ?? ""}
                    onChange={(e) => setPraxisEntwurf({ ...pw, [feld]: e.target.value })}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Button onClick={() => speichern.mutate({ tabelle: "practice_settings", werte: pw })}>
                  <Save /> Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buchung">
          <Card>
            <CardHeader>
              <CardTitle>Regeln für die Online-Buchung</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {BUCHUNG_FELDER.map(([feld, label]) => (
                <div key={feld} className="space-y-1.5">
                  <Label htmlFor={feld}>{label}</Label>
                  <Input
                    id={feld}
                    type="number"
                    value={bw[feld] ?? ""}
                    onChange={(e) => setBuchungEntwurf({ ...bw, [feld]: Number(e.target.value) })}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Button onClick={() => speichern.mutate({ tabelle: "booking_settings", werte: bw })}>
                  <Save /> Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behandlungen">
          <Card>
            <Tabelle>
              <Kopf>
                <tr>
                  <Th>Name</Th>
                  <Th>Kategorie</Th>
                  <Th>Dauer</Th>
                  <Th className="text-right">Preis</Th>
                  <Th>Praxis-Website</Th>
                  <Th>Hotel-Website</Th>
                  <Th>Rezeption</Th>
                </tr>
              </Kopf>
              <tbody>
                {(behandlungen ?? []).map((b: any) => (
                  <Zeile key={b.id}>
                    <Td className="font-medium">{b.name}</Td>
                    <Td className="text-muted-foreground">{b.kategorie}</Td>
                    <Td>{b.dauer_minuten} Min.</Td>
                    <Td className="text-right">{b.preis ? euro.format(b.preis) : "—"}</Td>
                    {(["sichtbar_website_praxis", "sichtbar_website_hotel", "sichtbar_rezeption"] as const).map(
                      (feld) => (
                        <Td key={feld}>
                          <input
                            type="checkbox"
                            checked={Boolean(b[feld])}
                            onChange={async (e) => {
                              await supabase
                                .from("treatment_types")
                                .update({ [feld]: e.target.checked })
                                .eq("id", b.id);
                              qc.invalidateQueries({ queryKey: ["behandlungsarten-alle"] });
                            }}
                          />
                        </Td>
                      ),
                    )}
                  </Zeile>
                ))}
              </tbody>
            </Tabelle>
          </Card>
        </TabsContent>

        <TabsContent value="ziffern">
          <Card>
            <Tabelle>
              <Kopf>
                <tr>
                  <Th>Ziffer</Th>
                  <Th>Beschreibung</Th>
                  <Th className="text-right">Einzelbetrag</Th>
                  <Th>Aktiv</Th>
                </tr>
              </Kopf>
              <tbody>
                {(ziffern ?? []).map((z: any) => (
                  <Zeile key={z.id}>
                    <Td className="font-medium">{z.ziffer}</Td>
                    <Td>{z.beschreibung}</Td>
                    <Td className="text-right">{euro.format(z.einzelbetrag)}</Td>
                    <Td>{z.aktiv ? "ja" : "nein"}</Td>
                  </Zeile>
                ))}
              </tbody>
            </Tabelle>
            <CardContent className="pt-4 text-sm text-muted-foreground">
              Die Beträge sind Beispielwerte und sollten vor dem ersten Einsatz geprüft werden.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
