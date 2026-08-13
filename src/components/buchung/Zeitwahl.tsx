import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { freieZeitenLaden, type FreieZeit } from "@/lib/daten";
import { datumLang, isoTag, montagDerWoche, tageAddieren, zeit } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  standortId: string;
  behandlungsartId: string;
  gewaehlt: FreieZeit | null;
  onWahl: (z: FreieZeit) => void;
  /** Zusatztext, wenn nichts frei ist – etwa der Hinweis auf die Rezeption. */
  hinweisLeer?: string;
};

export function Zeitwahl({ standortId, behandlungsartId, gewaehlt, onWahl, hinweisLeer }: Props) {
  const [wochenStart, setWochenStart] = useState(() => montagDerWoche(new Date()));

  const von = isoTag(wochenStart);
  const bis = isoTag(tageAddieren(wochenStart, 6));

  const { data, isLoading } = useQuery({
    queryKey: ["freie-zeiten", standortId, behandlungsartId, von, bis],
    queryFn: () => freieZeitenLaden({ standortId, behandlungsartId, von, bis }),
    enabled: Boolean(standortId && behandlungsartId),
  });

  const tage = useMemo(() => {
    const gruppen = new Map<string, FreieZeit[]>();
    for (let i = 0; i < 7; i++) {
      gruppen.set(isoTag(tageAddieren(wochenStart, i)), []);
    }
    (data ?? []).forEach((z) => {
      const tag = isoTag(new Date(z.start));
      if (gruppen.has(tag)) gruppen.get(tag)!.push(z);
    });
    return [...gruppen.entries()];
  }, [data, wochenStart]);

  const heuteMontag = montagDerWoche(new Date()).getTime();
  const kannZurueck = wochenStart.getTime() > heuteMontag;
  const etwasFrei = (data ?? []).length > 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!kannZurueck}
          onClick={() => setWochenStart((w) => tageAddieren(w, -7))}
        >
          <ChevronLeft /> Woche zurück
        </Button>
        <span className="text-sm text-muted-foreground">
          {datumLang(wochenStart)} – {datumLang(tageAddieren(wochenStart, 6))}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setWochenStart((w) => tageAddieren(w, 7))}
        >
          Woche vor <ChevronRight />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Freie Zeiten werden gesucht …
        </div>
      ) : (
        <div className="space-y-4">
          {tage.map(([tag, zeiten]) => (
            <div key={tag} className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-sm font-medium">{datumLang(new Date(`${tag}T12:00:00`))}</p>
              {zeiten.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine freie Zeit</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {zeiten.map((z) => (
                    <button
                      key={z.start}
                      type="button"
                      onClick={() => onWahl(z)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm transition-colors",
                        gewaehlt?.start === z.start
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary hover:bg-secondary",
                      )}
                    >
                      {zeit(z.start)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && !etwasFrei && hinweisLeer && (
        <p className="mt-6 rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
          {hinweisLeer}
        </p>
      )}
    </div>
  );
}
