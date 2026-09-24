# SONNENTOR Recruiting-Plattform – Entwurf

Klickbarer Prototyp für eine moderne Bewerberplattform als Ersatz für die bisherige Umantis-Oberfläche.
Der Entwurf läuft komplett lokal im Browser und braucht keinen Build-Schritt und keine Datenbank. Alle Daten liegen im `localStorage` des Browsers.

## Online-Demo (GitHub Pages)

**https://tkoppensteiner.github.io/sonnentor-recruiting-prototyp/**

> Prototyp mit Beispieldaten. Die Seite ist öffentlich erreichbar, für Suchmaschinen aber gesperrt (`noindex`).
> Bitte keine echten oder vertraulichen Daten eingeben. Alle Eingaben bleiben im jeweiligen Browser und werden nicht übertragen: Jede Person sieht nur ihre eigenen Änderungen.

Direkt als Rolle einsteigen:

| Rolle | Link |
|---|---|
| HR-Recruiter:in | https://tkoppensteiner.github.io/sonnentor-recruiting-prototyp/?as=u2#/admin |
| HR-Leitung | https://tkoppensteiner.github.io/sonnentor-recruiting-prototyp/?as=u3#/admin |
| Führungskraft (Marketing) | https://tkoppensteiner.github.io/sonnentor-recruiting-prototyp/?as=u4#/admin |
| Betriebsrat | https://tkoppensteiner.github.io/sonnentor-recruiting-prototyp/?as=u6#/admin |
| Administrator:in | https://tkoppensteiner.github.io/sonnentor-recruiting-prototyp/?as=u1#/admin |

## Lokal starten

```bash
node server.js
```

Dann **http://localhost:5173** öffnen.

| Bereich | URL |
|---|---|
| Karriereseite (öffentlich) | `http://localhost:5173/#/` |
| Stellenansicht | `http://localhost:5173/#/jobs/643` |
| Bewerbungsformular (Link für den Website-Button) | `http://localhost:5173/#/jobs/643/apply` |
| Druck-/PDF-Ansicht | `http://localhost:5173/#/print/643` |
| HR-Backoffice | `http://localhost:5173/#/login` |
| Direkt als Rolle einsteigen (nur Demo) | `http://localhost:5173/?as=u3#/admin` |

Demo-Benutzer: `u1` Admin · `u2` HR-Recruiter:in · `u3` HR-Leitung · `u4` Führungskraft Marketing · `u5` Führungskraft Logistik · `u6` Betriebsrat.
Im Backoffice kann man oben rechts jederzeit die Rolle wechseln. Unter *Einstellungen* lassen sich die Demo-Daten zurücksetzen.

## Funktionen

**Für Bewerber:innen**
- Karriereseite mit Suche und Filtern nach Standort, Bereich und Arbeitszeit, dazu eine Kachel für Initiativbewerbungen
- Responsive Stellenansicht im SONNENTOR-Look (Kraftpapier, blaues „Klebeband“-Label) mit Benefits, Ansprechperson und fixiertem „Jetzt bewerben“-Button am Handy
- Bewerbung in 3 Schritten **ohne Registrierung und ohne Passwort**, mit Drag-&-Drop-Upload, Validierung, Zusatzfragen je Stelle, Talente-Pool-Einwilligung und Datenschutzbestätigung

**Für HR und Führungskräfte**
- Dashboard mit Kennzahlen, neuesten Bewerbungen, offenen Aufgaben (Freigaben, Anforderungen), Bewerbungskanälen und Pipeline
- Stellen-Editor mit **Live-PDF-Vorschau**, Listen-Editor für Aufgaben, Profil und Angebot, Benefit-Auswahl, Gehaltsangabe und Konfiguration des Bewerbungsformulars (Pflicht, optional oder ausgeblendet, plus Zusatzfragen)
- Link zum Kopieren für die Einbindung auf der Website
- Bewerbermanagement als Kanban-Board (Drag & Drop) oder Liste, Detailansicht mit Bewertung, Kommentaren, Verlauf, Absage-Mail-Vorlage und DSGVO-Löschung
- **Template-Designer** für die PDF-Ausschreibung:
  - 3 Stile: Kraftpapier, Klar, Sonne
  - Farben, Schriften, Logo-Position und Dichte
  - Abschnitte ein- und ausblenden und umsortieren
  - Überschriften und Fußzeile anpassen
  - optionaler QR-Code „Jetzt bewerben“
  - Vorschau mit einer beliebigen Stelle und Markierung von Seitenumbrüchen
- **Stelle + Vorlage = fertige Ausschreibung**: PDF-Export über den Browser („Als PDF speichern“, A4, echter Text)

Beispiel-PDFs liegen in [`beispiele/`](beispiele/).

## Rollen- und Rechtekonzept

Die Rechte sind feingranular (22 Einzelrechte) und werden Rollen zugeordnet. Administrator:innen können die Matrix unter *Rollen & Rechte* anpassen und eigene Rollen anlegen.

