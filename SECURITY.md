# Sicherheit

## Sicherheitslücke melden

Bitte melde Sicherheitslücken **nicht** als öffentliches Issue, sondern vertraulich über GitHub:
Reiter **Security** → **Report a vulnerability** in diesem Repository.

Hilfreich sind eine kurze Beschreibung, Schritte zum Nachvollziehen und betroffener Browser bzw. Gerät.
Ich antworte so bald wie möglich und veröffentliche die Lücke erst, wenn sie behoben ist.

Unterstützt wird nur die aktuelle Version auf https://gregorschulze.github.io/rentenplaner/ (Branch `main`).

## Datenmodell: alles bleibt im Browser

Der Rentenplaner ist eine rein statische Web-App. Es gibt keinen eigenen Server, kein Konto, kein Login,
keine Cookies, kein Tracking und keine Skripte, Schriften oder Bilder von Drittanbietern.

- **Eingaben** werden nur im `localStorage` des Browsers gespeichert (Schlüssel `rentenplaner.state.v2`),
  getrennt pro Gerät und Browser. Sie werden nie übertragen. Beim Laden werden nur bekannte Felder mit
  gültigem Typ übernommen, alles andere wird verworfen.
- **Offline-Modus:** Der Service Worker (`public/sw.js`) speichert nur die App-Dateien der eigenen Herkunft
  im Browser-Cache, keine Eingaben und keine Antworten fremder Server.
- **Löschen:** „Zurücksetzen" in der App stellt die Standardwerte wieder her. Um alles zu entfernen, die
  Websitedaten für `gregorschulze.github.io` in den Browser-Einstellungen löschen.
- **Hosting:** Die Dateien liefert GitHub Pages aus. Wie bei jedem Webserver sieht GitHub dabei technische
  Verbindungsdaten wie die IP-Adresse, aber keine Eingaben aus der App.

## Schutzmaßnahmen

- **Content-Security-Policy** (als `<meta>`, weil GitHub Pages keine eigenen Header erlaubt): Skripte und
  Styles nur von der eigenen Herkunft, keine Verbindungen zu fremden Servern, keine Plugins, keine Formulare,
  `<base>` nur auf die eigene Herkunft, Trusted Types gegen DOM-XSS.
- **Referrer:** `no-referrer`, beim Verlassen der Seite wird keine Herkunft mitgeschickt.
- **Code:** kein `innerHTML`, `eval` oder `fetch` mit fremden Daten.
- **Lieferkette:** GitHub Actions auf Commit-SHAs gepinnt, jeder Job nur mit den nötigen Rechten,
  `npm ci --ignore-scripts` im Build, Dependabot-Updates mit 7 Tagen Wartezeit.

Grenzen: `frame-ancestors` wirkt nicht als `<meta>`, das Einbetten der Seite in fremde Seiten lässt sich auf
GitHub Pages daher nicht verbieten. Die Einzeldatei für die Claude-Seite (`--mode artifact`) enthält
Inline-Skripte und deshalb keine eigene CSP; dort gelten die Regeln der Claude-Umgebung.
