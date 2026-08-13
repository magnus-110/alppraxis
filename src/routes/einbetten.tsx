import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/einbetten")({ ssr: false, component: Seite });

const BASIS = "https://buchung.alppraxis-platzhalter.de"; // PLATZHALTER: echte Domain eintragen

const schnipsel = (pfad: string) => `<div id="alppraxis-buchung"></div>
<script>
(function () {
  var rahmen = document.createElement("iframe");
  rahmen.src = "${BASIS}${pfad}?embed=1";
  rahmen.style.width = "100%";
  rahmen.style.border = "0";
  rahmen.style.minHeight = "760px";
  rahmen.loading = "lazy";
  rahmen.title = "Termin buchen";
  document.getElementById("alppraxis-buchung").appendChild(rahmen);

  // Der Rahmen wächst mit dem Inhalt mit.
  window.addEventListener("message", function (e) {
    if (e.data && e.data.typ === "alppraxis:hoehe") {
      rahmen.style.height = e.data.hoehe + "px";
    }
  });
})();
</script>`;

function Seite() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl">Buchungsfenster einbetten</h1>
      <p className="mb-8 text-muted-foreground">
        Beide Fenster greifen auf denselben Kalender zu. Der Code kommt einfach an die Stelle der
        Website, an der die Buchung erscheinen soll.
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Website der Alppraxis</CardTitle>
            <CardDescription>
              Design der Alppraxis, beide Standorte, Standortauswahl als erster Schritt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-secondary p-4 text-xs">
              <code>{schnipsel("/buchen")}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website des Hotels Schlossanger</CardTitle>
            <CardDescription>Design des Hauses, nur der Standort Pfronten.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-secondary p-4 text-xs">
              <code>{schnipsel("/buchen/hotel")}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ohne eigenes Skript</CardTitle>
            <CardDescription>
              Wenn die Website kein Skript zulässt, reicht auch ein fester Rahmen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-secondary p-4 text-xs">
              <code>{`<iframe src="${BASIS}/buchen?embed=1" style="width:100%;height:900px;border:0" title="Termin buchen"></iframe>`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
