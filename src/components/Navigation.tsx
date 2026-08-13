import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { abmelden } from "@/lib/sitzung";
import { cn } from "@/lib/utils";

export type Eintrag = { zu: string; text: string };

export function Navigation({
  logo,
  logoAlt,
  titel,
  eintraege,
  person,
  dunklerKopf = false,
}: {
  logo: string;
  logoAlt: string;
  titel: string;
  eintraege: Eintrag[];
  person: string;
  dunklerKopf?: boolean;
}) {
  const [offen, setOffen] = useState(false);
  const pfad = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border",
        dunklerKopf ? "bg-primary text-primary-foreground" : "bg-card",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <img
          src={logo}
          alt={logoAlt}
          className={cn("h-8 w-auto object-contain", !dunklerKopf && "max-w-32")}
        />
        <span className="schrift-display hidden text-sm sm:block">{titel}</span>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {eintraege.map((e) => (
            <Link
              key={e.zu}
              to={e.zu}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                pfad.startsWith(e.zu)
                  ? dunklerKopf
                    ? "bg-white/15"
                    : "bg-secondary text-foreground"
                  : "opacity-80 hover:opacity-100",
              )}
            >
              {e.text}
            </Link>
          ))}
          <span className="ml-3 text-xs opacity-70">{person}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={abmelden}
            title="Abmelden"
            className={dunklerKopf ? "hover:bg-white/15" : ""}
          >
            <LogOut />
          </Button>
        </nav>

        <button
          type="button"
          className="ml-auto md:hidden"
          onClick={() => setOffen((o) => !o)}
          aria-label="Menü"
        >
          {offen ? <X /> : <Menu />}
        </button>
      </div>

      {offen && (
        <nav className="border-t border-border px-4 py-2 md:hidden">
          {eintraege.map((e) => (
            <Link
              key={e.zu}
              to={e.zu}
              onClick={() => setOffen(false)}
              className="block rounded-md px-3 py-2.5 text-sm"
            >
              {e.text}
            </Link>
          ))}
          <button onClick={abmelden} className="block w-full px-3 py-2.5 text-left text-sm">
            Abmelden
          </button>
        </nav>
      )}
    </header>
  );
}
