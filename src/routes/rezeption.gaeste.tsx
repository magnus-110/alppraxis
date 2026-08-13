import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { patientenSuchen, type Patient } from "@/lib/daten";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabelle, Kopf, Zeile, Th, Td } from "@/components/ui/tabelle";

export const Route = createFileRoute("/rezeption/gaeste")({ ssr: false, component: Seite });

const LEER = {
  anrede: "",
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
  strasse: "",
  plz: "",
  ort: "",
  hotel_zimmer: "",
};

function Seite() {
  const qc = useQueryClient();
  const [suche, setSuche] = useState("");
  const [bearbeitet, setBearbeitet] = useState<(typeof LEER & { id?: string }) | null>(null);

  const { data } = useQuery({
    queryKey: ["patienten", suche],
    queryFn: () => patientenSuchen(suche),
  });

  const speichern = useMutation({
    mutationFn: async (p: typeof LEER & { id?: string }) => {
      const werte = { ...p, ist_hotelgast: true };
      if (p.id) {
        const { error } = await supabase.from("patients").update(werte).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("patients").insert(werte);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Gespeichert.");
      setBearbeitet(null);
      qc.invalidateQueries({ queryKey: ["patienten"] });
    },
    onError: (e: any) => toast.error(String(e?.message ?? "Speichern nicht möglich.")),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        <h1 className="mb-1 text-2xl">Gäste und Adressen</h1>
        <p className="mb-5 text-sm text-muted-foreground">
          Damit die Praxis später ohne Nachfragen abrechnen kann.
        </p>

        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Name, E-Mail oder Telefon"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
            />
          </div>
          <Button onClick={() => setBearbeitet({ ...LEER })}>
            <UserPlus /> Neu
          </Button>
        </div>

        <Card>
          <Tabelle>
            <Kopf>
              <tr>
                <Th>Name</Th>
                <Th>Kontakt</Th>
                <Th>Adresse</Th>
                <Th />
              </tr>
            </Kopf>
            <tbody>
              {(data ?? []).map((p: Patient) => (
                <Zeile key={p.id}>
                  <Td className="font-medium">
                    {p.vorname} {p.nachname}
                    {p.hotel_zimmer && (
                      <span className="ml-2 text-xs text-muted-foreground">Zi. {p.hotel_zimmer}</span>
                    )}
                  </Td>
                  <Td className="text-muted-foreground">
                    {p.email}
                    {p.email && p.telefon ? " · " : ""}
                    {p.telefon}
                  </Td>
                  <Td className="text-muted-foreground">
                    {[p.strasse, [p.plz, p.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setBearbeitet({
                          id: p.id,
                          anrede: p.anrede ?? "",
                          vorname: p.vorname ?? "",
                          nachname: p.nachname ?? "",
                          email: p.email ?? "",
                          telefon: p.telefon ?? "",
                          strasse: p.strasse ?? "",
                          plz: p.plz ?? "",
                          ort: p.ort ?? "",
                          hotel_zimmer: p.hotel_zimmer ?? "",
                        })
                      }
                    >
                      Bearbeiten
                    </Button>
                  </Td>
                </Zeile>
              ))}
            </tbody>
          </Tabelle>
        </Card>
      </div>

      {bearbeitet && (
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{bearbeitet.id ? "Adresse pflegen" : "Neuer Gast"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                ["anrede", "Anrede"],
                ["vorname", "Vorname"],
                ["nachname", "Nachname"],
                ["email", "E-Mail"],
                ["telefon", "Telefon"],
                ["strasse", "Straße und Hausnummer"],
                ["plz", "PLZ"],
                ["ort", "Ort"],
                ["hotel_zimmer", "Zimmer"],
              ] as const
            ).map(([feld, label]) => (
              <div key={feld} className="space-y-1.5">
                <Label htmlFor={feld}>{label}</Label>
                <Input
                  id={feld}
                  value={(bearbeitet as any)[feld] ?? ""}
                  onChange={(e) => setBearbeitet({ ...bearbeitet, [feld]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => speichern.mutate(bearbeitet)}>
                <Save /> Speichern
              </Button>
              <Button variant="outline" onClick={() => setBearbeitet(null)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
