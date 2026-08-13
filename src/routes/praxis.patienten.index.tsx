import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { patientenSuchen, type Patient } from "@/lib/daten";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabelle, Kopf, Zeile, Th, Td } from "@/components/ui/tabelle";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/praxis/patienten/")({ ssr: false, component: Seite });

function Seite() {
  const [suche, setSuche] = useState("");
  const { data } = useQuery({ queryKey: ["patienten", suche], queryFn: () => patientenSuchen(suche) });

  return (
    <div>
      <h1 className="mb-5 text-2xl">Patientinnen und Patienten</h1>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Name, E-Mail oder Telefon"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
        />
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
                  <Link to="/praxis/patienten/$patientId" params={{ patientId: p.id }} className="hover:underline">
                    {p.nachname}, {p.vorname}
                  </Link>
                  {p.ist_hotelgast && (
                    <Badge variant="secondary" className="ml-2">
                      Hotelgast
                    </Badge>
                  )}
                </Td>
                <Td className="text-muted-foreground">{[p.telefon, p.email].filter(Boolean).join(" · ")}</Td>
                <Td className="text-muted-foreground">
                  {[p.strasse, [p.plz, p.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                </Td>
                <Td className="text-right">
                  <Link
                    to="/praxis/patienten/$patientId"
                    params={{ patientId: p.id }}
                    className="text-sm text-primary underline"
                  >
                    Akte
                  </Link>
                </Td>
              </Zeile>
            ))}
          </tbody>
        </Tabelle>
      </Card>
    </div>
  );
}
