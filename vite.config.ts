// @lovable.dev/vite-tanstack-config bringt TanStack Start, React, Tailwind, Pfad-Aliase
// und die VITE_-Umgebungsvariablen bereits mit. Bitte nichts davon doppelt eintragen.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Auf Vercel wird für Vercel gebaut, überall sonst bleibt es beim Standard.
// Die Variable VERCEL setzt Vercel selbst, es ist also nichts einzutragen.
const aufVercel = Boolean(process.env["VERCEL"]);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  ...(aufVercel ? { nitro: { preset: "vercel" } } : {}),
});
