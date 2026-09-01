# ClubMatch Cloud v0.8 — roadmapindex

Deze eerdere losse roadmap is vervangen door twee actuele documenten:

1. **`MASTER_PRODUCT_ROADMAP.md`** — volledige roadmap: parity, Cloud Beta, Dashboard & Club Intelligence, Scale Beta, Commercial Gate en Ecosysteem.
2. **`PARITY_AUDIT_V076.md`** — concrete audit van v0.8 tegen de bevroren v0.7.6-baseline, met onderscheid tussen gebouwd, praktijktest nodig en ontbrekend.

## Huidige eerstvolgende uitvoeringsvolgorde

1. **Parity & UX dichtzetten** — Trainingen als aparte werkruimte; basis/live veld, bank, drag & drop, formatie, legenda en mobiele UX in echte browser/device-tests nalopen.
2. **Historie/detail + exportpariteit** completeren, inclusief aantoonbare server-verwijdering en refresh van historie/open wedstrijden.
3. **Dashboard & Rating v2** — filters, wedstrijddetail, positiegewichten, betrouwbaarheid, trends, ontwikkelscore en dynamisch trainingadvies uit wedstrijddata.
4. **Beheer + rollen + Realtime** — team/seizoen/spelerbeheer afmaken, late/gastspeler tijdens wedstrijd, gebruikers/rechten en echte Supabase Realtime.
5. **Jeugdopleiding & wisselbeleid** — preset wisselmodellen, 25-50-65, custom beleid, doelminuten, speeltijd/banktijd-belasting, trainingsaanwezigheid, beschikbaarheidsstatus en wisselvoorstellen.
6. **Coach Navigation Models** — doelgestuurde interface zodat een gebruiker alleen ziet wat voor zijn rol/doel nodig is.
7. **Security Beta** — MFA/AAL2, leaked-password protection, SMTP/security mails, auditlog en real-device E2E.
8. **Scale/Commercial** — export/WhatsApp/branding, observability, back-up, entitlements en abonnementen.
9. **Integraties / Ecosysteem** — Sportlink competitie-/wedstrijdsync na migratie naar Stan VPS; app toont eerder al de integratiestatus maar doet nog geen zware synchronisatie in de browser.

## Nieuwe coach- en opleidingsroadmap — september 2026

### A. Sportlink
- **Status nu:** gepland / nog niet verbonden.
- **UI:** zichtbaar maken als integratiekaart `Sportlink · gepland na VPS-migratie`.
- **Na Stan VPS:** server-side synchronisatie van competitie, programma/wedstrijden en relevante teammapping; exacte Sportlink-koppelvoorwaarden/API nog apart verifiëren.
- **Architectuurregel:** geen volledige Sportlink-dataset in browser/localStorage; Cloud/VPS is bron en browser krijgt alleen benodigde wedstrijd/teamdata.

### B. Late speler / gastspeler
- Backend `add_late_player_to_match_v08` bestond al maar de zichtbare live-UI was bij refactor verdwenen.
- **v10-uitbreiding:** kandidaten uit het eigen team én actieve spelers van een ander team binnen dezelfde club/hetzelfde seizoen, bijvoorbeeld een speler uit een lager jeugdteam.
- Gastspeler wordt aan de bank toegevoegd met aankomsttijd, reden en bronteamsignalering; daarna kan hij normaal worden gewisseld.

### C. Wisselbeleid jeugd
Voorbereiding krijgt een selecteerbaar beleid. Presets:
- **25-50-65** — geplande wisselcheckpoints op minuut 25, 50 en 65.
- **Gelijke speeltijd** — verdeel beschikbare minuten zo eerlijk mogelijk.
- **Ontwikkelminuten** — spelers krijgen vooraf een doelminutenband, bijvoorbeeld 80 / 60-65 / 40-50.
- **Belastingsgestuurd** — voorstel op basis van recente speeltijd, banktijd en beschikbaarheid.
- **Prestatie/tactisch** — wisselmomenten gestuurd door wedstrijdbeeld/KPI's, met jeugdminima als randvoorwaarde.
- **Custom** — coach kiest eigen minuten, groepen en regels.

