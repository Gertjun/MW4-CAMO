# NOTES – MW4 Camo Tracker

De **actuele stand**: versie, open punten en sessielog. Werk dit bij aan het eind van elke sessie (zie `CLAUDE.md`). Besluiten staan in `DECISIONS.md`, wensen in `WISHLIST.md`.

Laatst bijgewerkt: 17 november 2026 · versie **1.32.0**

---

## 1. Werkwijze
Zie `CLAUDE.md`.

## 2. Stand
PWA om ontgrendelde wapencamo's in Call of Duty Modern Warfare 4 bij te houden, op iPhone, iPad en laptop. Gebouwd op de PWA-template; sync via `Gertjun/SyncData`.

## 3. Open punten en bekende problemen
- QR-koppeling moet na de PR nog praktisch worden getest tussen laptop en iPhone, inclusief openen van de link vanuit de iOS-camera.
- Wapenlijst per seizoen bijwerken (staat in de code).
- Tombstones worden bewust niet automatisch opgeruimd; een veilige opruimstrategie vraagt bevestiging van alle gekoppelde apparaten.

## 4. Sessielog (kort, nieuwste bovenaan)

- **17 nov 2026:**
  - Featurebranch `feature/qr-device-pairing` aangemaakt vanaf de actuele `main` na praktische validatie van PWA-Core v1.2.1.
  - QR-koppeling toegevoegd met de Core-module voor versleutelde overdracht, een losse pincode, een link die het koppelveld automatisch invult en lokale replaybescherming.
  - De bestaande kluis, het schema, de opslagprefix, passkeys en het GitHub-syncformaat blijven ongewijzigd. Praktische iPhone-scan- en koppeltest staat nog open.

- **17 nov 2026:**
  - Upgradebranch `migration/pwa-core-v1.2.1` aangemaakt vanaf actuele `main` (`83f6237`).
  - PWA-Core v1.2.1 geïntegreerd; release-pin, manifestchecksums en offline-precache bijgewerkt. Bestaande opslagprefix, kluisformaat en app-schema 4 behouden.
  - Extra regressiecontrole toegevoegd voor de WebAuthn user.id-limiet van 64 bytes. PR-controles en praktische browser-/apparaatacceptatie volgen.

- **12 nov 2026:**
  - Featurebranch `migration/pwa-core-v1.0.0` aangemaakt vanaf `0cb8284` na goedkeuring van het migratieontwerp.
  - PWA-Core v1.0.0 geïntegreerd op de featurebranch; bestaande opslagprefix, datapad en app-schema 4 behouden.
  - CI op PR #4: 61 tests geslaagd; release-pin en alle 13 Core-bestanden in de precache gevalideerd. Browser-/iPhone-/twee-apparatenacceptatie met uitsluitend synthetische gegevens staat nog open.

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
