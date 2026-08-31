# ClubMatch Cloud v0.8 rebuild

## Waarom deze rebuild
v0.7 groeide uit meerdere overlay-scripts die dezelfde state, renderfuncties en acties overschreven. Dat veroorzaakte regressies: een fix voor tijd of sync kon wisselkleuren, posities of een tweede wissel breken.

v0.8 gebruikt daarom één regel: **één eventmodel -> één derived live state -> meerdere pure views**.

## Bron van waarheid
1. Cloud match snapshot + bevestigde events zijn leidend voor een Cloud-wedstrijd.
2. Lokale UI-state mag nooit zelfstandig een bevestigde Cloud-state vervangen.
3. Elke actie krijgt een client_event_id en exacte `match_second`.
4. UI wordt na een bevestigde mutatie opnieuw afgeleid uit dezelfde eventlijst.

Een snelle lokale klikrespons mag wel als **transient/pending UI** worden getoond. Zo'n marker, status of contextdraft verandert nooit zelfstandig score, tactische positie, speeltijd, banktijd of andere bevestigde wedstrijdstate. Bij Cloudbevestiging wordt de normale confirmed-state runtime opnieuw leidend.

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
- PLAYER_ACTION / action-field eventdata

Een positieruil is atomair: beide nieuwe posities worden in één actie/event verwerkt, niet als twee los renderende UI-mutaties.

## Tactische coördinaten versus actiecoördinaten

v0.8 kent twee strikt gescheiden coördinaatconcepten:

1. **Tactische/Live Veldpositie** — afgeleid uit `currentPosition` / formatie en uitsluitend gewijzigd door expliciete formatie-, positie- of wisselmutaties.
2. **Actiepositie** — opgeslagen bij een concrete gebeurtenis als start/eindcoördinaat in percentages.

Een actiepositie mag nooit automatisch een tactische positie muteren. Ook een lokaal versleepte weergavetegel in het brede Live Actieveld is geen officiële tactische state en is geen verplichte actiepositie.

`action-context-model-v08.js` is eigenaar van deze scheiding en kiest een automatische actie-startpositie in deze prioriteit:

1. relevant eindpunt van de vorige actie binnen dezelfde actuele actieketen;
2. actuele tactische spelercoördinaat;
3. veilige fallback.

Een handmatig gekozen actiepunt overschrijft alleen de gebeurteniscontext. `live-pitch-controller.js` blijft eigenaar van officiële tactische posities.

## Actieketens en context

Acties kunnen via `action_chain_id` logisch aan elkaar worden gekoppeld. De keten bewaart alleen eventdata en context; hij is geen tweede wedstrijdstate. Binnen dezelfde keten kan een eindpunt als voorgesteld startpunt van de volgende actie worden gebruikt.

Context wordt aan hetzelfde `match_events`-event toegevoegd. Er is bewust geen parallelle sidecar-eventtabel. `enrich_match_event_context_v08` mag alleen vooraf gedefinieerde contextvelden aan de bestaande payload toevoegen, waaronder:

- actie-start/eindcoördinaten;
- tactische positie/coördinaten op dat moment;
- coordinate source;
- action-chain-ID;
- wedstrijdfase en score op dat moment;
- optionele druk, afspeelmogelijkheden en resultaat;
- betrokken spelers;
- gesproken/notitiecontext;
- toekomstige videoreferentie;
- actiespecifieke context.

De primaire actie-write blijft het kritieke pad. `action-context-persistence-v08.js` verrijkt de eventdata pas na de primaire write en kan een mislukte contextverrijking lokaal queue-en voor retry. Daardoor wordt een normale live tik niet geblokkeerd door extra contextsync.

## Performance-contract live registratie

De UX-regel is: **speler → actie → klaar**. Een normale actie vereist geen coördinatenpopup of contextformulier.

- lokale pending feedback verschijnt onmiddellijk;
- bevestigde wedstrijdstate blijft Cloud-authoritatief;
- contextverrijking gebeurt buiten het primaire writepad;
- geen volledige paginareload;
- klokticks renderen lichtgewicht;
- live eventvenster blijft begrensd;
- geen heatmap-, AI- of volledige skillratingberekening in het invoerpad;
- contextretry gebruikt een kleine lokale queue;
- zware analyse hoort achteraf of asynchroon.

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

