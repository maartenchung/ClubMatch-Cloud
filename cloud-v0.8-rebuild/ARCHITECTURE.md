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

`mutation-controller.js` dwingt dit protocol af. Alle mutaties lopen serieel door
één wachtrij, gebruiken één `client_event_id` en renderen pas na een opnieuw
opgehaalde bevestigde Cloud-snapshot. Een bezette positie wordt niet als twee
losse positiewijzigingen geschreven; daarvoor is uitsluitend de atomaire
`swap_player_positions`-actie toegestaan.

`snapshot-adapter.js` zet de Supabase-snapshot om naar het centrale eventmodel.
Daarbij worden `match_minute` en `match_second` samengevoegd tot één exacte
wedstrijdseconde. Geannuleerde events verdwijnen uit de projectie en een
correctie vervangt het oorspronkelijke event zonder de auditgeschiedenis te
verwijderen.

`view-model.js` maakt vervolgens één immutable projectie voor live veld,
spelertegels, wisselmonitor, scorebord en dashboard. Deze views delen dezelfde
player-objecten, veld-/banklijsten, posities, klok en eventvolgorde. Geen view
mag eigen wisselkleuren of tijden herberekenen. De semantische kleurstatus is
vast: NEVER_SUBBED = neutraal, SUBBED_BEFORE = paars, JUST_IN = blauw en
JUST_OUT = amber. Groen wordt niet gebruikt als wisselstatus op het speelveld.

`runtime.js` is de enige integratielaag tussen Supabase en de live views. De
runtime haalt bevestigde snapshots op, bouwt LiveMatchState + ViewModel, en
publiceert pas daarna naar de renderer. Mutaties gebruiken dezelfde runtime en
worden na serverbevestiging opnieuw geladen. Realtime `match_state` updates en
een 5-seconden poll zijn alleen triggers om dezelfde confirmed-state refresh uit
te voeren; zij hebben geen eigen stateberekening.

De backend-RPC `swap_player_positions` is een aanvullende v0.8-contractfunctie.
Hij draait als `security invoker`, vereist een ingelogde gebruiker met
match-bewerkingsrechten, wisselt beide posities in één transactie en schrijft één
`position_changed` event met `payload.swap=true`. De bijbehorende SQL staat in
`supabase/cloud_v08_atomic_position_swap.sql`.

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

De branch-workflow `.github/workflows/v08-rebuild-tests.yml` is een verplichte
technische gate voor mutation-controller, snapshot-adapter, view-model en runtime.

Geen versie naar main zolang één van deze gates faalt.
