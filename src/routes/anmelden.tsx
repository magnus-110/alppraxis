import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { startseite, type Rolle } from "@/lib/rollen";
import { useMarke } from "@/hooks/useMarke";
import { MARKEN } from "@/lib/marke";

export const Route = createFileRoute("/anmelden")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    marke: s["marke"] === "schlossanger" ? "schlossanger" : undefined,
  }),
  component: Seite,
});

function Seite() {
  const { marke } = Route.useSearch();
  const schluessel = marke === "schlossanger" ? "schlossanger" : "alppraxis";
  useMarke(schluessel);
  const daten = MARKEN[schluessel];

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  async function anmelden(e: React.FormEvent) {
    e.preventDefault();
    setLaeuft(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: passwort });
    if (error || !data.user) {
      toast.error("E-Mail-Adresse oder Passwort stimmt nicht.");
      setLaeuft(false);
      return;
    }
    const { data: rollen } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .limit(1);
    const rolle = (rollen?.[0]?.["role"] ?? "patient") as Rolle;
    navigate({ to: startseite[rolle] });
  }

  async function passwortVergessen() {
    if (!email) {
      toast.message("Bitte zuerst die E-Mail-Adresse eintragen.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/passwort-neu`,
    });
    if (error) toast.error("Das hat nicht geklappt.");
    else toast.success("Wir haben Dir eine E-Mail geschickt.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <img src={daten.logo} alt={daten.logoAlt} className="mx-auto mb-8 h-12 w-auto object-contain" />
        <h1 className="mb-1 text-center text-2xl">Anmelden</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Zugang für das Team der Praxis und die Rezeption.
        </p>

        <form onSubmit={anmelden} className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="passwort">Passwort</Label>
            <Input
              id="passwort"
              type="password"
              required
              autoComplete="current-password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={laeuft}>
            {laeuft ? <Loader2 className="animate-spin" /> : <LogIn />} Anmelden
          </Button>
          <button
            type="button"
            onClick={passwortVergessen}
            className="w-full text-center text-sm text-muted-foreground underline"
          >
            Passwort vergessen
          </button>
        </form>
      </div>
    </div>
  );
}
