# ClubMatch Cloud v0.8 — Handleiding live registratie

## Hoofdregel

**Normale live bediening blijft: SPELER → ACTIE → KLAAR.**

ClubMatch gebruikt context om de analyse rijker te maken, maar context mag de live registratie nooit vertragen. Exacte locatie, richting en extra context zijn daarom verrijkingen en geen verplichte invoerstappen.

---

## Live Veldpositie versus Actiepositie

ClubMatch maakt een hard onderscheid tussen twee soorten veldcoördinaten.

### Live Veldpositie
De **Live Veldpositie** is de tactische positie van de speler in de actuele veldopstelling. Een RW kan bijvoorbeeld tactisch op `x=82%, y=20%` staan.

Deze positie hoort bij de live/tactische wedstrijdstate en verandert alleen via een expliciete positie-, formatie- of wisselactie.

### Actiepositie
De **Actiepositie** is de plek waar een concrete gebeurtenis daadwerkelijk plaatsvindt. Dezelfde RW kan bijvoorbeeld een voorzet geven vanaf `x=91%, y=14%`.

Die `91/14` wordt bij de gebeurtenis opgeslagen en **wijzigt nooit automatisch de tactische Live Veldpositie**.

Dit betekent ook dat je een speler niet voor iedere actie over het tactische veld hoeft te slepen. De live opstelling blijft het tactische beeld; gebeurtenissen hebben hun eigen actiecoördinaten.

---

## Hoe ClubMatch automatisch een actiepositie kiest

Bij een normale actie vraagt ClubMatch niet eerst om een coördinaat. De voorgestelde startlocatie wordt automatisch gekozen in deze volgorde:

1. het relevante eindpunt van de vorige actie in dezelfde actuele actieketen;
2. anders de actuele tactische Live Veldpositie van de speler;
3. anders de bestaande veilige veldfallback.

De actie wordt direct geregistreerd. Je hoeft de voorgestelde locatie niet te bevestigen.

### Wanneer locatie corrigeren?
Gebruik **⌖ Locatie aanpassen** alleen als de automatische plek voor de analyse duidelijk onvoldoende klopt. Voorbeeld: de RW staat tactisch op `82/20`, maar de voorzet kwam werkelijk vanaf `91/14`.

De correctie geldt alleen voor die gebeurtenis. De tactische spelerpositie blijft ongewijzigd.

### Wanneer een eindpunt/target toevoegen?
Gebruik **↗ Richting/target** wanneer de richting van de actie relevante extra informatie geeft. Dit is optioneel.

---

## Voorbeelden per actie

### Pass
Normaal: `speler A → speler B`.

ClubMatch kan de pass als een actie met **start → eind** opslaan. Het eindpunt van de vorige actie kan automatisch het startpunt van deze pass worden. De ontvangende speler vormt vervolgens het logische vervolg van dezelfde actieketen.

Optionele context kan later onder andere zijn: vooruit/breed/terug, vrij/onder druk, afspeelmogelijkheden en aangekomen/onderschept/uit.

### Dribbel
Normaal: speler kiezen → **Dribbel** → klaar.

De startlocatie wordt automatisch voorgesteld. Wanneer de afgelegde richting belangrijk is, voeg je optioneel een eindpunt toe. Mogelijke context: 1-tegen-1, ruimte ingedribbeld, gewonnen/verloren en drukniveau.

### Voorzet
Normaal: speler kiezen → **Voorzet** → klaar.

De startlocatie wordt automatisch vastgelegd. Voeg alleen wanneer nuttig een target toe. Daardoor kan ClubMatch later bijvoorbeeld onderscheid maken tussen een technisch slechte voorzet en een voorzet waarvoor geen bezetting in het strafschopgebied aanwezig was.

### Schot
Normaal: speler kiezen → **Schot** of **Op doel** → klaar.

Minimaal wordt de schotlocatie ondersteund. Een doelzone/target kan later optioneel worden toegevoegd. Context kan onder andere open kans/onder druk, binnen/buiten zestien en op doel/naast/geblokkeerd/doelpunt bevatten.

### Balverlies
Normaal: speler kiezen → **Balverlies** → klaar.

De locatie waar het verlies plaatsvond wordt automatisch voorgesteld. Bij de reeds bestaande begeleide overgang `A → tegenstander` vraagt ClubMatch alleen wanneer de betekenis echt ambigu is om te kiezen tussen:

- **Pass onderschept**;
- **Duel verloren**;
- **Slechte controle**.

Dat is geen generiek formulier maar een gerichte classificatie van dezelfde overgang. Andersom (`tegenstander → A`) kan ClubMatch onderscheid maken tussen **Interceptie**, **Duel gewonnen** en **Bal veroverd**.

---

## Actieketens / aanvallen

Gebeurtenissen kunnen onderdeel zijn van dezelfde **actieketen**. Voorbeeld:

`31:42 pass → 31:45 aanname → 31:47 dribbel → 31:50 druk → 31:52 balverlies → 31:56 counter`

