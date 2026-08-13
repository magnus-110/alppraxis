import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  anfrageStellen,
  behandlungsartenLaden,
  standorteLaden,
  terminBuchen,
  type Behandlungsart,
  type FreieZeit,
} from "@/lib/daten";
import { datumLang, isoTag, zeit } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zeitwahl } from "@/components/buchung/Zeitwahl";

export const Route = createFileRoute("/rezeption/buchen")({ ssr: false, component: Seite });

function Seite() {
  const [behandlung, setBehandlung] = useState<Behandlungsart | null>(null);
  const [zeitpunkt, setZeitpunkt] = useState<FreieZeit | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [anfrageOffen, setAnfrageOffen] = useState(false);

  const [gast, setGast] = useState({
    anrede: "",
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
    zimmer: "",
    anliegen: "",
  });

  const [wunsch, setWunsch] = useState({
    datum: isoTag(new Date()),
    von: "09:00",
    bis: "18:00",
    flexibel: true,
  });

  const { data: standorte } = useQuery({
    queryKey: ["standorte", ["pfronten"]],
    queryFn: () => standorteLaden(["pfronten"]),
  });
  const standort = standorte?.[0];

  const { data: behandlungen } = useQuery({
    queryKey: ["behandlungsarten-rezeption", standort?.id],
    queryFn: () => behandlungsartenLaden({ standortId: standort!.id, kanal: "rezeption" }),
    enabled: Boolean(standort),
  });

  useEffect(() => {
    if (!behandlung && behandlungen && behandlungen.length > 0) setBehandlung(behandlungen[0]!);
  }, [behandlungen, behandlung]);

  const kontaktOk = useMemo(
    () => gast.nachname.trim().length > 0 && (gast.email.trim() || gast.telefon.trim()),
    [gast],
  );

  async function buchen() {
    if (!standort || !behandlung || !zeitpunkt) return;
    if (!kontaktOk) {
      toast.error("Bitte Nachname und eine Erreichbarkeit eintragen.");
      return;
    }
    setLaeuft(true);
    try {
      const e = await terminBuchen({
        standortId: standort.id,
        behandlungsartId: behandlung.id,
        start: zeitpunkt.start,
        anrede: gast.anrede || null,
        vorname: gast.vorname,
        nachname: gast.nachname,
        email: gast.email || null,
        telefon: gast.telefon || null,
        quelle: "rezeption",
        therapeutId: zeitpunkt.practitioner_id,
        anliegen: gast.anliegen || null,
        hotelZimmer: gast.zimmer || null,
      });
      toast.success(`Gebucht: ${datumLang(e.start)}, ${zeit(e.start)} Uhr bei ${e.practitioner_name}.`);
      setZeitpunkt(null);
      setGast({ anrede: "", vorname: "", nachname: "", email: "", telefon: "", zimmer: "", anliegen: "" });
    } catch (fehler: any) {
      toast.error(String(fehler?.message ?? "Die Buchung hat nicht geklappt."));
    } finally {
      setLaeuft(false);
    }
  }

  async function anfragen() {
    if (!standort) return;
    if (!kontaktOk) {
      toast.error("Bitte Nachname und eine Erreichbarkeit eintragen.");
      return;
    }
    setLaeuft(true);
    try {
      await anfrageStellen({
        standortId: standort.id,
        behandlungsartId: behandlung?.id ?? null,
        wunschDatum: wunsch.datum,
        wunschVon: wunsch.von || null,
        wunschBis: wunsch.bis || null,
        name: `${gast.vorname} ${gast.nachname}`.trim(),
        email: gast.email || null,
        telefon: gast.telefon || null,
        hotelZimmer: gast.zimmer || null,
        anliegen: gast.anliegen || null,
        flexibel: wunsch.flexibel,
      });
      toast.success("Die Anfrage liegt jetzt in der Praxis. Der Gast bekommt Bescheid, sobald entschieden ist.");
      setAnfrageOffen(false);
      setGast({ anrede: "", vorname: "", nachname: "", email: "", telefon: "", zimmer: "", anliegen: "" });
    } catch (fehler: any) {
      toast.error(String(fehler?.message ?? "Die Anfrage hat nicht geklappt."));
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        <h1 className="mb-1 text-2xl">Termin buchen</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          ALPPRAXIS im ALP SPA · Pfronten. Ist nichts mehr frei, kannst Du eine Anfrage in die Praxis
          weitergeben – der Gast muss nicht weggeschickt werden.
        </p>

        <div className="mb-5 space-y-1.5">
          <Label htmlFor="behandlung">Behandlung</Label>
          <Select
            id="behandlung"
            value={behandlung?.id ?? ""}
            onChange={(e) =>
              setBehandlung((behandlungen ?? []).find((b) => b.id === e.target.value) ?? null)
            }
          >
            {(behandlungen ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.dauer_minuten} Min.
              </option>
            ))}
          </Select>
        </div>

        {standort && behandlung && (
          <Zeitwahl
            standortId={standort.id}
            behandlungsartId={behandlung.id}
            gewaehlt={zeitpunkt}
            onWahl={setZeitpunkt}
            hinweisLeer="Nichts mehr frei? Stelle rechts eine Anfrage – die Praxis entscheidet mit einem Klick."
          />
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Gast</CardTitle>
            <CardDescription>Name und eine Erreichbarkeit genügen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vorname">Vorname</Label>
                <Input id="vorname" value={gast.vorname} onChange={(e) => setGast({ ...gast, vorname: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nachname">Nachname *</Label>
                <Input id="nachname" value={gast.nachname} onChange={(e) => setGast({ ...gast, nachname: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zimmer">Zimmer</Label>
              <Input id="zimmer" value={gast.zimmer} onChange={(e) => setGast({ ...gast, zimmer: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={gast.email} onChange={(e) => setGast({ ...gast, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefon">Telefon</Label>
              <Input id="telefon" type="tel" value={gast.telefon} onChange={(e) => setGast({ ...gast, telefon: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anliegen">Anliegen</Label>
              <Textarea id="anliegen" value={gast.anliegen} onChange={(e) => setGast({ ...gast, anliegen: e.target.value })} />
            </div>

            {zeitpunkt && (
              <p className="rounded-md bg-secondary p-3 text-sm">
                {datumLang(zeitpunkt.start)}, {zeit(zeitpunkt.start)} Uhr bei {zeitpunkt.practitioner_name}
              </p>
            )}

            <Button className="w-full" onClick={buchen} disabled={!zeitpunkt || laeuft}>
              {laeuft ? <Loader2 className="animate-spin" /> : <CalendarCheck />} Termin buchen
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAnfrageOffen((o) => !o)}
              type="button"
            >
              <HelpCircle /> Kein Platz? Anfrage stellen
            </Button>
          </CardContent>
        </Card>

        {anfrageOffen && (
          <Card>
            <CardHeader>
              <CardTitle>Anfrage an die Praxis</CardTitle>
              <CardDescription>
                Die Anfrage blockiert keine Zeit. Bis zur Entscheidung bleibt alles frei buchbar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="wdatum">Wunschtag</Label>
                <Input
                  id="wdatum"
                  type="date"
                  value={wunsch.datum}
                  onChange={(e) => setWunsch({ ...wunsch, datum: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="wvon">ab</Label>
                  <Input id="wvon" type="time" value={wunsch.von} onChange={(e) => setWunsch({ ...wunsch, von: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wbis">bis</Label>
                  <Input id="wbis" type="time" value={wunsch.bis} onChange={(e) => setWunsch({ ...wunsch, bis: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={wunsch.flexibel}
                  onChange={(e) => setWunsch({ ...wunsch, flexibel: e.target.checked })}
                />
                Der Gast ist zeitlich flexibel
              </label>
              <Button className="w-full" onClick={anfragen} disabled={laeuft}>
                {laeuft ? <Loader2 className="animate-spin" /> : <HelpCircle />} Anfrage weitergeben
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
