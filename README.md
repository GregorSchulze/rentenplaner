# Rentenplaner

Rechnet einen BTC- und ETF-Sparplan bis zum Ruhestand durch: Endvermögen, nötiges Kapital für die Wunschrente, Lücke und wie lange das Geld in der Rente reicht.

**App:** https://gregorschulze.github.io/rentenplaner/

## Auf iPhone und Mac installieren

Die App ist eine installierbare Web-App (PWA): eigenes Icon, Vollbild, funktioniert nach dem ersten Öffnen auch offline. Deine Eingaben werden nur lokal auf dem jeweiligen Gerät gespeichert.

- **iPhone:** Link in Safari öffnen → Teilen-Symbol → „Zum Home-Bildschirm"
- **Mac:** Link in Safari öffnen → Menü „Ablage" → „Zum Dock hinzufügen" (ab macOS Sonoma). In Chrome: Installieren-Symbol in der Adressleiste.

## Funktionen

- Oben immer sichtbar: erreichbare Zusatzrente im Verhältnis zur Wunschrente und wie lange das Geld reicht
- Eingaben in fünf Bereichen: Ziel, Bitcoin, ETF, Annahmen, Risiko
- BTC-Szenarien Bär / Basis / Bulle (VanEck-Langfristannahmen: 2 % / 15 % / 29 % p.a.) und optional abnehmende Rendite
- Gesetzliche Rente aus Rentenpunkten: Punkte aus der Renteninformation eingeben oder aus Arbeitsjahren und Gehalt schätzen lassen; Anzeige von gesetzlicher Rente und Gesamtrente ab 67
- Altersvorsorgedepot (ab 2027) als Option im ETF-Tab: Teil der ETF-Rate mit staatlicher Zulage, bis 65 gesperrt, danach Auszahlplan
- Optionale Zusätze: Crash-Stresstest, Umschichtung von BTC in ETF vor der Rente, Steuern
- Anzeige in heutiger Kaufkraft oder nominal
- Chart mit Werten als Tabelle

## Barrierefreiheit

- Native Bedienelemente (Regler, Radio-Buttons, Schalter als Kontrollkästchen mit `role="switch"`), Tabs nach ARIA-Muster mit Pfeiltasten
- Kontraste nach WCAG AA in hellem und dunklem Modus, Unterstützung für „Kontrast erhöhen" und „Bewegung reduzieren"
- Schriftgrößen in rem, folgen der Schriftgröße im Browser
- Ergebnis wird für Screenreader angesagt, Chart hat eine Textbeschreibung und eine Tabelle
- Geprüft mit axe-core (WCAG 2.2 AA): keine Verstöße

## Annahmen

- Renditen sind effektive Jahresraten, monatlich verzinst; Sparraten am Monatsende.
- Gesetzliche Rente vereinfacht: Rentenpunkte × aktueller Rentenwert (42,52 € ab 1. Juli 2026), ohne Abschläge ab 67. Punkte pro Jahr = Bruttogehalt ÷ Durchschnittsentgelt (2026 vorläufig 51.944 €), höchstens bis zur Beitragsbemessungsgrenze (101.400 €). Bis zum Renteneintritt wird mit dem heutigen Gehalt weitergerechnet, danach ohne Beiträge; der Rentenwert steigt wie die Inflation. Bruttorente, vor Kranken- und Pflegeversicherung und Steuern. Die gesetzliche Rente wird nur angezeigt und ändert die Rechnung für BTC und ETF nicht.
- Altersvorsorgedepot vereinfacht: Einzahlungen ab 2027 aus der ETF-Rate (10–150 € im Monat), gleiche Rendite wie beim ETF. Grundzulage 50 Cent je Euro bis 360 € und 25 Cent je Euro bis 1.800 € im Jahr, einmalig 200 € unter 25; Kinderzulage und Sonderausgabenabzug nicht eingerechnet. Auszahlung frühestens mit 65 als Auszahlplan bis mindestens 85, der mit der Inflation steigt. Das Depot zählt nicht zur Zusatzrente ab Renteneintritt, sondern als eigene Auszahlung. Mit Steuern: Auszahlungen voll mit einem wählbaren persönlichen Steuersatz.
- Steuern vereinfacht: ETF-Gewinne effektiv ~18,5 % (Abgeltungsteuer + Soli, 30 % Teilfreistellung) als latente Steuer zum Rentenbeginn; BTC nach 1 Jahr Haltedauer steuerfrei. Ohne Sparerpauschbetrag, Kirchensteuer und Vorabpauschale.
- Modellrechnung, keine Anlage- oder Steuerberatung.

## Entwicklung

```bash
npm install
npm run dev     # lokale Entwicklung
npm run build   # Produktions-Build nach dist/
```

Jeder Push auf `main` wird per GitHub Actions automatisch auf GitHub Pages veröffentlicht.

Aufbau: `src/calc.ts` enthält die gesamte Rechenlogik, `src/components/` die Oberfläche (React + Recharts, Vite, TypeScript).

## Claude-Seite

Die App läuft zusätzlich als Seite in Claude. Dafür wird alles in eine einzige HTML-Datei gebaut:

```bash
npx vite build --mode artifact   # → dist-artifact/index.html
```

Im Artifact-Modus ist der Offline-Service-Worker abgeschaltet, weil er dort nicht unterstützt wird.
