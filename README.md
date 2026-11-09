# MW4 Camo Tracker

Installeerbare web-app (PWA) om bij te houden welke camo's je hebt vrijgespeeld in Call of Duty Modern Warfare 4. Ook kun je wapens vastpinnen en loadouts bewaren.

Live: https://gertjun.github.io/MW4-CAMO/

- Je gegevens worden **versleuteld** op het apparaat opgeslagen (AES-256-GCM, met een sleutel afgeleid van je wachtwoord).
- **Synchronisatie** tussen apparaten gaat via één versleuteld bestand in een **private** GitHub-repo.
- Je kunt **ontgrendelen met Face ID / passkey**, met je wachtwoord als terugval.
- De app werkt **offline**. Updates installeer je met de knop "Bijwerken".
- Er zijn geen frameworks en geen build-stap: alleen HTML, CSS en JavaScript-modules.

De app is gebouwd op mijn PWA-template. De map `js/core/` is de kern uit die template.

## Structuur

```
index.html              Schil: setup-, vergrendel-, app- en instellingenscherm
manifest.webmanifest    Naam, kleuren en iconen voor installatie
sw.js                   Service worker (offline + updates), VERSION per release
css/base.css            Basisstijl van de template
css/app.css             Stijl van de app
js/config.js            Naam, versie, opslag-prefix, datapad, timing
js/main.js              Opstarten
js/app.js               De app: datamodel, migratie, samenvoegen, Overzicht en Camo's
js/catalog.js           Wapens, klassen, camo's, opdrachten en afbeeldingen
js/loadouts.js          Loadouts-scherm
js/attachments.js       Attachments per wapen en slot
js/attachments-data.js  Lijst met attachments
js/core/                Template-kern (niet aanpassen voor deze app alleen)
  shell.js              Schermen, instellingen, sync, auto-lock, privacy, tabbladen, updates
  vault.js              Versleutelde kluis + lokale opslag
  crypto.js             Versleuteling (Web Crypto)
  biometric.js          Face ID / passkey (WebAuthn PRF)
  github.js             GitHub Contents API-client
  sync.js               Sync-logica (upload, download, samenvoegen, versiebewaking)
  records.js            Hulpfuncties voor records (id, updatedAt, tombstones)
  dom.js                h(), today(), saveFile() en andere hulpfuncties
icons/                  App-iconen
img/                    Logo, camo- en wapenafbeeldingen
CHANGELOG.md            Wijzigingen per versie
```

## Synchronisatie instellen

1. Gebruik een **private** data-repo. Het kluisbestand staat standaard in `mw4-camo/vault.json`.
2. Maak een **fine-grained personal access token** met alleen toegang tot de data-repo en **Contents: Read and write**.
3. Ga in de app naar Instellingen → Synchronisatie, vul eigenaar, repo en token in en kies *Opslaan en testen*.
4. Op een tweede apparaat kies je bij de eerste start **Bestaande koppelen**. Vul daar dezelfde gegevens en hetzelfde wachtwoord in.

Er is **geen herstel** als je je wachtwoord vergeet. Bewaar het daarom in je wachtwoordmanager.

## Een nieuwe versie uitbrengen

1. Verhoog `version` in `js/config.js` **en** `VERSION` in `sw.js` naar hetzelfde nummer.
2. Nieuw bestand toegevoegd? Zet het in `PRECACHE` in `sw.js`.
3. Datamodel gewijzigd? Verhoog `SCHEMA` in `js/app.js` en schrijf een migratie.
4. Noteer de wijziging in `CHANGELOG.md`.
5. Push naar `main`. Geïnstalleerde apps tonen daarna "Nieuwe versie beschikbaar → Bijwerken".

## Lokaal testen

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Service workers en Web Crypto werken alleen via `https://` of `localhost`.
