import { createFileRoute } from "@tanstack/react-router";
import { BuchungsRahmen, BuchungsStrecke } from "@/components/buchung/BuchungsStrecke";
import { MARKEN } from "@/lib/marke";
import { istEingebettet, useMarke } from "@/hooks/useMarke";

/**
 * Weg A – Buchungsfenster für die Website der Alppraxis.
 * Beide Standorte sichtbar, Standortauswahl als erster Schritt.
 * Mit ?embed=1 läuft die Seite ohne Kopf- und Fußzeile im iframe.
 */
export const Route = createFileRoute("/buchen")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({ embed: search["embed"] ? "1" : undefined }),
  component: Seite,
});

function Seite() {
  const search = Route.useSearch();
  const eingebettet = istEingebettet(search);
  useMarke("alppraxis", eingebettet);

  return (
    <BuchungsRahmen marke={MARKEN.alppraxis} eingebettet={eingebettet}>
      <BuchungsStrecke marke={MARKEN.alppraxis} kanal="website_praxis" />
    </BuchungsRahmen>
  );
}
