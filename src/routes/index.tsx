import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Hotel, Stethoscope } from "lucide-react";
import { MARKEN } from "@/lib/marke";

export const Route = createFileRoute("/")({ ssr: false, component: Start });

function Start() {
  return (
    <div className="min-h-screen">
      <header className="flaeche-hero text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl sm:text-4xl">Alppraxis</h1>
          <p className="mt-2 max-w-xl text-white/85">
            Ein Kalender für beide Standorte. Vier Wege führen dorthin.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-3 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <Kachel
          zu="/buchen"
          symbol={<CalendarDays className="size-5" />}
          titel="Termin buchen"
          text="Buchungsfenster im Design der Alppraxis, mit Standortauswahl."
        />
        <Kachel
          zu="/rezeption"
          symbol={<Hotel className="size-5" />}
          titel="Rezeption Hotel"
          text="Zugang für die Rezeption des Schlossanger. Buchen und anfragen."
        />
        <Kachel
          zu="/praxis/heute"
          symbol={<Stethoscope className="size-5" />}
          titel="Praxis"
          text="Kalender, Anfragen, Patienten, Rezepte und Rechnungen."
        />
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-10 text-sm text-muted-foreground sm:px-6">
        <p>
          Die Buchungsfenster zum Einbetten findest Du unter{" "}
          <Link to="/einbetten" className="underline">
            /einbetten
          </Link>
          .
        </p>
        <p className="mt-1">{MARKEN.alppraxis.telefon}</p>
      </footer>
    </div>
  );
}

function Kachel({
  zu,
  symbol,
  titel,
  text,
}: {
  zu: string;
  symbol: React.ReactNode;
  titel: string;
  text: string;
}) {
  return (
    <Link
      to={zu}
      className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
    >
      <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
        {symbol}
      </span>
      <span className="block font-medium">{titel}</span>
      <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
    </Link>
  );
}
