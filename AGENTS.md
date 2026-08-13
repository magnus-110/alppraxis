# Hinweise für die Weiterarbeit

- Sprache im Code und in der Oberfläche: Deutsch. Bezeichner in der Datenbank sind
  überwiegend deutsch, Tabellennamen englisch (gewachsen aus dem Schwesterprojekt).
- Gäste und Patienten werden geduzt – so wie auf beiden Websites.
- Farben und Schriften stehen ausschließlich in `src/styles.css`.
  Das Design wird über `data-marke="schlossanger"` am `<html>`-Element umgeschaltet.
- Texte, Logos und Telefonnummern je Marke stehen in `src/lib/marke.ts`.
- Alles, was ohne Anmeldung erreichbar sein muss, läuft über Datenbankfunktionen
  (`freie_zeiten`, `termin_buchen`) – niemals über direkten Tabellenzugriff.
- In E-Mails an Patientinnen und Patienten dürfen keine Diagnosen stehen.
