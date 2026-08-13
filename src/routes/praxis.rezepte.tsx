import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { datum, datumZeit } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabelle, Kopf, Zeile, Th, Td } from "@/components/ui/tabelle";

export const Route = createFileRoute("/praxis/rezepte")({ ssr: false, component: Seite });

function Seite() {
  const { data } = useQuery({
    queryKey: ["rezepte-alle"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rezept_uebersicht")
        .select("*")
        .order("status")
        .order("ausstellungsdatum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const aktiv = (data ?? []).filter((r: any) => r.status === "aktiv");

  return (
    <div>
      <h1 className="mb-1 text-2xl">Rezepte</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Auf einen Blick: wie viele Einheiten genutzt sind und wann die restlichen Termine liegen – über
        beide Standorte hinweg.
      </p>

      <Card>
        <Tabelle>
          <Kopf>
            <tr>
              <Th>Patientin oder Patient</Th>
              <Th>Heilmittel</Th>
              <Th>Ausgestellt</Th>
              <Th>Einheiten</Th>
              <Th>Nächster Termin</Th>
              <Th>Gültig bis</Th>
            </tr>
          </Kopf>
          <tbody>
            {aktiv.map((r: any) => {
              const knapp = r.einheiten_offen <= 1;
              return (
                <Zeile key={r.id}>
                  <Td className="font-medium">
                    <Link
                      to="/praxis/patienten/$patientId"
                      params={{ patientId: r.patient_id }}
                      className="hover:underline"
                    >
                      {r.nachname}, {r.vorname}
                    </Link>
                  </Td>
                  <Td>{r.heilmittel ?? "—"}</Td>
                  <Td className="text-muted-foreground">
                    {r.ausstellungsdatum ? datum(r.ausstellungsdatum) : "—"}
                  </Td>
                  <Td>
                    <Badge variant={knapp ? "warnung" : "secondary"}>
                      {r.einheiten_genutzt} / {r.einheiten_gesamt}
                    </Badge>
                  </Td>
                  <Td className="text-muted-foreground">
                    {r.naechster_termin ? datumZeit(r.naechster_termin) : "keiner geplant"}
                  </Td>
                  <Td className="text-muted-foreground">{r.gueltig_bis ? datum(r.gueltig_bis) : "—"}</Td>
                </Zeile>
              );
            })}
          </tbody>
        </Tabelle>
        {aktiv.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">Kein aktives Rezept hinterlegt.</p>
        )}
      </Card>
    </div>
  );
}
