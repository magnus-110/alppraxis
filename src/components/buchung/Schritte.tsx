import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function Schritte({ aktuell, titel }: { aktuell: number; titel: string[] }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      {titel.map((t, i) => {
        const erledigt = i < aktuell;
        const aktiv = i === aktuell;
        return (
          <li key={t} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                erledigt && "border-primary bg-primary text-primary-foreground",
                aktiv && "border-primary text-primary",
                !erledigt && !aktiv && "border-border text-muted-foreground",
              )}
            >
              {erledigt ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(aktiv ? "text-foreground" : "text-muted-foreground")}>{t}</span>
            {i < titel.length - 1 && <span className="mx-1 h-px w-4 bg-border sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}