ClubMatch bewaart hiervoor een `action_chain_id`. Binnen dezelfde keten gebruikt het systeem waar logisch het eindpunt van de vorige actie als voorgesteld startpunt van de volgende actie. Daardoor ontstaat meer wedstrijdcontext zonder dat je steeds opnieuw een locatie hoeft aan te tikken.

Een keten wordt onder andere beëindigd wanneer balbezit duidelijk van kant wisselt, er een beslissend einde zoals een goal ontstaat, of er te veel tijd tussen gebeurtenissen zit.

---

## + Context

**+ Context is altijd optioneel.** Het verschijnt nooit verplicht na iedere actie.

Voorbeelden van context die ClubMatch kan bewaren of later kan afleiden:

- vrij / onder druk / zware druk;
- afspeelmogelijkheden aanwezig / beperkt / geen;
- opbouw / aanval / omschakeling / verdediging;
- actie-uitkomst;
- betrokken spelers;
- gesproken of geschreven notitiecontext;
- later een videoverwijzing.

De keuzes zijn actiespecifiek. Een pass krijgt andere relevante opties dan een dribbel of schot. Er is bewust geen groot algemeen formulier tijdens live gebruik.

---

## Gebruik op desktop

Desktop kan de meeste informatie tegelijk tonen. Het brede Live Actieveld blijft centraal.

- Normaal: **speler → actie → klaar**.
- Een exacte veldlocatie is optioneel.
- Voor precisie: selecteer de relevante speler, tik desgewenst een plek op het brede actieveld en kies de actie, of pas de laatst geregistreerde actie achteraf aan met **⌖ Locatie aanpassen**.
- Voor directionele acties kan **↗ Richting/target** worden toegevoegd.
- Alleen de huidige actie, actuele keten en enkele recente markers blijven zichtbaar; oudere gebeurtenissen blijven wel in de database.

---

## Gebruik op tablet

Tablet is een primaire ClubMatch-liveomgeving.

- Het brede Live Actieveld blijft zichtbaar en bruikbaar, vooral in landscape.
- Alle belangrijke touch-doelen zijn groot genoeg voor directe bediening zonder hover.
- Normaal: **speler → actie → klaar**.
- Een coördinaattik is niet verplicht.
- **⌖ Locatie aanpassen**, **↗ Richting/target** en **+ Context** zijn optioneel.
- Het tactische veld en het actieveld hebben gescheiden verantwoordelijkheden; een actiecorrectie kan daarom nooit een speler tactisch verplaatsen.

Portrait blijft ondersteund; de interface stapelt onderdelen waar nodig zonder het Live Actieveld te verwijderen.

---

## Gebruik op mobiel

Mobiel gebruikt een compactere live flow; de desktopinterface wordt niet alleen verkleind.

- Normaal: **speler → actie → klaar**.
- Er verschijnt **geen verplicht fullscreen veld** na een actie.
- De interface legt nadruk op de huidige/laatste actie en de actuele keten, niet op een lange historie.
- Alleen wanneer je expliciet **⌖ Locatie aanpassen** of een target kiest, opent tijdelijk een groot fullscreen voetbalveld.
- Na de coördinaattik keert ClubMatch direct terug naar de normale live flow.
- Touch-doelen zijn groter en contextopties blijven compact en optioneel.

Een generieke live-Undo voor samengestelde acties wordt pas beschikbaar wanneer de backend één volledige actiebundel veilig atomair kan terugdraaien. Tot die tijd voorkomen idempotency en single-flight dubbele registraties, en kunnen wedstrijdgebeurtenissen na afloop via de bestaande correctie/auditflow worden gecorrigeerd.

---

## Wat ClubMatch technisch bewaart

De bestaande gebeurtenis blijft de bron. Context wordt aan hetzelfde event gekoppeld, onder andere met:

- speler en actie;
- exacte wedstrijdtijd;
- start- en eindcoördinaat;
- tactische positie en tactische coördinaten op dat moment;
- score op dat moment;
- actieketen-ID;
- wedstrijdfase;
- optionele druk en afspeelmogelijkheden;
- resultaat/gevolg;
- betrokken spelers;
- optionele gesproken/notitiecontext;
- ruimte voor een toekomstige videoverwijzing.

Niet ieder veld hoeft live door de gebruiker te worden ingevuld. Het ontwerp is juist bedoeld om veel later automatisch te kunnen afleiden.

---

## Waarvoor deze data later wordt gebruikt

De rijkere eventdata vormt de basis voor:

- heatmaps;
- actiepatronen;
- actieketens/aanvallen;
- veldzones;
- passmaps;
- contextuele analyse;
- spelersanalyse;
- teamanalyse;
- contextgevoelige skillrating;
- AI-analyse;
- toekomstige videoanalyse en video-koppeling.

Belangrijk: zware AI-, heatmap- of skillratingberekeningen horen niet in het kritieke live invoerpad. Live registratie blijft voorrang houden op analyse.