De contextvisualisatie mag alleen transient/recent eventdata tekenen: huidige actie, actuele keten en een klein aantal recente markers/pijlen. Oude context blijft in de database maar hoeft niet in het live veld te blijven staan.

## UI-regels
- Positie staat op iedere veldspeler-tegel.
- Positie staat op de live veldopstelling.
- Later gebruikt dashboard exact hetzelfde veld.
- Vaste tegelhoogtes: refresh verandert alleen tekst/cijfers/klassen, niet de DOM-structuur.
- Wisselstatuskleuren blijven aanwezig: JUST_IN, JUST_OUT, SUBBED_BEFORE, NEVER_SUBBED. Geen groen voor wisselstatus op het groene speelveld.
- Basisopstelling is immutable wedstrijdhistorie; actuele opstelling is derived state.
- Desktop/tablet gebruiken het brede Live Actieveld; exacte actieplek is optioneel.
- Mobiel opent alleen bij expliciete locatiecorrectie een tijdelijk groot/fullscreen veld; nooit na elke actie.

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

`mutation-controller.js` dwingt dit protocol af. Alle mutaties lopen serieel door één wachtrij, gebruiken één `client_event_id` en renderen pas na een opnieuw opgehaalde bevestigde Cloud-snapshot. Een bezette positie wordt niet als twee losse positiewijzigingen geschreven; daarvoor is uitsluitend de atomaire `swap_player_positions`-actie toegestaan.

`snapshot-adapter.js` zet de Supabase-snapshot om naar het centrale eventmodel. Daarbij worden `match_minute` en `match_second` samengevoegd tot één exacte wedstrijdseconde. Geannuleerde events verdwijnen uit de projectie en een correctie vervangt het oorspronkelijke event zonder de auditgeschiedenis te verwijderen.

`view-model.js` maakt vervolgens één immutable projectie voor live veld, spelertegels, wisselmonitor, scorebord en dashboard. Deze views delen dezelfde player-objecten, veld-/banklijsten, posities, klok en eventvolgorde. Geen view mag eigen wisselkleuren of tijden herberekenen. De semantische kleurstatus is vast: NEVER_SUBBED = neutraal, SUBBED_BEFORE = paars, JUST_IN = blauw en JUST_OUT = amber. Groen wordt niet gebruikt als wisselstatus op het speelveld.

`runtime.js` is de enige integratielaag tussen Supabase en de live views. De runtime haalt bevestigde snapshots op, bouwt LiveMatchState + ViewModel, en publiceert pas daarna naar de renderer. Realtime `match_state`/eventtriggers zijn primair; een 15-seconden safety poll gebruikt exact dezelfde confirmed-state refresh en heeft geen eigen stateberekening. Klokprojecties gebruiken een afzonderlijk lichtgewicht tickpad zonder telkens de volledige eventlijst te renderen.

De backend-RPC `swap_player_positions` is een aanvullende v0.8-contractfunctie. Hij vereist een ingelogde gebruiker met match-bewerkingsrechten, wisselt beide posities in één transactie en schrijft één `position_changed` event met `payload.swap=true`.

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
20. Normale live actie vereist geen extra coördinaten- of contexttik.
21. Actiepositiecorrectie verandert tactische positie niet.
22. Actiecoördinaten en action-chain-ID overleven refresh/reopen.
23. Live Actieveld blijft zichtbaar op desktop, tablet landscape/portrait en mobiel.
24. Mobiele locatiecorrectie opent alleen op expliciet verzoek fullscreen.
25. De lokale actiereactie verschijnt vóór een vertraagde Cloudbevestiging.
26. Contextverrijking triggert geen zware volledige live rerender.

De branch-workflows en browser-smokes zijn verplichte technische gates vóór publicatie. Geen build wordt naar `clubmatch-pages-v08` gepubliceerd zolang één gate faalt.
