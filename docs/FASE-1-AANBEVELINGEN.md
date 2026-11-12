# Fase 1 – aanbevelingen en stabilisatie

Dit document bundelt de technische aanbevelingen uit de repositoryreview en de uitwerking voor fase 1. Het gaat om betrouwbaarheid van de kluis, synchronisatie, gegevensintegriteit en regressietests.

## Samenvatting

De app heeft een goede basis: de kluis gebruikt AES-GCM, wachtwoorden worden via PBKDF2 afgeleid, synchronisatie verloopt via een versleuteld bestand en de service worker houdt de app offline beschikbaar. De belangrijkste zwakte was niet de versleuteling, maar het ontbreken van geautomatiseerde tests rond gegevensverlies en synchronisatie.

**Prioriteit 1: voorkom dat verwijderde gegevens na lange offlineperioden terugkomen.** De huidige code ruimt verwijdermarkeringen (tombstones) na 180 dagen op. Een apparaat dat langer offline is, kan nog een oude versie van een record hebben en die na terugkeer opnieuw synchroniseren. Zonder een mechanisme dat bevestigt dat alle apparaten de verwijdering hebben ontvangen, is opruimen niet veilig.

## Aanbevelingen

### 1. Automatische tests in GitHub Actions
- Voeg een Node.js-testomgeving toe zonder externe testbibliotheken.
- Laat tests automatisch draaien bij pushes naar `main`, fase-1-branches en pull requests.
- Laat een mislukte test de workflow rood maken; een succesvolle Pages-deployment is geen vervanging voor functionele tests.
- Bewaar tests bij de onderdelen die ze afdekken.

**Acceptatie:** de complete testsuite draait automatisch en alle tests slagen op de actuele code.

### 2. Kluis en cryptografie
- Test versleutelen en ontsleutelen van representatieve JSON-data.
- Test dat gewijzigde ciphertext en een verkeerde sleutel worden geweigerd.
- Test inpakken en uitpakken van de datasleutel met een wachtwoordsleutel.
- Test aanmaken, opslaan, vergrendelen en opnieuw ontgrendelen van de lokale kluis.
- Test wachtwoordwijzigingen en herstel van back-ups aanvullend in een volgende iteratie.
- Voer geen echte tokens of gebruikersdata in tests in; gebruik uitsluitend synthetische gegevens.

**Acceptatie:** de tests tonen aan dat data round-tript en dat verkeerde wachtwoorden of gewijzigde ciphertext niet stilzwijgend worden geaccepteerd.

### 3. Synchronisatie en gegevensintegriteit
Test minimaal deze situaties met een gesimuleerde GitHub API:
- Een lege cloudrepo: eerste upload.
- Geen wijzigingen: sync blijft een no-op.
- Alleen lokaal gewijzigd: upload.
- Alleen remote gewijzigd: download.
- Beide apparaten gewijzigd: samenvoegen zonder onafhankelijke wijzigingen kwijt te raken.
- Gelijktijdige cloudwijziging / HTTP-conflict: opnieuw ophalen en opnieuw proberen.
- Een remote schema dat nieuwer is dan de app: veilig stoppen.
- Een wijziging tijdens het ophalen: geen oudere lokale toestand overschrijven.

**Acceptatie:** onafhankelijke wijzigingen blijven behouden en fouten leiden niet tot een stille overschrijving.

### 4. Verwijdermarkeringen (tombstones)
- Verwijdermarkeringen zijn nodig om verwijderingen tussen apparaten te verspreiden.
- Verwijder ze niet na een vaste termijn zolang niet bekend is dat alle gekoppelde apparaten de verwijdering hebben ontvangen.
- Een veilige toekomstige opruimstrategie vereist bijvoorbeeld apparaatregistratie met bevestigde sync-versies, of een expliciete reset/herkoppeling van apparaten.
- Houd rekening met opslaggroei; meet die eerst met realistische datasets.

**Acceptatie:** een apparaat dat lange tijd offline is geweest kan geen verwijderd record opnieuw introduceren nadat het weer synchroniseert.

### 5. Camo- en mastery-regels
- Test de aantallen per wapencategorie voor Platinum.
- Test de drempel van 33 wapens voor Harmonic Break.
- Test dat seizoenswapens niet onbedoeld de lanceringsaantallen verhogen.
- Test de volgorde van Gold → Platinum → Harmonic Break → Divergence/mastery.
- Test blokkademeldingen en randgevallen wanneer een wapen of camo nog niet beschikbaar is.

**Acceptatie:** alle in-game vrijspeelregels zijn als testgevallen vastgelegd, inclusief uitzonderingen.

### 6. Migraties en versiebeheer
- Test migraties van schema 1, 2 en 3 naar het actuele schema 4.
- Test dat bestaande voortgang, loadouts, pins en overzichtsvolgorde behouden blijven.
- Test dat een schema uit de toekomst niet door een oudere app wordt teruggezet.
- Houd `js/config.js` en `sw.js` gelijk bij elke release.
- Voeg nieuwe lokale bestanden toe aan de service-worker-precache.

**Acceptatie:** migraties zijn reproduceerbaar en de app-versie en service-worker-versie lopen nooit uiteen.

### 7. PWA, offline en updates
- Controleer dat elk bestand uit `PRECACHE` daadwerkelijk bestaat.
- Test in een echte browser dat de app na een eerste online bezoek offline opent.
- Test dat een nieuwe versie wordt gedownload en dat de gebruiker de update kan toepassen.
- Test dat een update geen lokale kluis wist of overschrijft.
- Test op iPhone/iPad en desktop; Node-tests kunnen browsergedrag niet volledig simuleren.

**Acceptatie:** een release is niet alleen gedeployed, maar ook handmatig gecontroleerd op offline gebruik en updategedrag.

### 8. Beveiliging
- Behoud de strenge Content Security Policy.
- Houd GitHub-tokens buiten broncode, logs, testfixtures en documentatie.
- Gebruik voor de datarepo uitsluitend de minimaal benodigde GitHub-rechten.
- Voer periodiek een dependency- en statische beveiligingscontrole uit, ook al gebruikt de app weinig of geen externe packages.
- Een statische codecontrole is geen penetratietest.

**Acceptatie:** geen geheimen in de publieke repository en geen onnodige permissies of externe afhankelijkheden.

## Uitvoering fase 1

| Onderdeel | Status |
|---|---|
| Node-testbasis en GitHub Actions | Toegevoegd op fase-1-branch |
| Tests voor records en samenvoegen | Toegevoegd |
| Tests voor schema/migratie en app-merge | Toegevoegd |
| Tests voor AES-GCM en wachtwoordsleutels | Toegevoegd |
| Tests voor lokale kluis | Toegevoegd |
| Gesimuleerde sync-tests | Toegevoegd |
| Versie/precache-controles | Toegevoegd |
| Tests uitvoeren en fouten oplossen | Nog te bevestigen via GitHub Actions |
| Echte browser-/iPhone-/twee-apparatentest | Nog handmatig uit te voeren |

## Grenzen van deze review

- De tests gebruiken synthetische data en een nagebootste GitHub API.
- Ze bewijzen niet dat synchronisatie tussen twee echte apparaten foutloos werkt.
- De WebAuthn/Face ID-flow vereist een echte browser en authenticator en wordt niet door deze Node-tests afgedekt.
- De Pages-deployment blijft een aparte controle naast de testworkflow.
- De private datarepository en tokens zijn niet benaderd of gewijzigd.
