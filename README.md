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
- Steuern vereinfacht: ETF-Gewinne effektiv ~18,5 % (Abgeltungsteuer + Soli, 30 % Teilfreistellung) als latente Steuer zum Rentenbeginn; BTC nach 1 Jahr Haltedauer steuerfrei. Ohne Sparerpauschbetrag, Kirchensteuer und Vorabpauschale.
- Modellrechnung, keine Anlage- oder Steuerberatung.

## Entwicklung

```bash
npm install
npm run dev     # lokale Entwicklung
npm test        # Unit-Tests der Rechenlogik (Vitest)
npm run lint    # Lint (oxlint)
npm run build   # Typprüfung und Produktions-Build nach dist/
```

Die Tests in `src/calc.test.ts` prüfen die Rechenlogik gegen von Hand nachrechenbare Fälle: ETF-Sparplan gegen die Endwertformel, Kapitalbedarf, Kaufkraft-Umrechnung, Crash-Stresstest, Umschichtung, Steuern, Entnahmephase sowie Eingabegrenzen und gespeicherte Werte.

Jeder Pull Request und jeder Push auf `main` durchläuft per GitHub Actions Lint, Typprüfung und Tests. Jeder Push auf `main` wird nach bestandenen Tests automatisch auf GitHub Pages veröffentlicht.

Aufbau: `src/calc.ts` enthält die gesamte Rechenlogik, `src/components/` die Oberfläche (React + Recharts, Vite, TypeScript).

## Claude-Seite

Die App läuft zusätzlich als Seite in Claude. Dafür wird alles in eine einzige HTML-Datei gebaut:

```bash
npx vite build --mode artifact   # → dist-artifact/index.html
```

Im Artifact-Modus ist der Offline-Service-Worker abgeschaltet, weil er dort nicht unterstützt wird.
