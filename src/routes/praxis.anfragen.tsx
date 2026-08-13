import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  anfrageEntscheiden,
  freieZeitenLaden,
  offeneAnfragen,
  type FreieZeit,
} from "@/lib/daten";
import { datum, datumZeit, zeit } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/praxis/anfragen")({ ssr: false, component: Seite });

function Seite() {
  const qc = useQueryClient();
  const [zusageFuer, setZusageFuer] = useState<any | null>(null);
  const [notiz, setNotiz] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["anfragen-offen"],
    queryFn: offeneAnfragen,
    refetchInterval: 60_000,
  });

  async function ablehnen(anfrage: any) {
    setLaeuft(true);
    try {
      await anfrageEntscheiden({ anfrageId: anfrage.id, zusage: false, notiz: notiz || null });
      toast.success("Absage vermerkt. Der Gast bekommt eine E-Mail.");
      qc.invalidateQueries({ queryKey: ["anfragen-offen"] });
      setNotiz("");
    } catch (e: any) {
      toast.error(String(e?.message ?? "Das hat nicht geklappt."));
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl">Offene Anfragen</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Eine Anfrage blockiert nichts – bis zur Entscheidung bleibt die Zeit frei buchbar.
      </p>

      {isLoading && <p className="text-muted-foreground">Wird geladen …</p>}

      <div className="grid gap-3 lg:grid-cols-2">
        {(data ?? []).map((a: any) => (
          <Card key={a.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {a.name || (a.patients ? `${a.patients.vorname} ${a.patients.nachname}` : "ohne Namen")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {a.locations?.name?.split(" –")[0]}
                    {a.hotel_zimmer ? ` · Zimmer ${a.hotel_zimmer}` : ""}
                  </p>
                </div>
                <Badge variant="offen">offen</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="grid grid-cols-[7rem_1fr] gap-y-1 text-sm">
                <dt className="text-muted-foreground">Wunschtag</dt>
                <dd>
                  {datum(a.wunsch_datum)}
                  {a.wunsch_von ? ` · ${a.wunsch_von.slice(0, 5)}–${(a.wunsch_bis ?? "").slice(0, 5)} Uhr` : ""}
                  {a.flexibel ? " · flexibel" : ""}
                </dd>
                <dt className="text-muted-foreground">Behandlung</dt>
                <dd>{a.treatment_types?.name ?? "offen"}</dd>
                {a.anliegen && (
                  <>
                    <dt className="text-muted-foreground">Anliegen</dt>
                    <dd>{a.anliegen}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Eingegangen</dt>
                <dd className="text-muted-foreground">{datumZeit(a.created_at)}</dd>
              </dl>

              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => setZusageFuer(a)}>
                  <Check /> Zusagen
                </Button>
                <Button size="sm" variant="outline" onClick={() => ablehnen(a)} disabled={laeuft}>
                  <X /> Absagen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && (data ?? []).length === 0 && (
        <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nichts offen. Alles entschieden.
        </p>
      )}

      <ZusageDialog
        anfrage={zusageFuer}
        onSchliessen={() => setZusageFuer(null)}
        onFertig={() => qc.invalidateQueries({ queryKey: ["anfragen-offen"] })}
      />
    </div>
  );
}

function ZusageDialog({
  anfrage,
  onSchliessen,
  onFertig,
}: {
  anfrage: any | null;
  onSchliessen: () => void;
  onFertig: () => void;
}) {
  const [gewaehlt, setGewaehlt] = useState<FreieZeit | null>(null);
  const [notiz, setNotiz] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  const { data: zeiten } = useQuery({
    queryKey: ["zusage-zeiten", anfrage?.id],
    queryFn: () =>
      freieZeitenLaden({
        standortId: anfrage.location_id,
        behandlungsartId: anfrage.treatment_type_id,
        von: anfrage.wunsch_datum,
        bis: anfrage.wunsch_datum,
      }),
    enabled: Boolean(anfrage?.treatment_type_id),
  });

  async function zusagen() {
    if (!gewaehlt) {
      toast.error("Bitte eine Zeit wählen.");
      return;
    }
    setLaeuft(true);
    try {
      await anfrageEntscheiden({
        anfrageId: anfrage.id,
        zusage: true,
        therapeutId: gewaehlt.practitioner_id,
        start: gewaehlt.start,
        dauerMinuten: anfrage.treatment_types?.dauer_minuten ?? null,
        notiz: notiz || null,
      });
      toast.success("Zugesagt. Der Termin steht im Kalender, der Gast bekommt eine E-Mail.");
      onFertig();
      onSchliessen();
      setGewaehlt(null);
      setNotiz("");
    } catch (e: any) {
      toast.error(String(e?.message ?? "Das hat nicht geklappt."));
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <Dialog open={Boolean(anfrage)} onOpenChange={(o) => !o && onSchliessen()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anfrage zusagen</DialogTitle>
          <DialogDescription>
            {anfrage ? `${anfrage.name ?? ""} · Wunschtag ${datum(anfrage.wunsch_datum)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Freie Zeiten am Wunschtag</p>
            {(zeiten ?? []).length === 0 ? (
              <p className="rounded-md bg-secondary p-3 text-sm text-muted-foreground">
                An diesem Tag ist regulär nichts frei. Öffne unter „Zeiten“ eine Zusatzstunde – danach
                erscheint sie hier.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(zeiten ?? []).map((z) => (
                  <button
                    key={z.start}
                    type="button"
                    onClick={() => setGewaehlt(z)}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      gewaehlt?.start === z.start
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {zeit(z.start)}
                    <span className="ml-1 opacity-70">{z.practitioner_name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Notiz (bleibt intern)</p>
            <Textarea value={notiz} onChange={(e) => setNotiz(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onSchliessen}>
              Abbrechen
            </Button>
            <Button onClick={zusagen} disabled={laeuft || !gewaehlt}>
              {laeuft ? <Loader2 className="animate-spin" /> : <CalendarPlus />} Zusagen und eintragen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
