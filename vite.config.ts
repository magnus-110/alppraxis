// @lovable.dev/vite-tanstack-config bringt TanStack Start, React, Tailwind, Pfad-Aliase
// und die VITE_-Umgebungsvariablen bereits mit. Bitte nichts davon doppelt eintragen.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
