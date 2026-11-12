# DECISIONS – MW4 Camo Tracker

Besluiten die een volgende sessie moet kennen. Oude besluiten pas je niet aan; een nieuw besluit vervangt een oud ("vervangt D3").

### D1 – Eén vinkje per camo (okt 2026)
- **Besluit:** geen aparte MP/DMZ-vinkjes; de uitdagingstekst staat bij elke camo.

### D2 – Mastery-volgorde afdwingen (okt 2026)
- **Besluit:** een camo die nog niet kan, wordt geblokkeerd met een pop-up die laat zien wat er nog ontbreekt. Platinum vraagt Gold op het aantal wapens bij lancering in de klasse; Harmonic Break komt bij 33 Platinum. Nieuwe seizoenswapens tellen mee, maar verhogen die aantallen niet.
- **Waarom:** in-game regel, door Geert gecontroleerd.

### D3 – Wapenlijst in de code (okt 2026)
- **Besluit:** de wapenlijst staat in de code en wordt per seizoen bijgewerkt.

### D4 – Echte camo-afbeeldingen (okt 2026)
- **Besluit:** elke camo met de echte afbeelding uit de game, geen CSS-kleur.

### D5 – Drie schermen met tabbalk (okt 2026)
- **Besluit:** Overzicht, Camo's en Loadouts in een tabbalk onderaan; op de laptop een inklapbare zijbalk links, zoals in Crypto Portfolio.

### D6 – Loadouts als vrije tekst (okt 2026)
- **Besluit:** per loadout: naam, primair en secundair wapen met attachments als vrije tekst, en een notitie.

### D7 – Gedeelde kern van de PWA-template (10 nov 2026, template 1.3.0)
- **Besluit:** `js/core/` en `css/base.css` zijn gelijk aan de PWA-template (1.3.0) en aan de andere template-apps. Passkeys gebruiken een vaste PRF-invoer per app, zodat een bestaande passkey na opnieuw installeren weer werkt (*Bestaande passkey*). Face ID start vanzelf (`autoBiometricUnlock`), vergrendeltijd per apparaat.
- **Waarom:** Geert wil al zijn apps uniform. De MW4-aanpak voor passkeys is als standaard gekozen.

### D8 – Navigatie en Instellingen uit de kern (11 nov 2026, 1.31.0)
- **Besluit:** de app heeft geen eigen tabbalk, zijbalk of instellingenweergave meer; schermen staan in `app.screens` en de schil tekent ze (template D6). Vervangt D5 voor de vorm van de navigatie; de drie schermen blijven.
- **Waarom:** Geert wil al zijn apps dezelfde indeling geven.

### D9 – Verwijdermarkeringen niet automatisch opruimen (12 nov 2026)
- **Besluit:** verwijdermarkeringen (tombstones) blijven bewaard zolang de app niet kan vaststellen dat alle gekoppelde apparaten de verwijdering hebben ontvangen.
- **Waarom:** een apparaat dat langer offline is dan de bewaartermijn kan anders oude records opnieuw synchroniseren. Opslaggroei is veiliger dan stil verlies van een verwijdering.
