import { createFileRoute, Outlet } from "@tanstack/react-router";
import { sitzungLaden } from "@/lib/sitzung";
import { Navigation } from "@/components/Navigation";
import { MARKEN } from "@/lib/marke";
import { useMarke } from "@/hooks/useMarke";

/**
 * Weg D – die Praxis selbst. Design der Alppraxis.
 * Therapeutinnen sehen ihre Standorte, die Praxisleitung alles.
 */
export const Route = createFileRoute("/praxis")({
  ssr: false,
  beforeLoad: () => sitzungLaden(["therapeut", "verwaltung"]),
  component: Rahmen,
});

function Rahmen() {
  const sitzung = Route.useRouteContext();
  useMarke("alppraxis");

  const menue = [
    { zu: "/praxis/heute", text: "Heute" },
    { zu: "/praxis/kalender", text: "Kalender" },
    { zu: "/praxis/anfragen", text: "Anfragen" },
    { zu: "/praxis/patienten", text: "Patienten" },
    { zu: "/praxis/rezepte", text: "Rezepte" },
    { zu: "/praxis/zeiten", text: "Zeiten" },
    ...(sitzung.rolle === "verwaltung"
      ? [
          { zu: "/praxis/rechnungen", text: "Rechnungen" },
          { zu: "/praxis/einstellungen", text: "Einstellungen" },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen">
      <Navigation
        logo={MARKEN.alppraxis.logo}
        logoAlt={MARKEN.alppraxis.logoAlt}
        titel="Praxis"
        eintraege={menue}
        person={sitzung.name}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
