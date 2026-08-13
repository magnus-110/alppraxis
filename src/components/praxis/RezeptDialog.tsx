import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LEER = {
  nummer: "",
  ausstellender_arzt: "",
  ausstellungsdatum: "",
  gueltig_bis: "",
  diagnose: "",
  heilmittel: "",
  einheiten_gesamt: 6,
  dauer_minuten: 20,
  notiz: "",
};

export function RezeptDialog({
  offen,
  patientId,
  onSchliessen,
  onFertig,
}: {
  offen: boolean;
  patientId: string;
  onSchliessen: () => void;
  onFertig?: () => void;
}) {
  const [werte, setWerte] = useState({ ...LEER });
  const [laeuft, setLaeuft] = useState(false);

  async function speichern() {
    setLaeuft(true);
    const { error } = await supabase.from("prescriptions").insert({
      patient_id: patientId,
      nummer: werte.nummer || null,
      ausstellender_arzt: werte.ausstellender_arzt || null,
      ausstellungsdatum: werte.ausstellungsdatum || null,
      gueltig_bis: werte.gueltig_bis || null,
      diagnose: werte.diagnose || null,
      heilmittel: werte.heilmittel || null,
      einheiten_gesamt: Number(werte.einheiten_gesamt) || 6,
      dauer_minuten: Number(werte.dauer_minuten) || 20,
      notiz: werte.notiz || null,
    });
    setLaeuft(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rezept angelegt.");
    setWerte({ ...LEER });
    onFertig?.();
    onSchliessen();
  }

  return (
    <Dialog open={offen} onOpenChange={(o) => !o && onSchliessen()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rezept anlegen</DialogTitle>
          <DialogDescription>
            Termine lassen sich anschließend diesem Rezept zuordnen – über beide Standorte hinweg.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Feld label="Rezeptnummer" wert={werte.nummer} setzen={(v) => setWerte({ ...werte, nummer: v })} />
          <Feld
            label="Ausstellende Praxis"
            wert={werte.ausstellender_arzt}
            setzen={(v) => setWerte({ ...werte, ausstellender_arzt: v })}
          />
          <Feld
            label="Ausgestellt am"
            typ="date"
            wert={werte.ausstellungsdatum}
            setzen={(v) => setWerte({ ...werte, ausstellungsdatum: v })}
          />
          <Feld
            label="Gültig bis"
            typ="date"
            wert={werte.gueltig_bis}
            setzen={(v) => setWerte({ ...werte, gueltig_bis: v })}
          />
          <Feld label="Heilmittel" wert={werte.heilmittel} setzen={(v) => setWerte({ ...werte, heilmittel: v })} />
          <Feld label="Diagnose" wert={werte.diagnose} setzen={(v) => setWerte({ ...werte, diagnose: v })} />
          <Feld
            label="Einheiten insgesamt"
            typ="number"
            wert={String(werte.einheiten_gesamt)}
            setzen={(v) => setWerte({ ...werte, einheiten_gesamt: Number(v) })}
          />
          <Feld
            label="Dauer je Einheit (Minuten)"
            typ="number"
            wert={String(werte.dauer_minuten)}
            setzen={(v) => setWerte({ ...werte, dauer_minuten: Number(v) })}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notiz</Label>
            <Textarea value={werte.notiz} onChange={(e) => setWerte({ ...werte, notiz: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern} disabled={laeuft}>
            {laeuft && <Loader2 className="animate-spin" />} Rezept speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Feld({
  label,
  wert,
  setzen,
  typ = "text",
}: {
  label: string;
  wert: string;
  setzen: (v: string) => void;
  typ?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={typ} value={wert} onChange={(e) => setzen(e.target.value)} />
    </div>
  );
}
