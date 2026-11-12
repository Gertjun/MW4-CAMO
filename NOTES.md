# NOTES – MW4 Camo Tracker

De **actuele stand**: versie, open punten en sessielog. Werk dit bij aan het eind van elke sessie (zie `CLAUDE.md`). Besluiten staan in `DECISIONS.md`, wensen in `WISHLIST.md`.

Laatst bijgewerkt: 12 november 2026 · versie **1.31.5**

---

## 1. Werkwijze
Zie `CLAUDE.md`.

## 2. Stand
PWA om ontgrendelde wapencamo's in Call of Duty Modern Warfare 4 bij te houden, op iPhone, iPad en laptop. Gebouwd op de PWA-template; sync via `Gertjun/SyncData`.

## 3. Open punten en bekende problemen
- Wapenlijst per seizoen bijwerken (staat in de code).
- Tombstones worden bewust niet automatisch opgeruimd; een veilige opruimstrategie vraagt bevestiging van alle gekoppelde apparaten.

## 4. Sessielog (kort, nieuwste bovenaan)

- **12 nov 2026:**
  - Featurebranch `migration/pwa-core-v1.0.0` aangemaakt vanaf `0cb8284` na goedkeuring van het migratieontwerp.
  - PWA-Core v1.0.0 geïntegreerd op de featurebranch; bestaande opslagprefix, datapad en app-schema 4 behouden.
  - Synthetische legacy-kluis-, deletion-ledger- en merge-regressietests toegevoegd; CI- en browseracceptatie nog uit te voeren.

- **12 nov 2026:**
  - 1.31.4: vijf regressietests toegevoegd voor wachtwoord wijzigen en back-upherstel; alle zes kluistests slagen lokaal.
  - Fase 1 praktisch afgerond: browser-, iPhone- en synchronisatietests op twee apparaten door Geert bevestigd.

- **12 nov 2026:**
  - 1.31.3: regressietests toegevoegd voor Platinum/Harmonic-drempels, seizoenswapens, mastery-vrijgave en camo-volgorde.
  - 1.31.2: automatische tests toegevoegd; migratie bewaart tombstones onbeperkt om herintroductie van verwijderde gegevens door lang offline apparaten te voorkomen.
- **11 nov 2026:**
  - 1.31.1: kern gelijk aan template 1.4.2 (bredere zijbalk).
- **11 nov 2026:**
  - 1.31.0: navigatie, Instellingen en kopbalk komen nu uit de kern (template 1.4.1); eigen tabbalk en `settings-view.js` zijn weg. Koppelcode toegevoegd.
- **10 nov 2026:**
  - 1.30.1: gedeelde kern gelijk aan template 1.3.0. CLAUDE.md, NOTES, DECISIONS en WISHLIST toegevoegd.
