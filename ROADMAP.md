# Roadmap – wat moet of kan er nog gebeuren

> **Dit bestand (toekomst):** alles wat nog moet of kan gebeuren: functies, gegevens die nog ontbreken, praktijktests en open vragen. Het is de enige takenlijst.
> **Niet hier:** wat al gebouwd is → [`CHANGELOG.md`](CHANGELOG.md); waarom → [`DECISIONS.md`](DECISIONS.md); de stand van nu → [`README.md`](README.md); hoe het werkt → [`ARCHITECTUUR.md`](ARCHITECTUUR.md).

Bijgewerkt: 20 november 2026 · versie 1.33.1

Elk punt heeft een vast W-nummer dat nooit opnieuw wordt gebruikt (tot 20 november 2026 geschreven als #1, #2 …). Is een punt klaar, dan haal je het hier weg en zet je het nummer in de changelog bij de versie. Ideeën buiten de huidige taak komen hier ook, maar worden niet ongevraagd gebouwd. Volgende vrije nummer: W7.

## Eerst
- W4 **QR-koppeling praktisch testen** — Na PR #10 (PAIR-2) en #11 (QR-code en pincode apart) opnieuw een nieuw apparaat koppelen tussen laptop en iPhone.
- W5 **Changelog aanvullen voor 1.33.1** — PWA-Core v1.3.0 en de QR-koppeling via PAIR-2 staan nog niet in de changelog.
- W6 **Nieuwe versie voor PR #11** — De aparte weergave van QR-code en pincode is na 1.33.1 gemerged zonder nieuw versienummer; geïnstalleerde apps halen hem daardoor misschien niet op. `version` in `js/config.js` en `VERSION` in `sw.js` ophogen.

## Seizoensgegevens
- W2 **Wapenlijst Season 1 bijwerken** — Later in Season 1 komen de JAK 12 (shotgun) en de ZLR Talonhawk (melee) via events; op 18 november nog geen datum of opdrachten bekend.
- W3 **Ontbrekende gegevens aanvullen** — Wapenlevels van de speciale camo's van Cronen Osprey, CSG-35 en Mosin-Nagant (Fractal Snow, Sticker Shock), de DMZ-opdracht van Chained, en afbeeldingen van de zes Season 1-camo's en de drie Warzone-mastery-camo's.

## Later
- W1 **Veilige tombstone-opruiming ontwerpen** — Met bevestiging van alle gekoppelde apparaten (zie D9).
