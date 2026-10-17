# Rentenplaner

Rechnet einen BTC- und ETF-Sparplan bis zum Ruhestand durch: Endvermögen, nötiges Kapital für die Wunschrente, Lücke und wie lange das Geld in der Rente reicht.

**App:** https://gregorschulze.github.io/rentenplaner/

## Auf iPhone und Mac installieren

Die App ist eine installierbare Web-App (PWA): eigenes Icon, Vollbild, funktioniert nach dem ersten Öffnen auch offline. Deine Eingaben werden nur lokal auf dem jeweiligen Gerät gespeichert.

- **iPhone:** Link in Safari öffnen → Teilen-Symbol → „Zum Home-Bildschirm"
- **Mac:** Link in Safari öffnen → Menü „Ablage" → „Zum Dock hinzufügen" (ab macOS Sonoma). In Chrome: Installieren-Symbol in der Adressleiste.

## Funktionen

- Bestand und Sparplan für BTC, ETF-Sparplan, Inflation, Ziel-Zusatzrente
- Alter heute und Renteneintritt (40–65) frei wählbar
- BTC-Szenarien Bär / Basis / Bulle (VanEck-Langfristannahmen: 2 % / 15 % / 29 % p.a.) und optional abnehmende Rendite
- Crash-Stresstest, optionale Umschichtung von BTC in ETF vor der Rente, optionale Steuerberechnung
- Anzeige nominal oder in heutiger Kaufkraft
- Getrennte Entnahmequote (bestimmt das nötige Kapital) und Rendite in der Rente (bestimmt, wie lange das Kapital reicht)

## Annahmen

- Renditen sind effektive Jahresraten, monatlich verzinst; Sparraten am Monatsende.
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