Per speler tonen: geplande minuten, werkelijk gespeeld, banktijd, aantal wissels, minuut in/uit, afwijking t.o.v. doel en cumulatieve belasting over wedstrijden.

Trainingsaanwezigheid mag als instelbare beleidsfactor meewegen, maar niet hard-coded. Voorbeeld: één niet-gemelde training kan de doelminutengroep verlagen; twee gemiste trainingen kunnen een strengere clubregel activeren. **Blessure, ziekte of beperkte inzetbaarheid moet apart staan en mag niet automatisch als disciplinaire afwezigheid worden behandeld.** Leg alleen de noodzakelijke beschikbaarheidsstatus vast; geen medische details in de gewone wedstrijd-UI.

### D. Opleidingsproces / positiecompetitie
Clubniveau kan een ontwikkelcyclus krijgen:
`Doel → training → wedstrijdgedrag → KPI/coachobservatie → evaluatie → nieuw doel`.

Per positie kunnen spelers worden vergeleken op relevante ontwikkel-KPI's, maar met leeftijd, minuten, datadekking en rolcontext. Het door gebruiker genoemde **rivaliteitsproces** staat als productonderwerp opgenomen; definitieve invulling koppelen we aan positiecompetitie/ontwikkelbenchmarking en clubbeleid.

### E. Wedstrijd → training
Dashboard vertaalt zwakke/sterke wedstrijdsignalen naar trainingfocus. Voorbeelden:
- lage passkwaliteit onder druk → positiespel/passing onder druk;
- veel `poor_control` → eerste aanname + lichaamshouding;
- laag duelpercentage → 1v1/duelvormen;
- lage balcontrole na balwinst → omschakel-/retentieoefeningen;
- weinig kansen/schoten op doel → kanscreatie/afwerking;
- daling na wissel/formatie → teamorganisatie in betreffende formatie;
- zwakke passverbinding tussen linies → trainingsvorm voor opbouw en verbinding verdediging-middenveld-aanval.

### F. Coach Navigation Models
Doelgestuurde navigatie voorkomt dat iedere gebruiker het volledige systeem hoeft te bedienen. Startmodellen:
1. **Matchday Simple** — klok, score, wissels, goals, minimale acties.
2. **Assistent Coach** — Matchday Simple + wisselvoorstellen, speeltijd/banktijd en live signalen.
3. **Development Coach** — speeltijdbeleid, trainingsaanwezigheid, spelerdoelen, ontwikkeling en belasting.
4. **Tactical Analyst** — volledig Live Actieveld, passnetwerk, positie-/actiecontext, formaties en wisselimpact.
5. **Training Planner** — wedstrijdanalyse → trainingsfocus → trainingssessie → evaluatie.
6. **Club Academy** — teams vergelijken, opleidingslijn, positiebenchmarking, doorstroming en beleid.

Gebruiker kiest primair **doel**, niet een technisch dashboard: bijvoorbeeld `wedstrijd simpel bijhouden`, `spelers eerlijk laten spelen`, `tactiek analyseren`, `training voorbereiden` of `opleiding sturen`. ClubMatch activeert daarna de relevante navigatiemodules.

### G. Positie versus actiepositie
ClubMatch houdt twee zaken bewust uit elkaar:
- **Rolpositie:** RB, CM, RW enz.; tactische rol/opstelling.
- **Actiepositie:** x/y-locatie waar pass, voorzet, schot, duel of balverlies werkelijk plaatsvond.

Voorbeeld: Wai Sam staat als **RB**, loopt rechts door naar het aanvallende derde en geeft een voorzet. De speler blijft analytisch RB, terwijl de actie wordt opgeslagen vanuit de rechter aanvallende zone. Snelle gewenste Live Actieveld-flow: `speler tikken → actieplek tikken → actie tikken`. Hierdoor hoeven tijdelijke aanvallende loopacties niet als officiële positiewijziging te worden geregistreerd.

## Regel

Een feature wordt niet als release-klaar beschouwd wanneer alleen code of UI bestaat. Backendcontract, refresh/recovery, rechten, CI en waar nodig echte desktop/Android-praktijktest moeten ook slagen.
