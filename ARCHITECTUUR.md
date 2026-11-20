# Architectuur – MW4 Camo Tracker

> **Dit bestand (opbouw):** hoe de app in elkaar zit: bestanden, aansluiting op PWA-Core, datamodel, service worker, conventies en stijl.
> **Niet hier:** de stand van nu → [`README.md`](README.md); wat nog moet → [`ROADMAP.md`](ROADMAP.md); wat er per versie veranderde → [`CHANGELOG.md`](CHANGELOG.md); waarom → [`DECISIONS.md`](DECISIONS.md); werkafspraken → [`CLAUDE.md`](CLAUDE.md).

Alleen HTML, CSS en JavaScript-modules: geen framework, geen build-stap, geen npm-packages of CDN-scripts in de app. De tests gebruiken alleen Node.js (`node --test`).

## Bestanden

```
index.html              Schil: setup-, vergrendel-, app- en instellingenscherm; strikte CSP
manifest.webmanifest    Naam, kleuren en iconen voor installatie
sw.js                   Service worker (offline + updates), VERSION per release
css/base.css            Basisstijl uit PWA-Core (niet aanpassen)
css/app.css             Stijl en kleuren van deze app
js/config.js            Naam, versie, opslag-prefix, datapad, timing
js/main.js              Opstarten
js/app.js               De app: datamodel, migratie, samenvoegen, Overzicht en Camo's
js/catalog.js           Wapens, klassen, camo's, opdrachten en afbeeldingen
js/loadouts.js          Loadouts-scherm
js/attachments.js       Attachments per wapen en slot
js/attachments-data.js  Lijst met attachments
js/device-pairing.js    Koppelen van een nieuw apparaat via QR (adapter op de kern)
js/device-pairing-ui.js Schermen voor de QR-koppeling
js/vendor/qrcode.js     QR-codegenerator (lokaal, met licentiebestand)
js/core/                Gedeelde kern PWA-Core (niet aanpassen, zie hieronder)
icons/                  App-iconen
img/                    Logo, camo- en wapenafbeeldingen (.webp)
tests/                  Automatische tests (node --test)
tools/pin.mjs           Controleert de PWA-Core-pin
tools/precache.mjs      Controleert dat alle kernbestanden in PRECACHE staan
core-manifest.json      Lijst en controlegetallen van de kernbestanden
pwa-core.lock.json      Vastgepinde PWA-Core-versie (tag, commit, SHA-256)
docs/                   Momentopnames, worden niet bijgewerkt
```

## Aansluiting op PWA-Core

- De kern (`Gertjun/PWA-Core`) regelt kluis, versleuteling, synchronisatie, vergrendeling, Face ID/passkey, koppelen, navigatie en Instellingen. De app pint een vaste release in `pwa-core.lock.json` (nu v1.3.0).
- **Bestanden in `core-manifest.json` pas je hier niet aan** (`js/core/*` en `css/base.css`). Een fix daarin hoort in PWA-Core; daarna komt hij via een aparte distributie-PR naar deze app. `node tools/pin.mjs verify` controleert dat de bestanden exact gelijk zijn aan de pin.
- De app levert één object `app` (in `js/app.js`) aan de schil (`js/core/shell.js`):
  - `screens`: de schermen Overzicht, Camo's en Loadouts (Instellingen voegt de kern zelf toe). De schil tekent de tabbalk onderin (iPhone) en de inklapbare zijbalk links (laptop).
  - `schemaVersion`, `initialData()`, `migrate(data)`, `merge(local, remote)` en `render(root, ctx)`.
- **Waarin deze app afwijkt:**
  - QR-koppeling: `js/device-pairing.js` en `js/device-pairing-ui.js` zijn app-eigen schermen rond de kernfunctie, met context `mw4-camo` en eigen bescherming tegen hergebruik (D11). `js/main.js` installeert ze vóór de schil start.
  - De QR-code wordt lokaal gemaakt met `js/vendor/qrcode.js`.

