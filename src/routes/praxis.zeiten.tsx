import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { therapeutenLaden } from "@/lib/daten";
import { datumZeit } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabelle, Kopf, Zeile, Th, Td } from "@/components/ui/tabelle";

export const Route = createFileRoute("/praxis/zeiten")({ ssr: false, component: Seite });

const TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function Seite() {
  const sitzung = Route.useRouteContext();
  const qc = useQueryClient();
  const istLeitung = sitzung.rolle === "verwaltung";
  const eigeneId = sitzung.therapeut?.id ?? "";

  const { data: therapeuten } = useQuery({ queryKey: ["therapeuten"], queryFn: therapeutenLaden });

  const { data: regeln } = useQuery({
    queryKey: ["arbeitszeiten"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_rules")
        .select("*, practitioners(name, farbe), locations(name, code)")
        .order("wochentag")
        .order("von");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: ausnahmen } = useQuery({
    queryKey: ["ausnahmen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_exceptions")
        .select("*, practitioners(name), locations(name)")
        .gte("bis", new Date().toISOString())
        .order("von");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [regel, setRegel] = useState({
    practitioner_id: eigeneId,
    location_id: sitzung.standorte[0]?.id ?? "",
    wochentag: 1,
    von: "09:00",
    bis: "17:00",
    rang: 1,
  });

  const [ausnahme, setAusnahme] = useState({
    practitioner_id: eigeneId,
    location_id: sitzung.standorte[0]?.id ?? "",
    von: "",
    bis: "",
    typ: "offen" as "offen" | "geschlossen",
    grund: "",
  });

  const regelSpeichern = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("availability_rules").insert(regel);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Arbeitszeit gespeichert.");
      qc.invalidateQueries({ queryKey: ["arbeitszeiten"] });
    },
    onError: (e: any) => toast.error(String(e?.message)),
  });

  const ausnahmeSpeichern = useMutation({
    mutationFn: async () => {
      if (!ausnahme.von || !ausnahme.bis) throw new Error("Bitte Anfang und Ende angeben.");
      const { error } = await supabase.from("availability_exceptions").insert({
        ...ausnahme,
        von: new Date(ausnahme.von).toISOString(),
        bis: new Date(ausnahme.bis).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Eingetragen.");
      qc.invalidateQueries({ queryKey: ["ausnahmen"] });
    },
    onError: (e: any) => toast.error(String(e?.message)),
  });

  const loeschen = useMutation({
    mutationFn: async ({ tabelle, id }: { tabelle: string; id: string }) => {
      const { error } = await supabase.from(tabelle).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gelöscht.");
      qc.invalidateQueries({ queryKey: ["arbeitszeiten"] });
      qc.invalidateQueries({ queryKey: ["ausnahmen"] });
    },
  });

  const sichtbareRegeln = (regeln ?? []).filter(
    (r: any) => istLeitung || r.practitioner_id === eigeneId,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl">Zeiten</h1>
        <p className="text-sm text-muted-foreground">
          Regelmäßige Arbeitszeiten und einzelne Ausnahmen. Rang 1 ist der Haupttherapeut des Tages –
          er wird zuerst gefüllt. Rang 2 wird nur angeboten, wenn Rang 1 zu dieser Zeit belegt ist.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Regelmäßige Arbeitszeiten</CardTitle>
          </CardHeader>
          <Tabelle>
            <Kopf>
              <tr>
                <Th>Tag</Th>
                <Th>Zeit</Th>
                <Th>Wer</Th>
                <Th>Standort</Th>
                <Th>Rang</Th>
                <Th />
              </tr>
            </Kopf>
            <tbody>
              {sichtbareRegeln.map((r: any) => (
                <Zeile key={r.id}>
                  <Td>{TAGE[r.wochentag]}</Td>
                  <Td>
                    {r.von.slice(0, 5)} – {r.bis.slice(0, 5)}
                  </Td>
                  <Td>{r.practitioners?.name}</Td>
                  <Td className="text-muted-foreground">{r.locations?.name?.split(" –")[0]}</Td>
                  <Td>
                    <Badge variant={r.rang === 1 ? "default" : "secondary"}>{r.rang}</Badge>
                  </Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loeschen.mutate({ tabelle: "availability_rules", id: r.id })}
                    >
                      <Trash2 />
                    </Button>
                  </Td>
                </Zeile>
              ))}
            </tbody>
          </Tabelle>
          {sichtbareRegeln.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">Noch keine Arbeitszeit hinterlegt.</p>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Arbeitszeit hinzufügen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {istLeitung && (
              <div className="space-y-1.5">
                <Label>Wer</Label>
                <Select
                  value={regel.practitioner_id}
                  onChange={(e) => setRegel({ ...regel, practitioner_id: e.target.value })}
                >
                  <option value="">bitte wählen</option>
                  {(therapeuten ?? []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Standort</Label>
              <Select
                value={regel.location_id}
                onChange={(e) => setRegel({ ...regel, location_id: e.target.value })}
              >
                {sitzung.standorte.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.split(" –")[0]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Wochentag</Label>
              <Select
                value={regel.wochentag}
                onChange={(e) => setRegel({ ...regel, wochentag: Number(e.target.value) })}
              >
                {TAGE.map((t, i) => (
                  <option key={t} value={i}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>von</Label>
                <Input type="time" value={regel.von} onChange={(e) => setRegel({ ...regel, von: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>bis</Label>
                <Input type="time" value={regel.bis} onChange={(e) => setRegel({ ...regel, bis: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Rang</Label>
              <Select value={regel.rang} onChange={(e) => setRegel({ ...regel, rang: Number(e.target.value) })}>
                <option value={1}>1 – Haupttherapeut des Tages</option>
                <option value={2}>2 – wird bei Andrang dazugeschaltet</option>
                <option value={3}>3</option>
              </Select>
            </div>
            <Button className="w-full" onClick={() => regelSpeichern.mutate()}>
              <Plus /> Speichern
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Ausnahmen</CardTitle>
            <CardDescription>Urlaub, freie Tage – oder eine zusätzlich geöffnete Stunde.</CardDescription>
          </CardHeader>
          <Tabelle>
            <Kopf>
              <tr>
                <Th>Art</Th>
                <Th>Von</Th>
                <Th>Bis</Th>
                <Th>Wer</Th>
                <Th>Grund</Th>
                <Th />
              </tr>
            </Kopf>
            <tbody>
              {(ausnahmen ?? [])
                .filter((a: any) => istLeitung || a.practitioner_id === eigeneId)
                .map((a: any) => (
                  <Zeile key={a.id}>
                    <Td>
                      <Badge variant={a.typ === "offen" ? "gut" : "warnung"}>
                        {a.typ === "offen" ? "zusätzlich offen" : "geschlossen"}
                      </Badge>
                    </Td>
                    <Td>{datumZeit(a.von)}</Td>
                    <Td>{datumZeit(a.bis)}</Td>
                    <Td>{a.practitioners?.name}</Td>
                    <Td className="text-muted-foreground">{a.grund}</Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loeschen.mutate({ tabelle: "availability_exceptions", id: a.id })}
                      >
                        <Trash2 />
                      </Button>
                    </Td>
                  </Zeile>
                ))}
            </tbody>
          </Tabelle>
          {(ausnahmen ?? []).length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">Keine Ausnahmen eingetragen.</p>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Ausnahme eintragen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {istLeitung && (
              <div className="space-y-1.5">
                <Label>Wer</Label>
                <Select
                  value={ausnahme.practitioner_id}
                  onChange={(e) => setAusnahme({ ...ausnahme, practitioner_id: e.target.value })}
                >
                  <option value="">bitte wählen</option>
                  {(therapeuten ?? []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Art</Label>
              <Select
                value={ausnahme.typ}
                onChange={(e) => setAusnahme({ ...ausnahme, typ: e.target.value as any })}
              >
                <option value="offen">zusätzlich öffnen</option>
                <option value="geschlossen">schließen (Urlaub, frei)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Von</Label>
              <Input
                type="datetime-local"
                value={ausnahme.von}
                onChange={(e) => setAusnahme({ ...ausnahme, von: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bis</Label>
              <Input
                type="datetime-local"
                value={ausnahme.bis}
                onChange={(e) => setAusnahme({ ...ausnahme, bis: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Grund</Label>
              <Input value={ausnahme.grund} onChange={(e) => setAusnahme({ ...ausnahme, grund: e.target.value })} />
            </div>
            <Button className="w-full" onClick={() => ausnahmeSpeichern.mutate()}>
              <Plus /> Eintragen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
