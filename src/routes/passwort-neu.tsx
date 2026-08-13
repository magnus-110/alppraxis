import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export const Route = createFileRoute("/passwort-neu")({ ssr: false, component: Seite });

function Seite() {
  const navigate = useNavigate();
  const [passwort, setPasswort] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    if (passwort.length < 10) {
      toast.error("Bitte mindestens 10 Zeichen verwenden.");
      return;
    }
    setLaeuft(true);
    const { error } = await supabase.auth.updateUser({ password: passwort });
    setLaeuft(false);
    if (error) toast.error("Das hat nicht geklappt. Bitte den Link aus der E-Mail erneut öffnen.");
    else {
      toast.success("Das neue Passwort ist gespeichert.");
      navigate({ to: "/anmelden" });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={speichern} className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl">Neues Passwort</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Passwort</Label>
          <Input id="pw" type="password" value={passwort} onChange={(e) => setPasswort(e.target.value)} />
          <p className="text-xs text-muted-foreground">Mindestens 10 Zeichen.</p>
        </div>
        <Button type="submit" className="w-full" disabled={laeuft}>
          Speichern
        </Button>
      </form>
    </div>
  );
}
