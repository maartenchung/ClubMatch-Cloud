# ClubMatch Cloud v0.8 rebuild

## Waarom deze rebuild
v0.7 groeide uit meerdere overlay-scripts die dezelfde state, renderfuncties en acties overschreven. Dat veroorzaakte regressies: een fix voor tijd of sync kon wisselkleuren, posities of een tweede wissel breken.

v0.8 gebruikt daarom één regel: **één eventmodel -> één derived live state -> meerdere pure views**.

## Bron van waarheid
1. Cloud match snapshot + bevestigde events zijn leidend voor een Cloud-wedstrijd.
2. Lokale UI-state mag nooit zelfstandig een bevestigde Cloud-state vervangen.
3. Elke actie krijgt een client_event_id en exacte `match_second`.
4. UI wordt na een bevestigde mutatie opnieuw afgeleid uit dezelfde eventlijst.

## Centrale derived state per speler
- playerId
- initialRole: FIELD | BENCH
- currentRole: FIELD | BENCH
- currentPosition
- startedPosition
- playSeconds
- benchSeconds
- currentStintSeconds
- currentStintStartedAtSecond
- inCount
- outCount
- substitutionCount
- lastSubstitutionSecond
- lastSubstitutionDirection
- changeState: NEVER_SUBBED | JUST_IN | JUST_OUT | SUBBED_BEFORE

## Eventtypes
- MATCH_STARTED
- MATCH_PAUSED
- MATCH_RESUMED
- HALFTIME_STARTED
- SECOND_HALF_STARTED
- MATCH_FINISHED
- SUBSTITUTION
- POSITION_CHANGED
- GOAL

Een positieruil is atomair: beide nieuwe posities worden in één actie/event verwerkt, niet als twee los renderende UI-mutaties.

## Klok
`effectiveMatchSecond` is de enige tijdbron voor:
- wedstrijdklok
- goalminuut
- wisselminuut
- positieminut
- totale speeltijd
- totale banktijd
- huidige veldbeurt
- huidige bankbeurt

Tijdens pauze/rust verandert effectiveMatchSecond niet.

## Views
De volgende onderdelen mogen status/tijden nooit zelf berekenen:
- Live veldopstelling
- Live speeltijd & banktijd
- Wisselmonitor
- Scoreboard
- Dashboard

Zij lezen uitsluitend uit dezelfde derived state.

## UI-regels
- Positie staat op iedere veldspeler-tegel.
- Positie staat op de live veldopstelling.
- Later gebruikt dashboard exact hetzelfde veld.
- Vaste tegelhoogtes: refresh verandert alleen tekst/cijfers/klassen, niet de DOM-structuur.
- Wisselstatuskleuren blijven aanwezig: JUST_IN, JUST_OUT, SUBBED_BEFORE, NEVER_SUBBED. Geen groen voor wisselstatus op het groene speelveld.
- Basisopstelling is immutable wedstrijdhistorie; actuele opstelling is derived state.

## Mutatieprotocol
Voor wissel, positie, goal en klokactie:
1. Lees actuele confirmed state.
2. Valideer actie tegen confirmed state.
3. Neem actuele effectiveMatchSecond.
4. Schrijf één Cloud-mutatie met unieke client_event_id.
5. Wacht op succes.
6. Haal nieuwe Cloud snapshot/events op.
7. Derive state opnieuw.
8. Render alle views.

Geen permanente optimistic mutation vóór stap 5.

## Verplichte regressiegates vóór publicatie
1. Start 11 veldspelers.
2. Eerste wissel A uit / B in.
3. Tweede wissel C uit / D in zonder refresh.
4. Derde wissel B uit / A opnieuw in.
5. Positiewijziging van één veldspeler.
6. Positieruil van twee veldspelers.
7. Wissel waarbij inkomende speler positie van uitgaande speler krijgt.
8. Goal eigen team + assist.
9. Goal tegenstander.
10. Pauze: alle effectieve spelerstijden staan stil.
11. Hervatten: tijden lopen verder zonder sprong.
12. Refresh: basisopstelling blijft gelijk.
13. Refresh: actuele opstelling blijft gelijk.
14. Refresh: speel/banktijden blijven gelijk binnen 1 seconde.
15. Desktop en mobiel tonen dezelfde veld-ID's, posities, score en eventvolgorde.
16. Exact 11 FIELD zolang wedstrijd actief is.
17. Voor iedere geselecteerde speler: playSeconds + benchSeconds == effectiveMatchSecond.
18. Wedstrijd stoppen werkt server-side.
19. Verwijderen vereist waarschuwing en server-side autorisatie.

Geen versie naar main zolang één van deze gates faalt.
