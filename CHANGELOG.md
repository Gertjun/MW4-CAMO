# Changelog

## 1.10.0

**Gewijzigd**
- De titel bovenin de app toont nu het officiële logo van Call of Duty Modern Warfare 4, met "Camo Tracker" ernaast.
- Het logo past zich aan het thema aan: witte letters in dark mode, donkere letters in light mode (de gele "4" blijft geel). De zachte schaduw uit het originele logo is weggehaald, zodat het scherp blijft op beide achtergronden.

## 1.9.0

**Gewijzigd**
- Het instellingenscherm is overzichtelijker. Op de telefoon vult het nu het hele scherm, en je ziet eerst een kort overzicht: Synchronisatie, Beveiliging, Back-up en Over deze app, elk met de huidige stand erbij (bijvoorbeeld "Gesynchroniseerd 2 min geleden" of "Face ID / passkey aan").
- Tik op een onderdeel om het te openen; met "‹ Terug" ga je terug naar het overzicht.
- Formulieren die je zelden nodig hebt (GitHub-verbinding, wachtwoord wijzigen, back-up terugzetten) zijn ingeklapt tot je erop tikt. Is de synchronisatie nog niet ingesteld, dan staat het GitHub-formulier meteen open.
- "Dit apparaat wissen" staat als aparte rode regel onderaan het overzicht.
- Dit is een wijziging in de template-kern (index.html, core/shell.js, base.css) en kan zo naar de PWA-template.

## 1.8.0

**Toegevoegd**
- Overal waar voortgang staat, zie je nu ook een percentage: bij het totaal (bijvoorbeeld 48 / 462 · 10%), de zes tegels (Gold, Platinum, Harmonic, Divergence, Prestige, Mastery), elk wapen, Prestige op de wapenkaart, de camo-groepen in een opengeklapt wapen, de mastery-kaart en de totalen per klasse en bij Vastgepind.
- Het percentage wordt naar beneden afgerond, zodat je pas 100% ziet als echt alles klaar is.

## 1.7.1

**Opgelost**
- Op brede schermen (laptop) zijn alle wapenkaarten nu even hoog. Er is altijd ruimte voor twee regels opdracht; een langere opdracht wordt afgekort met "…" en staat volledig in het opengeklapte wapen. De regel "Volgende: …" blijft op één regel.

## 1.7.0

**Toegevoegd**
- **Prestige-camo's** bij elk wapen: Pyroclast, Pyroclast Terminus, Pyroclast Scatter en Pyroclast Cascade, met de opdracht erbij. Ze staan onderaan de wapenkaart onder "Prestige".
- **Mastery-camo's**: een eigen kaart onder het totaaloverzicht met de 6 camo's die vrijkomen na Harmonic Break op alle 33 wapens (Multiplayer: Mercurial Drift, Polyatomic Reforged, Orion Reforged; DMZ: Chiral, Ripple Tide, Helio).
- **Wapens vastpinnen**: open een wapen en tik op "Vastpinnen bovenaan". Vastgepinde wapens staan bovenaan in een eigen groep, op al je apparaten.
- **Groeperen op voortgang**: naast groeperen op klasse kun je nu groeperen op Bezig, Niet begonnen en Klaar, of helemaal niet groeperen. Sorteren staat los daarvan.
- Het totaaloverzicht telt ook prestige- en mastery-camo's, en Divergence telt nu per wapen (0/33 of 33/33, want hij komt op alle wapens tegelijk vrij).
- Afbeeldingen bij Divergence en alle nieuwe camo's (bron: mw4.gg).

