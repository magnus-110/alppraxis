import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeEuro, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { datum, euro } from "@/lib/format";
import { rechnungDrucken, rechnungHtml } from "@/lib/rechnung-pdf";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabelle, Kopf, Zeile, Th, Td } from "@/components/ui/tabelle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/praxis/rechnungen")({ ssr: false, component: Seite });

const STATUS_VARIANTE: Record<string, any> = {
  offen: "offen",
  bezahlt: "gut",
  ueberfaellig: "warnung",
  storniert: "secondary",
};

function Seite() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("alle");
  const [zahlungFuer, setZahlungFuer] = useState<any | null>(null);
  const [betrag, setBetrag] = useState("");

  const { data } = useQuery({
    queryKey: ["rechnungen", filter],
    queryFn: async () => {
      let q = supabase
        .from("invoices")
        .select("*, patients(vorname, nachname)")
        .order("datum", { ascending: false });
      if (filter !== "alle") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const zahlungBuchen = useMutation({
    mutationFn: async () => {
      const wert = Number(betrag.replace(",", "."));
      if (!wert) throw new Error("Bitte einen Betrag angeben.");
      const { error } = await supabase.from("payments").insert({
        invoice_id: zahlungFuer.id,
        betrag: wert,
        datum: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Zahlung vermerkt.");
      setZahlungFuer(null);
      setBetrag("");
      qc.invalidateQueries({ queryKey: ["rechnungen"] });
    },
    onError: (e: any) => toast.error(String(e?.message)),
  });

  async function drucken(rechnung: any) {
    const [praxis, posten] = await Promise.all([
      supabase.from("practice_settings").select("*").eq("id", 1).single(),
      supabase.from("invoice_items").select("*").eq("invoice_id", rechnung.id).order("sortierung"),
    ]);
    if (praxis.error || posten.error) {
      toast.error("Die Rechnung konnte nicht geladen werden.");
      return;
    }
    const html = rechnungHtml(praxis.data as any, rechnung, (posten.data ?? []) as any);
    if (!rechnungDrucken(html)) {
      toast.error("Bitte erlaube Pop-up-Fenster, damit die Rechnung geöffnet werden kann.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">Rechnungen</h1>
        <Select className="ml-auto w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="alle">alle</option>
          <option value="offen">offen</option>
          <option value="ueberfaellig">überfällig</option>
          <option value="bezahlt">bezahlt</option>
          <option value="storniert">storniert</option>
        </Select>
      </div>

      <Card>
        <Tabelle>
          <Kopf>
            <tr>
              <Th>Nummer</Th>
              <Th>Datum</Th>
              <Th>Empfänger</Th>
              <Th className="text-right">Betrag</Th>
              <Th className="text-right">Bezahlt</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </Kopf>
          <tbody>
            {(data ?? []).map((r: any) => (
              <Zeile key={r.id}>
                <Td className="font-medium">{r.rechnungsnummer}</Td>
                <Td>{datum(r.datum)}</Td>
                <Td>
                  <Link
                    to="/praxis/patienten/$patientId"
                    params={{ patientId: r.patient_id }}
                    className="hover:underline"
                  >
                    {r.patients?.vorname} {r.patients?.nachname}
                  </Link>
                </Td>
                <Td className="text-right">{euro.format(r.betrag)}</Td>
                <Td className="text-right text-muted-foreground">{euro.format(r.bezahlt)}</Td>
                <Td>
                  <Badge variant={STATUS_VARIANTE[r.status]}>{r.status}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => drucken(r)} title="Drucken">
                      <Printer />
                    </Button>
                    {r.status !== "bezahlt" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Zahlung vermerken"
                        onClick={() => {
                          setZahlungFuer(r);
                          setBetrag(String(Number(r.betrag) - Number(r.bezahlt)));
                        }}
                      >
                        <BadgeEuro />
                      </Button>
                    )}
                  </div>
                </Td>
              </Zeile>
            ))}
          </tbody>
        </Tabelle>
        {(data ?? []).length === 0 && <p className="p-6 text-sm text-muted-foreground">Nichts gefunden.</p>}
      </Card>

      <Dialog open={Boolean(zahlungFuer)} onOpenChange={(o) => !o && setZahlungFuer(null)}>
        <DialogContent className="w-[min(92vw,26rem)]">
          <DialogHeader>
            <DialogTitle>Zahlung vermerken</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Rechnung {zahlungFuer?.rechnungsnummer} über {zahlungFuer ? euro.format(zahlungFuer.betrag) : ""}
          </p>
          <Input value={betrag} onChange={(e) => setBetrag(e.target.value)} placeholder="Betrag in Euro" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setZahlungFuer(null)}>
              Abbrechen
            </Button>
            <Button onClick={() => zahlungBuchen.mutate()}>Speichern</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
