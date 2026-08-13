# Auf dem eigenen Rechner starten

## Einmalig

Du brauchst **Node.js** (Version 20 oder neuer) und **Git**. Beides ist wahrscheinlich schon da,
weil das Schwesterprojekt `korpertherapie_kube` genauso läuft. Zum Prüfen im Terminal:

```bash
node -v
git --version
```

Kommt eine Fehlermeldung statt einer Versionsnummer, fehlt das Programm.
Node.js gibt es auf nodejs.org, dort die Schaltfläche „LTS“ nehmen.

## Projekt holen und starten

**Windows (PowerShell):**

```powershell
git clone https://github.com/magnus-110/alppraxis.git
cd alppraxis
copy .env.example .env
npm install
npm run dev
```

**Mac oder Linux:**

```bash
git clone https://github.com/magnus-110/alppraxis.git
cd alppraxis
cp .env.example .env
npm install
npm run dev
```

`npm install` dauert beim ersten Mal ein paar Minuten. Danach steht im Terminal eine Adresse –
normalerweise:

**http://localhost:8080**

Diese Adresse im Browser öffnen. Solange das Terminal-Fenster offen bleibt, läuft die App.
Zum Beenden im Terminal `Strg` und `C` drücken.

## Wichtig: die Datei `.env`

Sie enthält die Zugangsdaten zur Datenbank und ist bewusst **nicht** im Repository –
deshalb der Schritt mit `copy` beziehungsweise `cp`. Ohne diese Datei startet die App nicht.

## Was Du gleich ausprobieren kannst

| Adresse | Was Du siehst |
|---------|---------------|
| http://localhost:8080/buchen | Buchung im Design der Alppraxis, mit Standortauswahl |
| http://localhost:8080/buchen/hotel | Buchung im Design des Schlossanger |
| http://localhost:8080/rezeption | Zugang der Hotelrezeption |
| http://localhost:8080/praxis | Die Praxis-App |
| http://localhost:8080/einbetten | Der Code zum Einbetten auf beiden Websites |

### Demo-Konten

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Praxisleitung | `katrin@demo.alppraxis.de` | `Alppraxis-Demo-2026` |
| Therapeutin | `therapeutin@demo.alppraxis.de` | `Alppraxis-Demo-2026` |
| Rezeption Hotel | `rezeption@demo.schlossanger.de` | `Alppraxis-Demo-2026` |

Bevor echte Patientendaten ins System kommen: diese drei Konten löschen.

## Einmal in Supabase eintragen

Damit „Passwort vergessen“ auch lokal funktioniert:

*Supabase → Authentication → URL Configuration → Redirect URLs*

```
http://localhost:8080/**
```

Das normale Anmelden mit E-Mail und Passwort geht auch ohne diesen Eintrag.

## Wenn etwas nicht klappt

| Meldung | Was zu tun ist |
|---------|----------------|
| `Die Zugangsdaten für Supabase fehlen` | Die Datei `.env` wurde nicht angelegt – Schritt mit `copy`/`cp` nachholen |
| `Port 8080 is already in use` | Ein anderes Programm belegt den Port. Das andere Programm beenden oder `npm run dev -- --port 8081` nehmen |
| `npm: command not found` | Node.js ist nicht installiert |
| Seite bleibt weiß | Terminal ansehen – dort steht die eigentliche Fehlermeldung |
