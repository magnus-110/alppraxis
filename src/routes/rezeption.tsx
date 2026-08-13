import { createFileRoute, Outlet } from "@tanstack/react-router";
import { sitzungLaden } from "@/lib/sitzung";
import { Navigation } from "@/components/Navigation";
import { MARKEN } from "@/lib/marke";
import { useMarke } from "@/hooks/useMarke";

/**
 * Weg C – Zugang der Rezeption im Hotel Schlossanger.
 * Im Design des Hauses, nur der Standort Pfronten.
 */
export const Route = createFileRoute("/rezeption")({
  ssr: false,
  beforeLoad: () => sitzungLaden(["rezeption", "verwaltung"], "schlossanger"),
  component: Rahmen,
});

const MENUE = [
  { zu: "/rezeption/buchen", text: "Termin buchen" },
  { zu: "/rezeption/tag", text: "Tagesübersicht" },
  { zu: "/rezeption/anfragen", text: "Anfragen" },
  { zu: "/rezeption/gaeste", text: "Gäste" },
];

function Rahmen() {
  const sitzung = Route.useRouteContext();
  useMarke("schlossanger");

  return (
    <div className="min-h-screen">
      <Navigation
        logo={MARKEN.schlossanger.logo}
        logoAlt={MARKEN.schlossanger.logoAlt}
        titel="ALPPRAXIS · Rezeption"
        eintraege={MENUE}
        person={sitzung.name}
        dunklerKopf
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
