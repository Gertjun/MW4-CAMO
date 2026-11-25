# MW4 Camo Tracker

Installeerbare web-app (PWA) om bij te houden welke camo's je hebt vrijgespeeld in Call of Duty Modern Warfare 4. Ook kun je wapens vastpinnen en loadouts bewaren.

Live: https://gertjun.github.io/MW4-CAMO/

- Je gegevens worden **versleuteld** op het apparaat opgeslagen (AES-256-GCM, met een sleutel afgeleid van je wachtwoord).
- **Synchronisatie** tussen apparaten gaat via één versleuteld bestand in een **private** GitHub-repo.
- Je kunt **ontgrendelen met Face ID / passkey**, met je wachtwoord als terugval.
- De app werkt **offline**. Updates installeer je met de knop "Bijwerken".
- Er zijn geen frameworks en geen build-stap: alleen HTML, CSS en JavaScript-modules.

De app is gebouwd op PWA-Core (`Gertjun/PWA-Core`); de map `js/core/` is die gedeelde kern.

## Waar vind je wat

Elk onderwerp staat op één plek (D14).

| | Vraag | Bestand |
| --- | --- | --- |
| Heden | Wat doet de app en waar staan we nu? | dit bestand, `README.md` (blok "Stand") |
| Heden | Hoe zit de app in elkaar (bestanden, datamodel, conventies, stijl)? | [`ARCHITECTUUR.md`](ARCHITECTUUR.md) |
| Toekomst | Wat moet of kan er nog gebeuren? | [`ROADMAP.md`](ROADMAP.md) |
| Verleden | Wat is er per versie veranderd? | [`CHANGELOG.md`](CHANGELOG.md) |
| Verleden | Waarom is iets zo gekozen? | [`DECISIONS.md`](DECISIONS.md) |
| Werkwijze | Hoe werkt Claude aan deze app (branches, testen, versies)? | [`CLAUDE.md`](CLAUDE.md) |

Momentopname, wordt niet bijgewerkt: `docs/FASE-1-AANBEVELINGEN.md`.

## Stand

Bijgewerkt: 25 november 2026 · migratie-PR **1.34.0** met PWA-Core v1.4.0. Dit blok wordt aan het eind van elke sessie overschreven.

- PWA-Core v1.4.0: gedeelde QR-koppeling zonder PIN of wachtwoord, bestaande v2-codes blijven ondersteund. De code geeft volledige toegang (Core D25). App-eigen QR-code verwijderd; fysieke acceptatie nog open (W4).
- De changelog heeft nog geen regel voor 1.33.1 (W5), en PR #11 is gemerged zonder nieuw versienummer (W6).
- Wapenlijst en camo's: bij met Season 1 tot en met de Warzone-mastery-camo's (1.33.0); wat nog onbekend is staat in W2 en W3.
- Tombstones (sporen van verwijderde gegevens) worden bewust niet automatisch opgeruimd (D9 en W1).
- Documenten en werkwijze volgen sinds 20 november de uniforme opbouw (D14): nieuw `ARCHITECTUUR.md`, W-nummers in de roadmap, wijzigingen via pull request.

## Synchronisatie instellen

1. Gebruik een **private** data-repo. Het kluisbestand staat standaard in `mw4-camo/vault.json`.
2. Maak een **fine-grained personal access token** met alleen toegang tot de data-repo en **Contents: Read and write**.
3. Ga in de app naar Instellingen → Synchronisatie, vul eigenaar, repo en token in en kies *Opslaan en testen*.
4. Op een tweede apparaat kies je bij de eerste start **Bestaande koppelen**. Scan de QR-code van het gekoppelde apparaat (Instellingen → Synchronisatie → Ander apparaat koppelen) of plak de koppelcode. Bij oude v2-codes of handmatige configuratie blijven PIN en/of wachtwoord nodig.

Er is **geen herstel** als je je wachtwoord vergeet. Bewaar het daarom in je wachtwoordmanager.