## Instellingen in `js/config.js`

| Instelling | Waarde | Let op |
| --- | --- | --- |
| `version` | MAJOR.MINOR.PATCH | Gelijk houden met `VERSION` in `sw.js` (een test controleert dat) |
| `storagePrefix` | `mw4-camo` | **Nooit wijzigen**: anders is de lokale kluis "weg" |
| `defaultDataPath` | `mw4-camo/vault.json` | Pad van het versleutelde kluisbestand in de private data-repo |
| `autoLockMinutes` | 5 | Per apparaat aan te passen |
| `autoBiometricUnlock` | aan | Face ID start vanzelf |
| `syncDelaySeconds` | 20 | Meerdere wijzigingen worden één commit |
| `minPasswordLength`, `kdfIterations` | 12, 600.000 | Wachtwoordbeveiliging |

## Datamodel

Alles staat in één versleutelde kluis. Gegevensversie: `SCHEMA = 4` in `js/app.js`.

```
{
  schema: 4,
  progress: [{ id, weaponId, camoId, done, doneAt, createdAt, updatedAt }],
  pins:     [{ id: '<wapen-id>', pinned, createdAt, updatedAt }],
  loadouts: [{ id, createdAt, updatedAt, name,
               primary:   { weaponId, attachments: [5 × tekst] },
               secondary: { weaponId | null, attachments: [5 × tekst] },
               notes }],
  overviewOrder: { order: ['summary', …], updatedAt } | null
}
```

- **Voortgang:** één record per camo met een vaste id: `<wapen-id>:<camo-id>` voor gewone en prestige-camo's, `mastery:<camo-id>` voor de negen mastery-camo's (MP, DMZ, Warzone). Uitvinken zet `done` op `false`; er wordt niets verwijderd.
- **Vastgepinde wapens:** één record per wapen; losmaken zet `pinned` op `false`.
- **Loadouts:** verwijderen maakt een grafsteen (`removeById`, `deleted: true`), nooit echt weghalen.
- **Volgorde van het Overzicht:** één waarde; bij synchroniseren wint de nieuwste (`updatedAt`).
- **Wapen- en camolijst** staan in de code (`js/catalog.js`), niet in de kluis. Bestaande wapen- en camo-id's wijzig je nooit: de voortgang verwijst ernaar.
- **Samenvoegen:** `mergeCollections` uit de kern kiest per record de nieuwste wijziging; grafstenen blijven bewaard (D9).

### Geschiedenis van de gegevensversie

| Schema | Wat kwam erbij |
| --- | --- |
| 1 | Camo-voortgang |
| 2 | Loadouts |
| 3 | Vastgepinde wapens, prestige- en mastery-camo's |
| 4 | Volgorde van het Overzicht |

### Gegevensversie verhogen

Alleen nodig als een oudere appversie de nieuwe gegevens niet goed kan samenvoegen (bijvoorbeeld een nieuwe lijst of een andere betekenis van een veld). Nieuwe records in een bestaande lijst (zoals extra camo-vinkjes) hoeven dat niet.

1. Verhoog `SCHEMA` in `js/app.js` en voeg een regel toe aan de tabel hierboven.
2. Breid `migrate(data)` uit, zodat oude gegevens de nieuwe velden krijgen (`??=`).
3. Breid `merge(local, remote)` uit voor de nieuwe velden.
4. Test dat gegevens van de vorige versie laden (`tests/app-data.test.js`). De kern stopt veilig als de kluis in de cloud een nieuwer schema heeft dan de app.

## Vrijspeelregels

