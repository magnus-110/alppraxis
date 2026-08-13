import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { datumLang, isoTag, tageAddieren, zeit } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/rezeption/tag")({ ssr: false, component: Seite });

type Eintrag = {
  id: string;
  start: string;
  ende: string;
  practitioner_name: string;
  farbe: string;
  eigene_buchung: boolean;
  patient_kurz: string;
};

function Seite() {
  const [tag, setTag] = useState(() => new Date());
  const von = `${isoTag(tag)}T00:00:00+02:00`;
  const bis = `${isoTag(tageAddieren(tag, 1))}T00:00:00+02:00`;

  const { data, isLoading } = useQuery({
    queryKey: ["kalender-rezeption", isoTag(tag)],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("kalender_rezeption", { _von: von, _bis: bis });
      if (error) throw error;
      return (data ?? []) as Eintrag[];
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl">Tagesübersicht</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setTag((t) => tageAddieren(t, -1))}>
            <ChevronLeft />
          </Button>
          <span className="min-w-48 text-center text-sm">{datumLang(tag)}</span>
          <Button variant="outline" size="icon" onClick={() => setTag((t) => tageAddieren(t, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Belegte Zeiten sind sichtbar. Namen erscheinen nur bei Terminen, die die Rezeption selbst
        gebucht hat – Behandlungsinhalte bleiben in der Praxis.
      </p>

      {isLoading && <p className="text-muted-foreground">Wird geladen …</p>}

      <div className="space-y-2">
        {(data ?? []).map((e) => (
          <Card key={e.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="h-10 w-1 rounded-full" style={{ backgroundColor: e.farbe }} />
              <span className="w-32 shrink-0 text-sm">
                {zeit(e.start)} – {zeit(e.ende)}
              </span>
              <span className="flex-1 text-sm">{e.patient_kurz}</span>
              <span className="text-sm text-muted-foreground">{e.practitioner_name}</span>
            </CardContent>
          </Card>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            An diesem Tag ist noch nichts eingetragen.
          </p>
        )}
      </div>
    </div>
  );
}
