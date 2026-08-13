import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePlus2, Receipt, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { datum, datumZeit, euro } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RezeptDialog } from "@/components/praxis/RezeptDialog";

export const Route = createFileRoute("/praxis/patienten/$patientId")({ ssr: false, component: Seite });

function Seite() {
  const { patientId } = Route.useParams();
  const sitzung = Route.useRouteContext();
  const qc = useQueryClient();
  const [rezeptOffen, setRezeptOffen] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", patientId).single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: termine } = useQuery({
    queryKey: ["patient-termine", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, treatment_types(name), practitioners(name), locations(name)")
        .eq("patient_id", patientId)
        .order("start", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: rezepte } = useQuery({
    queryKey: ["patient-rezepte", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rezept_uebersicht")
        .select("*")
        .eq("patient_id", patientId)
        .order("ausstellungsdatum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: rechnungen } = useQuery({
    queryKey: ["patient-rechnungen", patientId],
    queryFn: async () => {
      if (sitzung.rolle !== "verwaltung") return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("patient_id", patientId)
        .order("datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const speichern = useMutation({
    mutationFn: async (werte: any) => {
      const { error } = await supabase.from("patients").update(werte).eq("id", patientId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gespeichert.");
      qc.invalidateQueries({ queryKey: ["patient", patientId] });
    },
    onError: (e: any) => toast.error(String(e?.message ?? "Speichern nicht möglich.")),
  });

  const [entwurf, setEntwurf] = useState<any>(null);
  const werte = entwurf ?? patient ?? {};

  if (!patient) return <p className="text-muted-foreground">Wird geladen …</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl">
            {patient.vorname} {patient.nachname}
          </h1>
          <p className="text-sm text-muted-foreground">
            {[patient.telefon, patient.email].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setRezeptOffen(true)}>
            <FilePlus2 /> Rezept anlegen
          </Button>
          {sitzung.rolle === "verwaltung" && (
            <Button asChild>
              <Link to="/praxis/rechnung-neu/$patientId" params={{ patientId }}>
                <Receipt /> Rechnung erstellen
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="termine">
        <TabsList className="mb-4">
          <TabsTrigger value="termine">Termine</TabsTrigger>
          <TabsTrigger value="rezepte">Rezepte</TabsTrigger>
          {sitzung.rolle === "verwaltung" && <TabsTrigger value="rechnungen">Rechnungen</TabsTrigger>}
          <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
        </TabsList>

        <TabsContent value="termine" className="space-y-2">
          {(termine ?? []).map((t: any) => (
            <Card key={t.id}>
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm">
                <span className="w-44 shrink-0">{datumZeit(t.start)}</span>
                <span className="flex-1">{t.treatment_types?.name}</span>
                <span className="text-muted-foreground">{t.practitioners?.name}</span>
                <span className="text-muted-foreground">{t.locations?.name?.split(" –")[0]}</span>
                {t.prescription_id && <Badge variant="secondary">Rezept</Badge>}
                {t.status === "abgesagt" && <Badge variant="warnung">abgesagt</Badge>}
                {t.abgerechnet && <Badge variant="gut">abgerechnet</Badge>}
              </CardContent>
            </Card>
          ))}
          {(termine ?? []).length === 0 && <p className="text-sm text-muted-foreground">Noch keine Termine.</p>}
        </TabsContent>

        <TabsContent value="rezepte" className="space-y-2">
          {(rezepte ?? []).map((r: any) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    {r.heilmittel ?? "Rezept"} {r.nummer ? `· ${r.nummer}` : ""}
                  </CardTitle>
                  <Badge variant={r.einheiten_offen > 0 ? "offen" : "gut"}>
                    {r.einheiten_genutzt} von {r.einheiten_gesamt} genutzt
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  {r.ausstellender_arzt ? `${r.ausstellender_arzt} · ` : ""}
                  {r.ausstellungsdatum ? datum(r.ausstellungsdatum) : ""}
                  {r.gueltig_bis ? ` · gültig bis ${datum(r.gueltig_bis)}` : ""}
                </p>
                {r.naechster_termin && <p>Nächster Termin: {datumZeit(r.naechster_termin)}</p>}
                {r.diagnose && <p>Diagnose: {r.diagnose}</p>}
              </CardContent>
            </Card>
          ))}
          {(rezepte ?? []).length === 0 && <p className="text-sm text-muted-foreground">Kein Rezept hinterlegt.</p>}
        </TabsContent>

        {sitzung.rolle === "verwaltung" && (
          <TabsContent value="rechnungen" className="space-y-2">
            {(rechnungen ?? []).map((r: any) => (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center gap-x-4 p-4 text-sm">
                  <span className="w-40 font-medium">{r.rechnungsnummer ?? "Entwurf"}</span>
                  <span>{datum(r.datum)}</span>
                  <span className="ml-auto">{euro.format(r.betrag)}</span>
                  <Badge
                    variant={r.status === "bezahlt" ? "gut" : r.status === "ueberfaellig" ? "warnung" : "offen"}
                  >
                    {r.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {(rechnungen ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Noch keine Rechnung.</p>
            )}
          </TabsContent>
        )}

        <TabsContent value="stammdaten">
          <Card>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              {(
                [
                  ["anrede", "Anrede"],
                  ["vorname", "Vorname"],
                  ["nachname", "Nachname"],
                  ["geburtsdatum", "Geburtsdatum"],
                  ["email", "E-Mail"],
                  ["telefon", "Telefon"],
                  ["strasse", "Straße und Hausnummer"],
                  ["plz", "PLZ"],
                  ["ort", "Ort"],
                  ["hotel_zimmer", "Zimmer im Hotel"],
                ] as const
              ).map(([feld, label]) => (
                <div key={feld} className="space-y-1.5">
                  <Label htmlFor={feld}>{label}</Label>
                  <Input
                    id={feld}
                    type={feld === "geburtsdatum" ? "date" : "text"}
                    value={werte[feld] ?? ""}
                    onChange={(e) => setEntwurf({ ...werte, [feld]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notizen">Notizen</Label>
                <Textarea
                  id="notizen"
                  value={werte.notizen ?? ""}
                  onChange={(e) => setEntwurf({ ...werte, notizen: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  onClick={() => {
                    const { id, created_at, updated_at, app_user_id, quelle, ...rest } = werte;
                    speichern.mutate(rest);
                  }}
                >
                  <Save /> Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RezeptDialog
        offen={rezeptOffen}
        patientId={patientId}
        onSchliessen={() => setRezeptOffen(false)}
        onFertig={() => qc.invalidateQueries({ queryKey: ["patient-rezepte", patientId] })}
      />
    </div>
  );
}
