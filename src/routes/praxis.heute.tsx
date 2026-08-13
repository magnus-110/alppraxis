import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarDays, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { terminePeriode } from "@/lib/daten";
import { datumLang, isoTag, tageAddieren, zeit } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/praxis/heute")({ ssr: false, component: Seite });

function Seite() {
  const sitzung = Route.useRouteContext();
  const heute = new Date();
  const von = `${isoTag(heute)}T00:00:00+02:00`;
  const bis = `${isoTag(tageAddieren(heute, 1))}T00:00:00+02:00`;

  const { data: termine } = useQuery({
    queryKey: ["termine-heute", isoTag(heute)],
    queryFn: () => terminePeriode(von, bis),
    refetchInterval: 60_000,
  });

  const { data: anfragen } = useQuery({
    queryKey: ["anzahl-anfragen"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "offen");
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  const meine = (termine ?? []).filter(
    (t: any) => !sitzung.therapeut || t.practitioner_id === sitzung.therapeut.id,
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl">{datumLang(heute)}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {meine.length === 0
          ? "Heute steht noch nichts an."
          : `${meine.length} ${meine.length === 1 ? "Termin" : "Termine"} für Dich.`}
      </p>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Kachel
          zu="/praxis/anfragen"
          symbol={<AlertCircle className="size-5" />}
          zahl={anfragen ?? 0}
          text={anfragen === 1 ? "offene Anfrage" : "offene Anfragen"}
          hervorheben={(anfragen ?? 0) > 0}
        />
        <Kachel
          zu="/praxis/kalender"
          symbol={<CalendarDays className="size-5" />}
          zahl={(termine ?? []).length}
          text="Termine heute im Haus"
        />
        <Kachel zu="/praxis/patienten" symbol={<Users className="size-5" />} zahl={null} text="Patienten" />
      </div>

      <h2 className="mb-3 text-lg">Dein Tag</h2>
      <div className="space-y-2">
        {meine.map((t: any) => (
          <Card key={t.id}>
            <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
              <span className="h-9 w-1 rounded-full" style={{ backgroundColor: t.practitioners?.farbe }} />
              <span className="w-28 shrink-0 text-sm font-medium">
                {zeit(t.start)}–{zeit(t.ende)}
              </span>
              <span className="flex-1">
                <Link
                  to="/praxis/patienten/$patientId"
                  params={{ patientId: t.patient_id ?? "" }}
                  className="font-medium hover:underline"
                >
                  {t.patients ? `${t.patients.vorname} ${t.patients.nachname}` : "ohne Namen"}
                </Link>
                <span className="ml-2 text-sm text-muted-foreground">{t.treatment_types?.name}</span>
              </span>
              {t.prescription_id && (
                <Badge variant="secondary">
                  <FileText className="mr-1 size-3" /> Rezept
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">{t.locations?.name?.split(" –")[0]}</span>
              {t.anliegen && <span className="w-full text-sm text-muted-foreground">{t.anliegen}</span>}
            </CardContent>
          </Card>
        ))}
        {meine.length === 0 && (
          <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Nichts eingetragen.
          </p>
        )}
      </div>
    </div>
  );
}

function Kachel({
  zu,
  symbol,
  zahl,
  text,
  hervorheben,
}: {
  zu: string;
  symbol: React.ReactNode;
  zahl: number | null;
  text: string;
  hervorheben?: boolean;
}) {
  return (
    <Link
      to={zu}
      className={`rounded-lg border bg-card p-5 transition-colors hover:border-primary ${
        hervorheben ? "border-warning" : "border-border"
      }`}
    >
      <span className="mb-2 flex items-center gap-2 text-muted-foreground">{symbol}</span>
      {zahl !== null && <span className="block text-3xl">{zahl}</span>}
      <span className="text-sm text-muted-foreground">{text}</span>
    </Link>
  );
}