**Gewijzigd**
- Aanvinken werkt nu zoals op codmunity.gg: vink je een camo aan, dan worden de eerdere camo's van hetzelfde wapen ook aangevinkt (bijvoorbeeld Gold vinkt alle militaire en speciale camo's mee aan). Uitvinken haalt alleen die ene camo weg. Wat van andere wapens afhangt (Platinum, Harmonic Break, de mastery-camo's) wordt niet automatisch aangevinkt; dan zie je nog steeds een pop-up met wat er mist.
- Het datamodel is uitgebreid (schema 3) voor de vastgepinde wapens. Je bestaande voortgang en loadouts blijven gewoon staan. Een apparaat met een oudere versie vraagt eerst om bij te werken.

## 1.6.0

**Toegevoegd**
- Op elke wapenkaart staat onder "Volgende: …" nu ook de opdracht die bij die camo hoort (de multiplayer-opdracht). Zo zie je zonder de kaart te openen wat je moet doen.

## 1.5.0

**Toegevoegd**
- Bovenin de app staan nu twee knoppen: **Camo's** en **Loadouts**. Camo's werkt zoals voorheen.
- Op het scherm Loadouts kun je loadouts opslaan, bewerken en verwijderen. Per loadout: een naam, een primair wapen en (optioneel) een secundair wapen uit de lijst van 33, elk met maximaal 5 attachments als vrije tekst, en een notitie. Bij elk wapen staat de afbeelding.
- Loadouts worden versleuteld in de kluis bewaard en gesynchroniseerd, net als je camo-voortgang.

**Gewijzigd**
- Het datamodel is uitgebreid (schema 2). Je bestaande camo-voortgang blijft gewoon staan. Een apparaat met een oudere versie vraagt eerst om bij te werken.
- Een open pop-up sluit nu vanzelf als de app vergrendelt.

## 1.4.0

**Toegevoegd**
- Bij elk wapen staat nu een afbeelding van het wapen zelf, links in de kop van de wapenkaart. Alle 33 wapens hebben een plaatje (bron: mw4.gg). Ze worden in de app bewaard en werken ook offline.

## 1.3.2

**Gewijzigd**
- Op een laptop en iPad gebruikt de app nu de breedte van het scherm: de wapens staan in twee tot vier kolommen (afhankelijk van de schermbreedte) naast elkaar en de klasse-knoppen passen op het scherm zonder zijwaarts scrollen. Op de iPhone blijft alles hetzelfde.

## 1.3.1

**Toegevoegd**
- Afbeeldingen bij Brown, Gunmetal, Dark Tan, Lime en Garland. Nu hebben alle 110 camo's een afbeelding.
- Opdrachten voor Lime (X-58 Nyx) en Garland (Mojave .357) ingevuld.

## 1.3.0

**Toegevoegd**
- Echte afbeeldingen bij 105 van de 110 camo's (bron: mw4.gg). Ze worden in de app bewaard en werken ook offline.

**Nog niet compleet**
- Geen afbeelding bij Brown, Lime, Garland, Dark Tan en Gunmetal; die tonen een leeg vakje.

## 1.2.0

**Gewijzigd**
- De nagemaakte kleurblokjes zijn vervangen door echte camo-afbeeldingen. Voor nu zijn dat Gold, Platinum, Harmonic Break, Blackwell, Iron en Currents. Camo's waarvan nog geen afbeelding is, tonen een leeg vakje.

## 1.1.0

**Toegevoegd**
- Bij elke camo staat nu een gekleurd blokje dat laat zien hoe de camo eruitziet (kleur en patroon: metaal, vlekken, strepen of korrel). Het is een benadering met CSS, geen echte afbeelding uit het spel.

## 1.0.0

Eerste versie van MW4 Camo Tracker (gebouwd op de PWA-template 1.2.0).

**Toegevoegd**
- Alle 33 wapens van Modern Warfare 4 in 9 klassen, elk met 14 camo's: 8 militair, 3 speciaal en Gold, Platinum en Harmonic Break.
- Bij elke camo de opdracht (multiplayer en DMZ) en vanaf welk wapenlevel hij beschikbaar is. Waar die nog niet bekend is, staat "Opdracht nog onbekend".
- Filteren op klasse (Assault, SMG, Shotgun, LMG, Marksman, Sniper, Pistol, Launcher, Melee) en sorteren op klasse, naam, minste of meeste camo's.
- Totaaloverzicht met voortgang en mastery-tellers (Gold, Platinum, Harmonic Break, Divergence).
- Vrijspeelregels zoals in het spel. Wat nog niet kan, is geblokkeerd met een pop-up die zegt wat er mist:
  - militaire camo's op volgorde;
  - Gold pas na alle 8 militaire en 3 speciale camo's van dat wapen;
  - Platinum pas als alle wapens van de klasse Gold hebben;
  - Harmonic Break pas als alle 33 wapens Platinum hebben;
  - Divergence volgt automatisch bij 33 keer Harmonic Break.
- Knop "Alle militaire aan" per wapen.

**Nog niet compleet**
- Opdrachten ontbreken nog voor: PPSh-41 (Iron), X-58 Nyx (Lime), Type 73 (Outcrop, Foxtrail), APOC-338 (Mineral, Tiger Swipe), Mojave .357 (Wallpaper, Garland), FSS Carbon Edge 1095 (alle speciale en mastery), en de aantallen voor Platinum/Harmonic Break bij assault rifles en launchers.
- Wapenlevels van de militaire camo's zijn alleen bekend voor Han 86, ISO Nightshade, Rezi 12, FiNN LMG, MAR-9, KG-7 Vulcan en SANG 9mm.
