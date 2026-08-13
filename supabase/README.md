# Datenbank

Projekt: **Alppraxis** · Region Frankfurt (EU) · `cbrunatvbazchnadsars`

## Migrationen holen

Die Migrationen liegen im Supabase-Projekt. Um sie in dieses Repository zu holen:

```bash
npx supabase login
npx supabase link --project-ref cbrunatvbazchnadsars
npx supabase db pull
```

Danach liegen sie unter `supabase/migrations/`.

## Aufbau in Kürze

**Stammdaten**
`locations` · `practitioners` · `practitioner_locations` · `treatment_types` ·
`treatment_type_locations` · `practitioner_treatment_types` · `fee_codes` ·
`practice_settings` · `booking_settings`

**Kalender**
`availability_rules` (regelmäßige Zeiten, mit `rang`) · `availability_exceptions`
(Urlaub oder zusätzliche Zeit) · `appointments` · `requests`

**Patienten**
`patients` · `prescriptions` · Sicht `rezept_uebersicht` (zeigt genutzte und offene Einheiten)

**Abrechnung**
`invoices` · `invoice_items` · `payments` · `invoice_number_sequence`

**Protokolle**
`email_protokoll` · `audit_log`

## Funktionen

| Funktion | Wer darf | Wofür |
|----------|----------|-------|
| `freie_zeiten(...)` | alle | rechnet die buchbaren Zeiten aus |
| `termin_buchen(...)` | alle | bucht und legt bei Bedarf die Person an |
| `anfrage_stellen(...)` | Team | Anfrage der Rezeption |
| `anfrage_entscheiden(...)` | Praxis | Zusage erzeugt direkt den Termin |
| `termin_absagen(...)` | Team | Absage inklusive E-Mail-Vormerkung |
| `kalender_rezeption(...)` | Rezeption | Zeiten ja, Behandlungsinhalte nein |
| `naechste_rechnungsnummer()` | Verwaltung | fortlaufend je Jahr |
| `rechnungen_faelligkeit_pruefen()` | Verwaltung | markiert überfällige Rechnungen |

## Edge Function

`e-mail-versand` – baut die Texte für Bestätigung, Zusage und Absage.
Ohne `RESEND_API_KEY` wird nichts verschickt, der Text aber vollständig abgelegt.
