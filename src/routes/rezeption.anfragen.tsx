import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { datum, datumZeit } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/rezeption/anfragen")({ ssr: false, component: Seite });

const STATUS_TEXT: Record<string, string> = {
  offen: "wartet auf die Praxis",
  zugesagt: "zugesagt",
  abgelehnt: "leider abgelehnt",
  zurueckgezogen: "zurückgezogen",
};

function Seite() {
  const { data, isLoading } = useQuery({
    queryKey: ["anfragen-rezeption"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*, treatment_types(name)")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl">Anfragen</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Hier siehst Du, was aus den weitergegebenen Anfragen geworden ist.
      </p>

      {isLoading && <p className="text-muted-foreground">Wird geladen …</p>}

      <div className="space-y-2">
        {(data ?? []).map((a: any) => (
          <Card key={a.id}>
            <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <span className="font-medium">{a.name || "ohne Namen"}</span>
              {a.hotel_zimmer && <span className="text-sm text-muted-foreground">Zi. {a.hotel_zimmer}</span>}
              <span className="text-sm text-muted-foreground">
                {a.treatment_types?.name ?? "Behandlung offen"} · Wunsch {datum(a.wunsch_datum)}
                {a.wunsch_von ? ` ab ${a.wunsch_von.slice(0, 5)} Uhr` : ""}
              </span>
              <Badge
                className="ml-auto"
                variant={a.status === "offen" ? "offen" : a.status === "zugesagt" ? "gut" : "secondary"}
              >
                {STATUS_TEXT[a.status] ?? a.status}
              </Badge>
              {a.entschieden_am && (
                <span className="w-full text-xs text-muted-foreground">
                  Entschieden am {datumZeit(a.entschieden_am)}
                  {a.entscheidung_notiz ? ` · ${a.entscheidung_notiz}` : ""}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Noch keine Anfragen.
          </p>
        )}
      </div>
    </div>
  );
}
