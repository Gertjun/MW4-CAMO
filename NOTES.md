# NOTES – MW4 Camo Tracker

De **actuele stand**: versie, open punten en sessielog. Werk dit bij aan het eind van elke sessie (zie `CLAUDE.md`). Besluiten staan in `DECISIONS.md`, wensen in `WISHLIST.md`.

Laatst bijgewerkt: 12 november 2026 · versie **1.31.2**

---

## 1. Werkwijze
Zie `CLAUDE.md`.

## 2. Stand
PWA om ontgrendelde wapencamo's in Call of Duty Modern Warfare 4 bij te houden, op iPhone, iPad en laptop. Gebouwd op de PWA-template; sync via `Gertjun/SyncData`.

## 3. Open punten en bekende problemen
- Wapenlijst per seizoen bijwerken (staat in de code).
- Fase 1: tests voor mastery/camo-vrijspeelregels uitbreiden en echte browser-/iPhone-/twee-apparatentests uitvoeren.
- Tombstones worden bewust niet automatisch opgeruimd; een veilige opruimstrategie vraagt bevestiging van alle gekoppelde apparaten.

## 4. Sessielog (kort, nieuwste bovenaan)

- **12 nov 2026:**
  - 1.31.2: automatische tests toegevoegd; migratie bewaart tombstones onbeperkt om herintroductie van verwijderde gegevens door lang offline apparaten te voorkomen.
- **11 nov 2026:**
  - 1.31.1: kern gelijk aan template 1.4.2 (bredere zijbalk).
- **11 nov 2026:**
  - 1.31.0: navigatie, Instellingen en kopbalk komen nu uit de kern (template 1.4.1); eigen tabbalk en `settings-view.js` zijn weg. Koppelcode toegevoegd.
- **10 nov 2026:**
  - 1.30.1: gedeelde kern gelijk aan template 1.3.0. CLAUDE.md, NOTES, DECISIONS en WISHLIST toegevoegd.
