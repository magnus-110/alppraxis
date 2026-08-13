import { createFileRoute } from "@tanstack/react-router";
import { BuchungsRahmen, BuchungsStrecke } from "@/components/buchung/BuchungsStrecke";
import { MARKEN } from "@/lib/marke";
import { istEingebettet, useMarke } from "@/hooks/useMarke";

/**
 * Weg B – Buchungsfenster für die Website des Hotels Schlossanger.
 * Nur Pfronten, im Design des Hauses.
 */
export const Route = createFileRoute("/buchen/hotel")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({ embed: search["embed"] ? "1" : undefined }),
  component: Seite,
});

function Seite() {
  const search = Route.useSearch();
  const eingebettet = istEingebettet(search);
  useMarke("schlossanger", eingebettet);

  return (
    <BuchungsRahmen marke={MARKEN.schlossanger} eingebettet={eingebettet}>
      <BuchungsStrecke marke={MARKEN.schlossanger} kanal="website_hotel" />
    </BuchungsRahmen>
  );
}
