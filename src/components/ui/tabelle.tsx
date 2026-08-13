import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabelle({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function Kopf({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("[&_th]:border-b [&_th]:border-border", className)} {...props} />;
}

export function Zeile({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr className={cn("border-b border-border/60 last:border-0 hover:bg-secondary/40", className)} {...props} />
  );
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn("px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-3 py-2 align-middle", className)} {...props} />;
}