- Een camo aanvinken vinkt de eerdere camo's van hetzelfde wapen mee aan; uitvinken haalt alleen die ene weg.
- Platinum vraagt Gold op het aantal wapens bij lancering in de klasse (`LAUNCH_IN_CLASS`); Harmonic Break vraagt Platinum op 33 wapens (`LAUNCH_COUNT`); Divergence en de mastery-camo's vragen Harmonic Break op 33 wapens. Seizoenswapens tellen mee, maar verhogen die aantallen niet (D2).
- Kan een camo nog niet, dan volgt een pop-up met wat er ontbreekt.
- De regels zijn zuivere functies (`progressionRules` in `js/app.js`) en worden rechtstreeks getest in `tests/progression.test.js` (D10).

## Wapenlijst bijwerken (nieuw seizoen)

- Voeg nieuwe wapens toe in `js/catalog.js` met `S(seizoen, …)` en een nieuwe, vaste id. `null` betekent "nog onbekend"; de app toont dat ook zo.
- Zet nieuwe afbeeldingen in `img/camos/` of `img/weapons/` als `.webp` en voeg ze toe aan `PRECACHE` in `sw.js`.
- Noteer de bron in de kop van `js/catalog.js`.

## Service worker en updates

- `sw.js` zet alle bestanden van `PRECACHE` in een cache per versie. **Nieuw bestand? Zet het in `PRECACHE`**, anders werkt het niet offline. `tests/precache.test.js` controleert dat alle genoemde bestanden bestaan; `tools/precache.mjs` dat alle kernbestanden erin staan.
- Geen automatische update: de app toont "Nieuwe versie beschikbaar → Bijwerken". Daarom moeten `version` in `js/config.js` en `VERSION` in `sw.js` altijd samen omhoog.
- Verzoeken naar de GitHub-API en andere domeinen gaan altijd via het netwerk.

## Externe diensten en beveiliging

- De enige externe dienst is de GitHub-API (`https://api.github.com`), voor synchronisatie. Een nieuwe dienst: domein toevoegen aan `connect-src` in de CSP in `index.html`, en offline en fouten netjes afvangen.
- Strikte CSP: geen inline scripts, geen inline stijlen, geen event handlers in HTML.
- Gebruikersinvoer (loadoutnamen, attachments, notities) gaat via `h()` en `textContent`, nooit via `innerHTML`.
- Persoonlijke gegevens staan alleen in de versleutelde kluis. Geen gegevens, wachtwoorden of tokens loggen.

## Bestanden aanbieden

Back-up en export lopen via `saveFile()` uit `js/core/dom.js`: op de iPhone het deelmenu (Bewaar in Bestanden, AirDrop), op de laptop een download. Nooit een eigen downloadlink maken.

## Stijl en indeling

- Kleuren alleen via de CSS-variabelen in `css/app.css` (`--accent`, `--bg`, `--surface`, `--text`, `--muted`, `--border` enz.), met een licht en een donker thema (`prefers-color-scheme`). Geen vaste kleuren in de rest van de CSS.
- Huisstijl uit het MW4-logo: geel `#ffcf00` met bijna-zwart en wit. Geel als tekst op wit is onleesbaar, daarom `--accent-text` (donker goud) voor links en focus.
- Mobiel eerst: knoppen minimaal 44 px, invoervelden met 16 px tekst, rekening houden met safe areas (ook de iPad).
- Tabellen (de lijstweergave van Camo's) passen op het scherm zonder schuifbalk opzij.
- Toegankelijkheid (WCAG 2.2 AA): iconknoppen met `aria-label`, formulieren met zichtbare labels. Voor HTML gelden de regels in `html-best-practices.md` uit de projectkennis.

## Testen

```bash
npm test                         # alle tests (node --test)
node tools/pin.mjs verify        # PWA-Core-pin klopt
node tools/precache.mjs          # kernbestanden staan in PRECACHE
python3 -m http.server 8080      # app lokaal openen op http://localhost:8080
```

Service workers en Web Crypto werken alleen via `https://` of `localhost`. GitHub Actions (`.github/workflows/tests.yml`) draait dezelfde drie controles bij elke pull request.
