# Alppraxis – Praxis- und Buchungssoftware

Ein Kalender für beide Standorte. Vier Wege führen dorthin.

| Weg | Was dort möglich ist | Sichtbare Standorte |
|-----|----------------------|---------------------|
| **A** Website der Alppraxis | Buchungsfenster, Standortauswahl als erster Schritt | Pfronten, Roßhaupten |
| **B** Website des Hotels Schlossanger | Buchungsfenster im Design des Hauses | nur Pfronten |
| **C** Rezeption Schlossanger | Termine buchen, Anfragen stellen, Gästeadressen pflegen | nur Pfronten |
| **D** Praxis | Kalender, Anfragen entscheiden, Rezepte, Rechnungen | je nach Rolle |

## Schnellstart

```bash
git clone https://github.com/magnus-110/alppraxis.git
cd alppraxis
cp .env.example .env      # unter Windows: copy .env.example .env
npm install
npm run dev
```

Die App läuft danach auf **http://localhost:8080**

Ausführliche Anleitung inklusive Fehlerbehebung: [LOKAL.md](LOKAL.md)
Veröffentlichen im Internet: [VERCEL.md](VERCEL.md)

## Seiten

| Adresse | Wofür |
|---------|-------|
| `/` | Übersicht mit allen Zugängen |
| `/buchen` | Weg A – Buchung im Design der Alppraxis |
| `/buchen/hotel` | Weg B – Buchung im Design des Schlossanger |
| `/rezeption` | Weg C – Zugang der Hotelrezeption |
| `/praxis` | Weg D – die Praxis-App |
| `/einbetten` | Fertiger Code zum Einbetten beider Buchungsfenster |
| `/anmelden` | Anmeldung für Team und Rezeption |

Beide Buchungsfenster funktionieren mit `?embed=1` ohne Kopf- und Fußzeile im iframe
und melden ihre Höhe an die einbettende Seite, damit der Rahmen mitwächst.

## Demo-Konten

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Praxisleitung | `katrin@demo.alppraxis.de` | `Alppraxis-Demo-2026` |
| Therapeutin | `therapeutin@demo.alppraxis.de` | `Alppraxis-Demo-2026` |
| Rezeption Hotel | `rezeption@demo.schlossanger.de` | `Alppraxis-Demo-2026` |

Nur zum Ausprobieren. Vor dem ersten echten Einsatz löschen.

## Rollen

| Rolle | Darf |
|-------|------|
| `verwaltung` (Katrin) | alles, beide Standorte, erstellt als Einzige Rechnungen |
| `therapeut` | Termine eintragen und ändern, eigene Zeiten öffnen und schließen, Anfragen entscheiden |
| `rezeption` | Termine buchen, Anfragen stellen, Gästeadressen pflegen – keine Rezepte, keine Rechnungen |
| `patient` | vorbereitet für später |

Eine Rolle wird vergeben, indem in der Tabelle `user_roles` ein Eintrag mit der
Benutzer-ID und der Rolle angelegt wird. Therapeutinnen brauchen zusätzlich einen
Eintrag in `practitioners` mit ihrer `user_id`.

## Wie die freien Zeiten entstehen

`freie_zeiten()` in der Datenbank rechnet zusammen:

1. regelmäßige Arbeitszeiten (`availability_rules`)
2. zusätzlich geöffnete Zeiten (`availability_exceptions`, Typ `offen`)
3. minus Urlaub und freie Tage (Typ `geschlossen`)
4. minus bereits vergebene Termine – standortübergreifend, damit niemand doppelt verplant wird
5. minus Vorlauf, Buchungsfenster und Puffer aus `booking_settings`

**Haupttherapeut des Tages:** Arbeitszeiten haben einen `rang`. Rang 1 wird zuerst
gefüllt. Rang 2 erscheint erst dann, wenn Rang 1 zu dieser Uhrzeit schon belegt ist –
genau der bewährte Ablauf, dass bei Andrang jemand dazugeschaltet wird.

Eine Doppelbelegung ist zusätzlich in der Datenbank unmöglich gemacht
(Ausschluss-Bedingung auf `appointments`).

## Anfragen

Ist nichts mehr frei, gibt die Rezeption eine Anfrage weiter statt den Gast wegzuschicken.

- Die Anfrage blockiert keine Zeit – bis zur Entscheidung bleibt alles frei buchbar.
- Offene Anfragen stehen in der Praxis-App unter „Anfragen“ auf einen Blick.
- Zusage erzeugt direkt den Termin, Absage wird vermerkt. Beides merkt eine E-Mail vor.

## Rechnungen

Termine → auswählen → Gebührenziffern ergänzen → fortlaufende Nummer → druckfertiges PDF.

Die Rechnung wird als DIN-A4-Seite im Browser geöffnet und dort über „Drucken“
als PDF gespeichert. Es ist kein zusätzlicher Dienst nötig, und keine Patientendaten
verlassen die eigene Umgebung. Jede Rechnung hat den Status offen, bezahlt oder überfällig.

## E-Mails

Der Versand ist vorbereitet, aber noch nicht mit einem Anbieter verbunden.
Jede E-Mail wird in `email_protokoll` vorgemerkt. Die Edge Function `e-mail-versand`
baut den fertigen Text und legt ihn zum Nachlesen ab.

Zum Scharfschalten:

1. In Supabase unter *Edge Functions → Secrets* den `RESEND_API_KEY` hinterlegen
2. In der App unter *Einstellungen* die Absenderadresse eintragen
3. In `practice_settings` `email_aktiv` auf `true` setzen

In E-Mails an Patientinnen und Patienten stehen niemals Diagnosen oder Behandlungsinhalte.

## Datenschutz

- Alle Daten liegen in der EU (Supabase, Region Frankfurt)
- Jede Tabelle ist gesperrt; der Zugriff hängt an der Rolle (Row Level Security)
- Die Rezeption sieht belegte Zeiten, aber keine Behandlungsinhalte und keine Rezepte
- Die Buchungsfenster greifen ohne Anmeldung nur über geprüfte Datenbankfunktionen zu –
  es sind keine Patientendaten über die Schnittstelle abrufbar
- Backups laufen über Supabase (Free-Tarif: 7 Tage; bei Pro auf Point-in-Time umstellbar)

## Noch offen (Platzhalter im Code)

Alle Stellen sind mit `PLATZHALTER` markiert:

- Domain für die Buchung (`src/routes/einbetten.tsx`, `practice_settings.basis_url`)
- Telefonnummer und E-Mail-Adresse der Praxis (`src/lib/marke.ts`, Einstellungen)
- Anschrift der Außenstelle Roßhaupten
- Steuernummer und Bankverbindung für die Rechnungen
- Preise und Gebührenziffern sind Beispielwerte und sollten geprüft werden
- Die Hausschriften des Hotels (Marat, MaratSans) sind lizenzpflichtig; im Design
  stehen aktuell die freien Schriften Source Serif und Source Sans als Ersatz

## Technik

TanStack Start · React 19 · Tailwind 4 · Supabase (Postgres, Auth, Edge Functions)

Aufbau bewusst nah am Schwesterprojekt `korpertherapie_kube`, damit beides
gleich zu bedienen und in Lovable weiterzubearbeiten ist.
