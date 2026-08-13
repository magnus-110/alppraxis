import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { terminePeriode } from "@/lib/daten";
import { datum, isoTag, montagDerWoche, tageAddieren, zeit } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { TerminDialog } from "@/components/praxis/TerminDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/praxis/kalender")({ ssr: false, component: Seite });

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function Seite() {
  const sitzung = Route.useRouteContext();
  const qc = useQueryClient();
  const [wochenStart, setWochenStart] = useState(() => montagDerWoche(new Date()));
  const [standortId, setStandortId] = useState<string>("");
  const [neuOffen, setNeuOffen] = useState(false);
  const [vorbelegung, setVorbelegung] = useState<string | null>(null);

  const von = `${isoTag(wochenStart)}T00:00:00+02:00`;
  const bis = `${isoTag(tageAddieren(wochenStart, 7))}T00:00:00+02:00`;

  const { data } = useQuery({
    queryKey: ["kalender", isoTag(wochenStart), standortId],
    queryFn: () => terminePeriode(von, bis, standortId || undefined),
  });

  const tage = useMemo(() => {
    const map = new Map<string, any[]>();
    for (let i = 0; i < 7; i++) map.set(isoTag(tageAddieren(wochenStart, i)), []);
    (data ?? []).forEach((t: any) => {
      const tag = isoTag(new Date(t.start));
      if (map.has(tag)) map.get(tag)!.push(t);
    });
    return [...map.entries()];
  }, [data, wochenStart]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">Kalender</h1>
        <div className="ml-auto flex items-center gap-2">
          <Select
            className="w-auto"
            value={standortId}
            onChange={(e) => setStandortId(e.target.value)}
          >
            <option value="">Alle Standorte</option>
            {sitzung.standorte.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name.split(" –")[0]}
              </option>
            ))}
          </Select>
          <Button variant="outline" size="icon" onClick={() => setWochenStart((w) => tageAddieren(w, -7))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWochenStart(montagDerWoche(new Date()))}>
            Heute
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWochenStart((w) => tageAddieren(w, 7))}>
            <ChevronRight />
          </Button>
          <Button
            onClick={() => {
              setVorbelegung(null);
              setNeuOffen(true);
            }}
          >
            <Plus /> Termin
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {tage.map(([tag, termine], i) => {
          const istHeute = tag === isoTag(new Date());
          return (
            <div
              key={tag}
              className={cn(
                "min-h-40 rounded-lg border bg-card p-3",
                istHeute ? "border-primary" : "border-border",
              )}
            >
              <button
                type="button"
                className="mb-2 flex w-full items-baseline justify-between text-left"
                onClick={() => {
                  setVorbelegung(tag);
                  setNeuOffen(true);
                }}
              >
                <span className="text-sm font-medium">{WOCHENTAGE[i]}</span>
                <span className="text-xs text-muted-foreground">{datum(`${tag}T12:00:00`).slice(0, 5)}</span>
              </button>

              <div className="space-y-1.5">
                {termine.map((t: any) => (
                  <div
                    key={t.id}
                    className="rounded border-l-2 bg-secondary/60 px-2 py-1.5 text-xs"
                    style={{ borderColor: t.practitioners?.farbe }}
                  >
                    <span className="block font-medium">{zeit(t.start)}</span>
                    <span className="block truncate">
                      {t.patients ? `${t.patients.vorname} ${t.patients.nachname}` : "—"}
                    </span>
                    <span className="block truncate text-muted-foreground">
                      {t.practitioners?.kuerzel ?? t.practitioners?.name} · {t.treatment_types?.name}
                    </span>
                  </div>
                ))}
                {termine.length === 0 && <p className="text-xs text-muted-foreground">frei</p>}
              </div>
            </div>
          );
        })}
      </div>

      <TerminDialog
        offen={neuOffen}
        onSchliessen={() => setNeuOffen(false)}
        standorte={sitzung.standorte}
        vorbelegterTag={vorbelegung}
        onFertig={() => qc.invalidateQueries({ queryKey: ["kalender"] })}
      />
    </div>
  );
}
