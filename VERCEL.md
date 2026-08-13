# Auf Vercel veröffentlichen

## Einmalig einrichten

1. Auf vercel.com anmelden und **Add New → Project** wählen.
2. Das Repository `magnus-110/alppraxis` importieren.
3. Bei *Framework Preset* **Other** stehen lassen – der Rest steht schon in `vercel.json`.
4. Unter **Environment Variables** diese zwei Werte eintragen (für alle Umgebungen):

   | Name | Wert |
   |------|------|
   | `VITE_SUPABASE_URL` | `https://cbrunatvbazchnadsars.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_lFP-QRPMbV6ZMz4yOxAauA_6kCEYVH2` |

5. **Deploy** drücken. Ab jetzt wird bei jedem Push auf `main` automatisch neu veröffentlicht.

Die Region steht auf Frankfurt (`fra1`), damit die Daten in der EU bleiben – genauso wie die
Datenbank.

## Danach in Supabase nachtragen

Damit die Anmeldung und „Passwort vergessen“ funktionieren, muss Supabase die neue Adresse kennen:

*Supabase → Authentication → URL Configuration*

- **Site URL:** die Vercel-Adresse, z. B. `https://alppraxis.vercel.app`
- **Redirect URLs:** zusätzlich `https://alppraxis.vercel.app/**`

## Eigene Domain

Sobald die Domain der Praxis feststeht (z. B. `buchung.alppraxis.de`):

1. In Vercel unter *Settings → Domains* hinzufügen und den angezeigten DNS-Eintrag setzen.
2. In Supabase die Site URL und Redirect URLs auf die neue Domain ändern.
3. Im Code die Adresse an zwei Stellen eintragen:
   - `src/routes/einbetten.tsx` → Konstante `BASIS`
   - Tabelle `practice_settings` → Spalte `basis_url`

## Einbetten auf den beiden Websites

Nach dem ersten Deploy steht unter `/einbetten` der fertige Code zum Kopieren –
einmal für die Alppraxis-Website und einmal für die Schlossanger-Website.

## Demo-Konten

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Praxisleitung | `katrin@demo.alppraxis.de` | `Alppraxis-Demo-2026` |
| Therapeutin | `therapeutin@demo.alppraxis.de` | `Alppraxis-Demo-2026` |
| Rezeption Hotel | `rezeption@demo.schlossanger.de` | `Alppraxis-Demo-2026` |

Diese Konten sind nur zum Ausprobieren gedacht. Bevor echte Patientendaten ins System
kommen, bitte löschen oder mit richtigen Adressen und neuen Passwörtern versehen.
