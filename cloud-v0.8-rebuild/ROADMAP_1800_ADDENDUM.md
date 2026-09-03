# ClubMatch Cloud — Roadmap addendum build 1800

Datum: 3 september 2026

Dit addendum is onderdeel van de v0.8-productroadmap en wordt bij de volgende master-roadmapconsolidatie geïntegreerd.

## Integraties

- 🟡 **Sportlink competitie-sync** — nu zichtbaar in de app als `Gepland · niet verbonden` zodat de koppeling niet wordt vergeten.
- ⬜ Echte Sportlink-sync pas na migratie naar de **Stannet VPS**: server-side connector, competitie/wedstrijdimport, team- en spelermapping, retry/logging, conflictcontrole en handmatige validatie.
- Besluit: geen zware browser-sync. Alleen de zichtbare statuskaart draait nu; dit gebruikt verwaarloosbaar extra clientgeheugen.

## Spelers tijdens wedstrijd

- 🟡 **Speler later / gastspeler** — eigen team plus actieve spelers van een ander team binnen dezelfde club en hetzelfde seizoen kunnen tijdens live/rust aan de wedstrijdselectie/bank worden toegevoegd.
- De toevoeging bewaart aankomsttijd, reden, bronteamsignalering en `guest_player` in het event.
- 🔒 Praktijktest: eigen speler en lager-team gastspeler toevoegen, daarna wisselen en Live Actieveld controleren.

## Wisselbeleid & jeugd-belasting

Presets:

- 🟡 **25-50-65** — vaste coachmomenten op minuut 25, 50 en 65.
- 🟡 **Gelijke speeltijd** — voorstel op basis van hoge veldminuten versus lage totale speeltijd.
- 🟡 **Ontwikkelminuten** — meerdere speelblokken om lange onafgebroken banktijd te voorkomen.
- 🟡 **Belastingsgestuurd** — meer evaluatiemomenten, coach bevestigt belastbaarheid.
- 🟡 **Prestatie / tactisch** — geen automatisch tijdstip; cijfers ondersteunen de coach.
- 🟡 **Custom** — eigen wisselminuten.

Per speler tonen: totale speeltijd, banktijd, aantal keer in/uit en volgend richtmoment. ClubMatch doet een voorstel maar wisselt nooit automatisch.

### Trainingsdeelname en belastbaarheid

- ⬜ Clubregel configureerbaar: bijvoorbeeld één gemiste training verlaagt doelminutengroep; twee gemiste trainingen geeft strengere clubregel.
- Ziekte, blessure en fysio/belastbaarheid blijven **apart** van disciplinaire afwezigheid.
- Geen medische details nodig in de gewone live wedstrijdmodule.

## Opleidingsproces

Cyclisch model:

`Doel → training → wedstrijdgedrag → KPI/coachobservatie → evaluatie → nieuw doel`

- ⬜ Positiebenchmark/rivaliteitsproces: gezonde positieconcurrentie op ontwikkeling, training, wedstrijdgedrag, belasting en betrouwbaarheid — nooit alleen één rating.
- ⬜ Clubbrede ontwikkellijnen en leeftijdsovergang.

## Doelgerichte navigatiemodellen

- 🟡 **Matchday Simple** — alleen wedstrijd, score, tijd en wissels.
- 🟡 **Assistent Coach** — Live Actieveld, wisseladvies en kernanalyse.
- 🟡 **Development Coach** — speeltijd, belasting, speleranalyse en trainingfocus.
- 🟡 **Tactical Analyst** — Live Actieveld, passnetwerk en wissel-/formatie-impact.
- 🟡 **Training Planner** — wedstrijdanalyse naar concrete trainingsfocus.
- 🟡 **Club Academy** — opleidingscyclus, positiebenchmark en team/clubtrend.

De gebruiker kiest eerst zijn doel; ClubMatch reduceert daarna cognitieve belasting door vooral de relevante workflows en analyses te tonen.

## Wedstrijd → training

- 🟡 Dashboardadvies vertaalt de zwakst gemeten onderdelen naar trainingsfocus, met bewijs uit de actuele data en een datadekkingswaarschuwing.
- Voorbeelden: slechte passing → positiespel onder druk; laag duelpercentage → 1v1/2v2; veel balverlies → eerste aanname/omschakeling; weinig schoten op doel → afwerking; zwakke verdediging → restverdediging/compactheid.
- ClubMatch presenteert dit als coachadvies, niet als causale waarheid wanneer de datadekking laag is.

## Live positie versus actiepositie

- 🟡 **Rolpositie ≠ actiepositie.** Een speler kan bijvoorbeeld RB zijn en een voorzet geven vanuit rechtsvoor zonder zijn officiële rolpositie tijdelijk naar RW te wijzigen.
- Workflow: `speler → lege plek op Live Actieveld → actie`.
- De x/y-actiepositie wordt aan de actie gekoppeld; de spelerrol blijft intact.

## Reliability build 1800

- 🔒 Wisselcyclus `uit → in → opnieuw aanklikbaar` in Live Actieveld moet browser-gated zijn.
- 🔒 Mobiel moet lege veldpositie voor een actie kunnen vastleggen.
- 🔒 Historie verwijderen = delete RPC → serverlijst opnieuw lezen → bevestigen dat `match_id` weg is → historie + open wedstrijden verversen.
- 🔒 Build 1800 wordt pas naar `clubmatch-pages-v08` gepromoveerd na groene CI en succesvolle GitHub Pages deployment.
