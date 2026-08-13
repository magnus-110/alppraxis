import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Clock, Loader2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  behandlungsartenLaden,
  freieZeitenLaden,
  standorteLaden,
  terminBuchen,
  type Behandlungsart,
  type FreieZeit,
  type Standort,
} from "@/lib/daten";
import type { Marke } from "@/lib/marke";
import { datumLang, euro, zeit } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Schritte } from "./Schritte";
import { Zeitwahl } from "./Zeitwahl";
import { cn } from "@/lib/utils";

const KATEGORIE_TITEL: Record<string, string> = {
  physiotherapie: "Physiotherapie",
  naturheilkunde: "Naturheilkunde",
  wellness: "Wellness",
};

type Props = {
  marke: Marke;
  kanal: "website_praxis" | "website_hotel";
};

export function BuchungsStrecke({ marke, kanal }: Props) {
  const mitStandortwahl = marke.standorte.length !== 1;

  const [standort, setStandort] = useState<Standort | null>(null);
  const [behandlung, setBehandlung] = useState<Behandlungsart | null>(null);
  const [zeitpunkt, setZeitpunkt] = useState<FreieZeit | null>(null);
  const [fertig, setFertig] = useState<{ start: string; therapeut: string } | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  const [form, setForm] = useState({
    anrede: "",
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
    zimmer: "",
    anliegen: "",
    einwilligung: false,
  });

  const { data: standorte } = useQuery({
    queryKey: ["standorte", marke.standorte],
    queryFn: () => standorteLaden(marke.standorte),
  });

  useEffect(() => {
    if (!standort && standorte && standorte.length === 1) setStandort(standorte[0]!);
  }, [standorte, standort]);

  const { data: behandlungen } = useQuery({
    queryKey: ["behandlungsarten", standort?.id, kanal],
    queryFn: () => behandlungsartenLaden({ standortId: standort!.id, kanal }),
    enabled: Boolean(standort),
  });

  const gruppen = useMemo(() => {
    const map = new Map<string, Behandlungsart[]>();
    (behandlungen ?? []).forEach((b) => {
      const liste = map.get(b.kategorie) ?? [];
      liste.push(b);
      map.set(b.kategorie, liste);
    });
    return [...map.entries()];
  }, [behandlungen]);

  const schrittTitel = mitStandortwahl
    ? ["Standort", "Behandlung", "Zeit", "Kontakt"]
    : ["Behandlung", "Zeit", "Kontakt"];

  const schritt = fertig ? schrittTitel.length : zeitpunkt ? 3 : behandlung ? 2 : standort ? 1 : 0;
  const angezeigterSchritt = mitStandortwahl ? schritt : Math.max(0, schritt - 1);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    if (!standort || !behandlung || !zeitpunkt) return;
    if (!form.einwilligung) {
      toast.error("Bitte bestätige kurz die Hinweise zum Datenschutz.");
      return;
    }
    setLaeuft(true);
    try {
      const ergebnis = await terminBuchen({
        standortId: standort.id,
        behandlungsartId: behandlung.id,
        start: zeitpunkt.start,
        anrede: form.anrede || null,
        vorname: form.vorname,
        nachname: form.nachname,
        email: form.email || null,
        telefon: form.telefon || null,
        quelle: kanal,
        therapeutId: zeitpunkt.practitioner_id,
        anliegen: form.anliegen || null,
        hotelZimmer: form.zimmer || null,
      });
      setFertig({ start: ergebnis.start, therapeut: ergebnis.practitioner_name });
    } catch (fehler: any) {
      const text = String(fehler?.message ?? "");
      if (text.includes("nicht mehr frei")) {
        toast.error("Diese Zeit wurde gerade vergeben. Bitte wähle eine andere.");
        setZeitpunkt(null);
        const neu = await freieZeitenLaden({
          standortId: standort.id,
          behandlungsartId: behandlung.id,
          von: zeitpunkt.start.slice(0, 10),
          bis: zeitpunkt.start.slice(0, 10),
        }).catch(() => []);
        if (neu.length === 0) toast.message("An diesem Tag ist nichts mehr frei.");
      } else {
        toast.error(text || "Die Buchung hat leider nicht geklappt.");
      }
    } finally {
      setLaeuft(false);
    }
  }

  if (fertig) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CalendarCheck className="size-7" />
        </div>
        <h2 className="mb-3 text-2xl">Der Termin steht.</h2>
        <p className="mb-6 text-muted-foreground">
          {datumLang(fertig.start)} um {zeit(fertig.start)} Uhr bei {fertig.therapeut}.
          {form.email ? " Eine Bestätigung geht an Deine E-Mail-Adresse." : ""}
        </p>
        <div className="rounded-lg border border-border bg-card p-5 text-left text-sm">
          <p className="mb-1 font-medium">{behandlung?.name}</p>
          <p className="text-muted-foreground">{standort?.name}</p>
          {standort?.strasse && (
            <p className="text-muted-foreground">
              {standort.strasse}, {standort.plz} {standort.ort}
            </p>
          )}
        </div>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            setFertig(null);
            setZeitpunkt(null);
            setBehandlung(null);
            if (mitStandortwahl) setStandort(null);
          }}
        >
          Weiteren Termin buchen
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Schritte aktuell={angezeigterSchritt} titel={schrittTitel} />

      {/* Schritt 1: Standort */}
      {mitStandortwahl && !standort && (
        <section>
          <h2 className="mb-1 text-xl">Wo möchtest Du behandelt werden?</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Beide Standorte arbeiten mit demselben Kalender.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(standorte ?? []).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStandort(s)}
                className="rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary"
              >
                <span className="mb-2 flex items-center gap-2 text-base font-medium">
                  <MapPin className="size-4 text-primary" /> {s.name}
                </span>
                {s.strasse && (
                  <span className="block text-sm text-muted-foreground">
                    {s.strasse}, {s.plz} {s.ort}
                  </span>
                )}
                {s.hinweis && <span className="mt-2 block text-sm text-muted-foreground">{s.hinweis}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Schritt 2: Behandlung */}
      {standort && !behandlung && (
        <section>
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-xl">Welche Behandlung darf es sein?</h2>
              <p className="text-sm text-muted-foreground">{standort.name}</p>
            </div>
            {mitStandortwahl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setStandort(null)}>
                Standort ändern
              </Button>
            )}
          </div>

          {!behandlungen && (
            <p className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Behandlungen werden geladen …
            </p>
          )}

          <div className="space-y-6">
            {gruppen.map(([kategorie, liste]) => (
              <div key={kategorie}>
                <h3 className="label-klein mb-2 text-muted-foreground">
                  {KATEGORIE_TITEL[kategorie] ?? kategorie}
                </h3>
                <div className="grid gap-2">
                  {liste.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBehandlung(b)}
                      className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
                    >
                      <span>
                        <span className="block font-medium">{b.name}</span>
                        {b.kurztext && (
                          <span className="mt-0.5 block text-sm text-muted-foreground">{b.kurztext}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-right text-sm">
                        <span className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Clock className="size-3.5" /> {b.dauer_minuten} Min.
                        </span>
                        {b.preis != null && (
                          <span className="mt-0.5 block font-medium">{euro.format(b.preis)}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schritt 3: Zeit */}
      {standort && behandlung && !zeitpunkt && (
        <section>
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-xl">Wann passt es Dir?</h2>
              <p className="text-sm text-muted-foreground">
                {behandlung.name} · {behandlung.dauer_minuten} Minuten · {standort.name}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setBehandlung(null)}>
              Behandlung ändern
            </Button>
          </div>
          <Zeitwahl
            standortId={standort.id}
            behandlungsartId={behandlung.id}
            gewaehlt={zeitpunkt}
            onWahl={setZeitpunkt}
            hinweisLeer={`In dieser Woche ist nichts frei. Oft lässt sich trotzdem etwas einrichten – melde Dich gerne unter ${marke.telefon}.`}
          />
        </section>
      )}

      {/* Schritt 4: Kontakt */}
      {standort && behandlung && zeitpunkt && (
        <section>
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-xl">Fast geschafft</h2>
              <p className="text-sm text-muted-foreground">
                {datumLang(zeitpunkt.start)}, {zeit(zeitpunkt.start)} Uhr · {behandlung.name}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setZeitpunkt(null)}>
              Zeit ändern
            </Button>
          </div>

          <form onSubmit={absenden} className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vorname">Vorname</Label>
                <Input
                  id="vorname"
                  value={form.vorname}
                  onChange={(e) => setForm({ ...form, vorname: e.target.value })}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nachname">Nachname *</Label>
                <Input
                  id="nachname"
                  required
                  value={form.nachname}
                  onChange={(e) => setForm({ ...form, nachname: e.target.value })}
                  autoComplete="family-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefon">Telefon</Label>
                <Input
                  id="telefon"
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                  autoComplete="tel"
                />
              </div>
              {kanal === "website_hotel" && (
                <div className="space-y-1.5">
                  <Label htmlFor="zimmer">Zimmernummer</Label>
                  <Input
                    id="zimmer"
                    value={form.zimmer}
                    onChange={(e) => setForm({ ...form, zimmer: e.target.value })}
                    placeholder="falls Du im Haus wohnst"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anliegen">Dein Anliegen (freiwillig)</Label>
              <Textarea
                id="anliegen"
                value={form.anliegen}
                onChange={(e) => setForm({ ...form, anliegen: e.target.value })}
                placeholder="Was sollen wir wissen?"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.einwilligung}
                onChange={(e) => setForm({ ...form, einwilligung: e.target.checked })}
              />
              <span>
                Meine Daten werden verschlüsselt in der EU gespeichert und ausschließlich für diesen
                Termin verwendet.
              </span>
            </label>

            <p className="text-xs text-muted-foreground">
              Bitte gib eine E-Mail-Adresse oder eine Telefonnummer an, damit wir Dich erreichen können.
            </p>

            <Button type="submit" size="lg" className="w-full" disabled={laeuft}>
              {laeuft ? <Loader2 className="animate-spin" /> : <CalendarCheck />}
              Termin verbindlich buchen
            </Button>
          </form>

          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Phone className="size-3.5" /> Lieber persönlich? {marke.telefon}
          </p>
        </section>
      )}
    </div>
  );
}

export function BuchungsRahmen({
  marke,
  eingebettet,
  children,
}: {
  marke: Marke;
  eingebettet: boolean;
  children: React.ReactNode;
}) {
  if (eingebettet) {
    return <div className="px-4 py-6 sm:px-6">{children}</div>;
  }
  return (
    <div className="min-h-screen">
      <header className="flaeche-hero text-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <img
            src={marke.logo}
            alt={marke.logoAlt}
            className={cn(
              "mb-5 h-14 w-auto object-contain",
              marke.schluessel === "alppraxis" && "bg-white/90 p-2",
            )}
          />
          <h1 className="text-3xl sm:text-4xl">{marke.titel}</h1>
          <p className="mt-2 max-w-xl text-white/85">{marke.untertitel}</p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        {marke.name} · {marke.telefon} ·{" "}
        <a className="underline" href={marke.website} target="_blank" rel="noreferrer">
          Zur Website
        </a>
      </footer>
    </div>
  );
}