| Recht | Admin | HR-Leitung | Recruiter:in | Führungskraft | Betriebsrat |
|---|:-:|:-:|:-:|:-:|:-:|
| Alle Stellen sehen | ✔ | ✔ | ✔ | – (nur eigene) | ✔ |
| Stellenanforderung stellen | ✔ | ✔ | ✔ | ✔ | – |
| Stellen anlegen & bearbeiten | ✔ | ✔ | ✔ | – | – |
| Stellen freigeben (4-Augen) | ✔ | ✔ | – | – | – |
| Veröffentlichen / beenden | ✔ | ✔ | ✔ | – | – |
| Bewerbungen sehen | alle | alle | alle | nur eigene Stellen | alle (anonymisiert) |
| Personenbezogene Daten & Dokumente | ✔ | ✔ | ✔ | ✔ | – |
| Bewerten, Status ändern, Absagen | ✔ | ✔ | ✔ | nur bewerten | – |
| DSGVO-Löschung | ✔ | ✔ | – | – | – |
| Vorlagen gestalten | ✔ | ✔ | – | – | – |
| PDF exportieren | ✔ | ✔ | ✔ | ✔ | – |
| Benutzer, Rollen, Einstellungen | ✔ | nur Einstellungen | – | – | – |
| Protokoll | ✔ | ✔ | ✔ | – | – |

**Regeln auf Datenebene**
- Führungskräfte sehen nur Stellen ihres Bereichs oder Stellen, bei denen sie als Führungskraft eingetragen sind, und nur deren Bewerbungen.
- **4-Augen-Prinzip:** Wer eine Stelle einreicht, darf sie nicht selbst freigeben (Ausnahme: Admin).
- **Anonymisierung:** Ohne das Recht „Personenbezogene Daten“ werden Namen, Kontaktdaten und Dokumente ausgeblendet.
- Jede relevante Aktion wird im Protokoll festgehalten (Audit-Trail).

**Stellen-Workflow**

`Anforderung (Führungskraft) → Entwurf (HR) → In Freigabe → Veröffentlicht ⇄ Pausiert → Beendet`

## Für den Produktivbetrieb (Vorschlag)

| Thema | Empfehlung |
|---|---|
| Frontend | Die Oberfläche als React/Vue- oder Blazor-App übernehmen; Design und Struktur aus diesem Entwurf |
| Backend/API | ASP.NET Core oder Node.js mit REST-API; Rechte serverseitig prüfen (der Entwurf prüft nur im Browser!) |
| Datenbank | SQL Server / PostgreSQL |
| Anmeldung HR | Microsoft Entra ID (SSO); Rollen über Entra-Gruppen |
| Dokumente | Verschlüsselter Blob-Speicher, Virenscan beim Upload, signierte Download-Links |
| PDF | Serverseitig mit Playwright/Chromium aus derselben HTML-Vorlage erzeugen (identisch zur Vorschau) |
| E-Mail | Eingangsbestätigung, Absagen und Einladungen über Vorlagen (z. B. Microsoft Graph oder SMTP) |
| DSGVO | Automatische Löschjobs (6 Monate bzw. 24 Monate im Talente-Pool), Auskunft und Export, Auftragsverarbeitung |
| Website | Button-Link auf `/jobs/{ref}/apply`; optional Stellenliste per JSON-Feed oder Widget auf sonnentor.com einbinden |
| Multiposting | Später: Export zu karriere.at, AMS, LinkedIn (XML-Feed) |

## Offene Punkte / Hinweise

- **Logo** ist ein gezeichneter Platzhalter und muss durch das Original-Logo (SVG) ersetzt werden.
- **Bilder** sind Stockfotos (Unsplash) als Platzhalter; produktiv mit eigenem Bild-Upload.
- Hochgeladene Dateien werden im Entwurf nur mit Name und Größe gespeichert, E-Mails werden nicht versendet.
- Für QR-Code und Schriften braucht der Entwurf Internetzugang (CDN, Google Fonts). Produktiv sollte beides selbst gehostet werden.

## Projektstruktur

```
index.html          Einstieg
server.js           Mini-Webserver (node server.js)
css/app.css         Oberfläche (Karriereseite + Backoffice)
css/posting.css     A4-Ausschreibung (Vorschau & PDF)
js/store.js         Datenmodell, Demo-Daten, Rollen & Rechte
js/ui.js            Icons, Logo, Modals, Hilfsfunktionen
js/posting.js       Renderer Stelle + Vorlage → Ausschreibung, PDF-Export
js/public.js        Karriereseite, Stellenansicht, Bewerbungsformular
js/admin.js         Login, Layout, Dashboard, Stellen & Editor
js/admin2.js        Bewerbungen, Template-Designer, Benutzer, Rollen, Einstellungen, Protokoll
js/app.js           Router
```
