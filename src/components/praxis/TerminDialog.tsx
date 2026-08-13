import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  behandlungsartenLaden,
  patientenSuchen,
  terminBuchen,
  type Behandlungsart,
  type FreieZeit,
  type Patient,
} from "@/lib/daten";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Zeitwahl } from "@/components/buchung/Zeitwahl";

/**
 * Termin aus einem Telefonat heraus eintragen.
 * Bestehende Patientinnen werden gesucht, neue direkt angelegt.
 */
export function TerminDialog({
  offen,
  onSchliessen,
  standorte,
  vorbelegterTag,
  onFertig,
}: {
  offen: boolean;
  onSchliessen: () => void;
  standorte: { id: string; code: string; name: string }[];
  vorbelegterTag?: string | null;
  onFertig?: () => void;
}) {
  const [standortId, setStandortId] = useState(standorte[0]?.id ?? "");
  const [behandlung, setBehandlung] = useState<Behandlungsart | null>(null);
  const [zeitpunkt, setZeitpunkt] = useState<FreieZeit | null>(null);
  const [suche, setSuche] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [neu, setNeu] = useState({ vorname: "", nachname: "", email: "", telefon: "" });
  const [anliegen, setAnliegen] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    if (!standortId && standorte[0]) setStandortId(standorte[0].id);
  }, [standorte, standortId]);

  const { data: behandlungen } = useQuery({
    queryKey: ["behandlungsarten-praxis", standortId],
    queryFn: () => behandlungsartenLaden({ standortId, kanal: "praxis" }),
    enabled: Boolean(standortId) && offen,
  });

  useEffect(() => {
    if (!behandlung && behandlungen?.length) setBehandlung(behandlungen[0]!);
  }, [behandlungen, behandlung]);

  const { data: treffer } = useQuery({
    queryKey: ["patienten-suche", suche],
    queryFn: () => patientenSuchen(suche),
    enabled: offen && suche.trim().length > 1,
  });

  async function speichern() {
    if (!standortId || !behandlung || !zeitpunkt) {
      toast.error("Bitte Behandlung und Zeit wählen.");
      return;
    }
    const name = patient
      ? { vorname: patient.vorname, nachname: patient.nachname }
      : { vorname: neu.vorname, nachname: neu.nachname };
    if (!name.nachname.trim()) {
      toast.error("Bitte einen Nachnamen angeben.");
      return;
    }
    setLaeuft(true);
    try {
      await terminBuchen({
        standortId,
        behandlungsartId: behandlung.id,
        start: zeitpunkt.start,
        vorname: name.vorname,
        nachname: name.nachname,
        email: patient?.email ?? neu.email ?? null,
        telefon: patient?.telefon ?? neu.telefon ?? null,
        quelle: "praxis",
        therapeutId: zeitpunkt.practitioner_id,
        anliegen: anliegen || null,
        patientId: patient?.id ?? null,
      });
      toast.success("Termin eingetragen.");
      onFertig?.();
      onSchliessen();
      setZeitpunkt(null);
      setPatient(null);
      setSuche("");
      setAnliegen("");
      setNeu({ vorname: "", nachname: "", email: "", telefon: "" });
    } catch (e: any) {
      toast.error(String(e?.message ?? "Das hat nicht geklappt."));
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <Dialog open={offen} onOpenChange={(o) => !o && onSchliessen()}>
      <DialogContent className="w-[min(94vw,52rem)]">
        <DialogHeader>
          <DialogTitle>Termin eintragen</DialogTitle>
          <DialogDescription>
            Aus einem Telefonat heraus. Es werden nur wirklich freie Zeiten angeboten.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Standort</Label>
              <Select value={standortId} onChange={(e) => setStandortId(e.target.value)}>
                {standorte.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Behandlung</Label>
              <Select
                value={behandlung?.id ?? ""}
                onChange={(e) =>
                  setBehandlung((behandlungen ?? []).find((b) => b.id === e.target.value) ?? null)
                }
              >
                {(behandlungen ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} · {b.dauer_minuten} Min.
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Patientin oder Patient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="suchen …"
                  value={patient ? `${patient.vorname} ${patient.nachname}` : suche}
                  onChange={(e) => {
                    setPatient(null);
                    setSuche(e.target.value);
                  }}
                />
              </div>
              {!patient && (treffer ?? []).length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                  {(treffer ?? []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                      onClick={() => {
                        setPatient(p);
                        setSuche("");
                      }}
                    >
                      {p.vorname} {p.nachname}
                      <span className="ml-2 text-muted-foreground">{p.telefon ?? p.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!patient && (
              <div className="grid grid-cols-2 gap-3 rounded-md bg-secondary/50 p-3">
                <p className="col-span-2 text-xs text-muted-foreground">
                  Nicht gefunden? Dann hier neu anlegen.
                </p>
                <Input
                  placeholder="Vorname"
                  value={neu.vorname}
                  onChange={(e) => setNeu({ ...neu, vorname: e.target.value })}
                />
                <Input
                  placeholder="Nachname"
                  value={neu.nachname}
                  onChange={(e) => setNeu({ ...neu, nachname: e.target.value })}
                />
                <Input
                  placeholder="E-Mail"
                  value={neu.email}
                  onChange={(e) => setNeu({ ...neu, email: e.target.value })}
                />
                <Input
                  placeholder="Telefon"
                  value={neu.telefon}
                  onChange={(e) => setNeu({ ...neu, telefon: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Anliegen</Label>
              <Textarea value={anliegen} onChange={(e) => setAnliegen(e.target.value)} />
            </div>
          </div>

          <div className="max-h-[52vh] overflow-y-auto pr-1">
            {standortId && behandlung && (
              <Zeitwahl
                standortId={standortId}
                behandlungsartId={behandlung.id}
                gewaehlt={zeitpunkt}
                onWahl={setZeitpunkt}
                hinweisLeer="In dieser Woche ist nichts frei. Über die Zeiten-Seite lässt sich zusätzliche Zeit öffnen."
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern} disabled={laeuft || !zeitpunkt}>
            {laeuft && <Loader2 className="animate-spin" />} Termin eintragen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
