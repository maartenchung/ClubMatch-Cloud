# ClubMatch Cloud — Master Product Roadmap

Laatste actualisatie: 28 augustus 2026 · build 20260828.2225

Deze roadmap is de actuele productwaarheid voor ClubMatch Cloud. Hij combineert wedstrijdpariteit, Cloud Beta, Trainingen, Club Intelligence, beheer/security, schaalbaarheid en commercialisering.

Status: `✅ gebouwd + geautomatiseerd getest` · `🟡 gebouwd/basis aanwezig, praktijktest of verdere afwerking nodig` · `⬜ nog bouwen` · `🔒 release gate`.

> Een feature is pas release-klaar wanneer backendcontract, refresh/recovery, rechten, relevante CI en waar nodig echte desktop/Android-praktijktest zijn geslaagd. Confirmed Cloud state blijft de autoriteit.

## 0. Versie- en releasebeleid

- 🔒 `v0.7.6` blijft bevroren; geen functionele wijzigingen aan de frozen root.
- 🛠 v0.8-development gebeurt op `clubmatch-v0.8-rebuild`.
- Publicatie gebeurt via `main` + `clubmatch-pages-v08` nadat de volledige v0.8-CI groen is.
- Confirmed Cloud state blijft de enige bron van waarheid; geen permanente optimistic UI-state.
- ✅ Browserassets zijn build-gepind om oude JavaScript-cache te voorkomen.
- ✅ Shared browserclient: Auth/RPC/Realtime worden niet door UX-lagen overschreven.
- ✅ Refresh-warmup is read-only veilig; `client.rpc` wordt nergens meer gemonkeypatcht.

---

# LAAG 1 — PARITY COMPLETE

## 1.1 Navigatie en werkmodi

- ✅ Trainingen is een geïsoleerde werkruimte.
- ✅ Dashboard is een geïsoleerde werkruimte; live wedstrijdpanelen verdwijnen tijdens analyse.
- ✅ Beheer gebruikt een aparte werkruimte.
- 🟡 Wedstrijden is de primaire werkmodus; hoofdnavigatie verder finetunen.
- ⬜ Definitieve vaste hoofdnavigatie `Wedstrijden | Trainingen | Dashboard | Beheer` voor desktop en mobiel.

## 1.2 Wedstrijdvoorbereiding

- ✅ Team/seizoen, tegenstander, datum, tijd en wedstrijdduur.
- ✅ Aanwezig/afwezig/later en selectie.
- ✅ Exact 11 basisspelers + unieke posities server-side.
- ✅ Formatiepresets en visuele basisopstelling.
- ✅ Opgeslagen voorbereiding opnieuw openen en direct starten als niets is gewijzigd.
- 🟡 Drag & drop beschikbare speler → basisveld → geselecteerd/basis; echte devicevalidatie blijft nodig.
- 🟡 Basisopstelling bij lopende wedstrijd historisch zichtbaar; tegels zijn compacter.
- 🟡 Formatie-afhankelijke positielijst + veldcoördinaten verder visueel finetunen.
- ⬜ Volledige mobiele voorbereiding praktijktesten en finetunen.

## 1.3 Live Match Engine

- ✅ Eén confirmed Cloud state als bron van waarheid.
- ✅ Doorlopende wedstrijdklok, rustklok en pauzeklok.
- ✅ Rustduur wordt vanuit Cloud-events/timestamps vastgelegd en geprojecteerd.
- ✅ Live status toont fase, teamnaam, tegenstander en blessuretijd.
- ✅ Blessuretijd toont ingestelde minuten en voortgang naast officiële wedstrijdklok.
- ✅ Veld + bank + speeltijd + banktijd + huidige beurt.
- ✅ Wissels, positie aanpassen en atomaire positieruil.
- ✅ Positie aanpassen = één speler naar vrije/nieuwe positie; positieruil = twee bezette posities.
- 🟡 Drag & drop live veld en bank ↔ veld; echte devicepraktijktest blijft nodig.
- 🟡 Live formatie atomair wijzigen; praktijktest blijft nodig.
- ✅ Goals voor/tegen, scorer, assist, goaltype, notitie en scorebord.
- ✅ Gebeurtenissentijdlijn in het Nederlands met score/correcties.
- ✅ Gebeurtenissen compact als `Wedstrijd`, `Analyse` of `Alles`, met oudere events uitklapbaar.
- ✅ Later aangekomen speler kan tijdens de wedstrijd aan bank/selectie worden toegevoegd; reden/tijd worden bewaard.
- ✅ Dropdowns worden niet onnodig bij elke live refresh opnieuw opgebouwd.
- ✅ Wedstrijd stoppen vraagt bevestiging en is gescheiden van definitief verwijderen.
- ✅ Automatische eindgrens geeft een blijvende waarschuwing met exacte stoptijd en directe keuzes voor blessuretijd/einde; trillen/geluid waar toegestaan.
- ✅ Rust kan append-only/audit-safe ongedaan worden gemaakt zolang de wedstrijd in rust staat.
- 🟡 Automatische server-side eindstop, verlenging en strafschoppen aanwezig; volledige echte wedstrijdscenario's nog valideren.

## 1.4 Balbezit en slimme Snelle registratie

**Productbesluit:** `Snelle registratie` is de canonieke live-invoer voor speler- en teamacties. Er is geen tweede zichtbare Actieveld-registratie meer.

- ✅ Gedetailleerd spelerbezit/Analistmodus blijft optioneel.
- ✅ Team-balbezit kan onafhankelijk worden gestart: `Ons bezit` of `Tegenstander`.
- ✅ Eén `Alles bezit stoppen` sluit team- én spelerbezit; rust/pauze/einde sluiten bezit waar nodig server-side.
- ✅ Wisselen van teamzijde stopt vorige timer en start nieuwe atomair.
- ✅ Team-bezit stopt automatisch bij rust/einde.
- ✅ Duur van bezitmomenten wordt opgeslagen/getoond.
- ✅ A → B in Analistmodus registreert logisch/atomair: pass geslaagd A + pass ontvangen B + spelerbezit B + teambezit eigen team.
- ✅ Logisch zekere afleidingen: schot op doel → schot; balwinst/onderschepping → bezit. Onzekere aannames worden niet stilzwijgend toegevoegd.
- ✅ Actieve speler bij `Spelerbezit` is de actor voor alle eigen-teamacties; aparte speler-dropdown is uit de live UX verwijderd.
- ✅ Speler kiezen in Coachmodus wisselt alleen actieve speler/bezit; er wordt geen pass verzonnen.
- ✅ Speler kiezen in Analistmodus gebruikt A → B en kan dus de passketen automatisch vastleggen.
- ✅ Eén actiecatalogus bevat o.a. Goal, Schot, Schot op doel, Kans, Pass, Vooruit spelen, Spel verleggen, Voorzet, Vrije trap, Corner, Ingooi, Balwinst/-verlies, onderschepping, duels, overtredingen en redding.
- ✅ Oude losse rode balverliesrij is verwijderd uit de live UX.
- ✅ Balverliesoorzaken zijn gewone acties geworden: `Foute pass`, `Pass onderschept`, `Balverlies · duel`, `Bal kwijt · controle`, `Bal kwijt · dribbel`, `Overig balverlies`.
- ✅ Acties kunnen worden weergegeven als `Categorieën` of `A–Z`; voorkeur wordt lokaal onthouden.
- ✅ Bij eigen team zijn acties geblokkeerd totdat een actieve speler is gekozen; zo kan een actie niet per ongeluk aan de verkeerde speler worden gekoppeld.
- ✅ Tegenstanderacties blijven als teamactie registreerbaar zonder tegenstander-roster.
- ✅ Analist-Goal gebruikt actieve speler als scorer en zoekt binnen een korte recente passketen een aangever; indien gevonden wordt assist automatisch gekoppeld.
- ✅ Analist-Goal registreert compound: schot + schot op doel + goal; assistcontext wordt backend-side bevestigd.
- ✅ Voorbeeldketen is geautomatiseerd getest: Kayden → Matz → Goal herkent Kayden als recente aangever van Matz.
- ✅ Dashboard toont team-balbezit eerste helft, tweede helft en totaal; verlenging apart indien gebruikt.
- ✅ Speleranalyses bevatten pass ontvangen/geslaagd, balverliesverhouding, duels, schoten en oorzaken waar gemeten.
- 🟡 Meetkwaliteit blijft expliciet: gemiste acties mogen niet als volledige wedstrijdstatistiek worden gepresenteerd.

## 1.5 Historie, correcties, verwijderen en export

- ✅ Opgeslagen voorbereidingen opnieuw openen.
- ✅ Wedstrijdhistorie.
- ✅ Historisch wedstrijddetail met opstelling, fases, gebeurtenissen en correcties.
- ✅ Correcties/voids voor wissels, posities en goals zijn append-only/audit-safe.
- ✅ CSV-export per wedstrijd.
- ✅ Veilige aparte delete-flow met extra bevestiging.
- ⬜ Generiek correctieframework voor foutieve snelle/analistacties, bezit en attendance verder uitbreiden.
- ⬜ XLSX-export van wedstrijden/dashboard/spelers/trainingen.
- ⬜ PDF-rapport waar zinvol.

## 1.6 Team-, seizoen- en spelersbeheer

- 🟡 Nieuwe club, team/seizoen en spelers aanmaken; server/UI aanwezig, praktijkvalidatie nodig.
- 🟡 Spelernaam, roepnaam, rugnummer, shirtmaat, voorkeursposities en actief/inactief beheren.
- ✅ Platformbeheer/superuser wordt in Beheer herkenbaar gemaakt.
- ✅ Beheerknop wordt voor rollen zonder beheerrechten verborgen; server-side rechten blijven leidend.
- ⬜ Team kopiëren naar nieuw seizoen.
- ⬜ Spelers overzetten/kopiëren tussen teams/seizoenen.
- ⬜ Archiveren in plaats van hard verwijderen waar historie behouden moet blijven.

---

# LAAG 2 — CLOUD BETA

## 2.1 Realtime, refresh en conflicts

- ✅ Lifecycle-resync bij refresh/focus/pageshow/online.
- ✅ Polling fallback blijft vangnet; Realtime is niet de enige herstelroute.
- ✅ Native Supabase Realtime Postgres Changes voor `match_state` UPDATE en `match_events` INSERT per actieve wedstrijd.
- ✅ Tabellen zijn voor Realtime gepubliceerd met bestaande RLS/authenticated SELECT als autorisatiegrens.
- ✅ Eén canonieke native Realtime-transportlaag zonder externe CDN-afhankelijkheid.
- ✅ WebSocket join, token-refresh, heartbeat, reconnect-backoff, eventrouting en cleanup geautomatiseerd getest.
- ✅ Zichtbare syncstatus: `Realtime`, `verbinden`, `polling fallback` of `offline`.
- ✅ Startup-warmup voert alleen read-only Cloud-reads uit; geen overschrijving van read-only Supabase-methoden.
- 🟡 Mobiel ↔ tablet ↔ desktop bijna-directe sync technisch gebouwd en getest; echte twee-device praktijktest blijft releasevoorwaarde.
- 🟡 Concurrente mutatieherkenning is gebouwd: als een andere coach de `state_version` intussen wijzigt, wordt de nieuwste confirmed Cloud-status geladen en krijgt de gebruiker expliciet te zien dat zijn actie niet is uitgevoerd.
- 🟡 Conflictherstel is geautomatiseerd getest; echte twee-coaches/device praktijktest ontbreekt nog.
- 🟡 Offline/reconnect heeft status, backoff en polling recovery; echte offline-mutatiequeue/replay ontbreekt nog.
- 🔒 Echte desktopbrowser E2E-suite.
- 🔒 Echte Android/mobile E2E-suite.

## 2.2 Gebruikers, rollen en tenantbeheer

- 🟡 Gebruikers uitnodigen via server-side invite-flow.
- ✅ Platform-admin/superuser basis.
- ✅ Club-admin basis.
- ✅ Trainer/editor basis.
- ✅ Viewer/read-only basis.
- 🟡 UI verbergt Beheer voor niet-beheerders; server-side mutaties zijn rolbeveiligd.
- ⬜ `parent`/ouder-verzorger privacy-scopen aan gekoppeld kind/team; niet als kind-afgeschermd verkopen vóór dit datamodel er is.
- ⬜ Multi-club switcher voor platformbeheer.
- ⬜ Club onboarding-wizard.

Doelrechten:
- **Platform-admin:** alle clubs, gebruikers, teams en platformbeheer.
- **Club-admin:** eigen club, teams, trainers/viewers en masterdata.
- **Trainer/editor:** wedstrijden/trainingen invoeren en bewerken, geen clubbrede gebruikersadministratie.
- **Viewer:** alleen lezen van toegewezen club/teamdata.
- **Ouder/verzorger toekomst:** gekoppeld kind + noodzakelijke teamcontext, geen privé coachnotities/volledige andere-spelerprofielen.

## 2.3 Security Beta Gate

- ✅ Publishable key only in browser.
- ✅ RLS/RPC-autorisatiebasis.
- ✅ Password recovery.
- ✅ TOTP primitives/UI.
- ⬜ MFA verplicht voor platform-/club-admin.
- ⬜ Server-side AAL2 voor verwijderen en gevoelige beheer-RPC's.
- ⬜ Leaked Password Protection inschakelen.
- ⬜ Security-notificatiemails en productie-SMTP.
- ⬜ CAPTCHA/rate-limit profiel.
- ⬜ Admin/security/destructief auditlog.
- 🔒 Security review + pentest vóór commerciële productie.

---

# LAAG 3 — DASHBOARD & CLUB INTELLIGENCE

## 3.1 Dashboard v2 / Speler 360

- ✅ Wedstrijden permanent aan/uit voor dashboard/rating.
- ✅ Basis KPI's, historie en speleraggregaties.
- ✅ Speler 360 met wedstrijd-, actie-, training- en ratinggegevens.
- ✅ ClubMatch Rating 1–100 basis.
- ✅ Team-balbezit eerste helft, tweede helft en totaal.
- ✅ Actieverhoudingen zoals pass ontvangen vs balverlies, duel% en schot-op-doel% waar gemeten.
- ⬜ Filters: club, team, seizoen, speler, periode en wedstrijdtype uitbreiden.
- ⬜ Wedstrijddetail vanuit Dashboard rechtstreeks openen.
- ⬜ Trends/grafieken per speler/team.
- ⬜ Belastings-/speeltijdanalyse.
- ⬜ Meetkwaliteit/completeness-indicator bij statistieken.

## 3.2 Rating v2

- ✅ Transparante 1–100 wedstrijdrating met neutrale basis en positieve/negatieve acties.
- ✅ Speeltijdnormalisatiebasis en betrouwbaarheid laag/middel/hoog.
- ⬜ Positie-afhankelijke gewichten: keeper/verdediger/middenvelder/aanvaller.
- ⬜ Minimum-minuten/steekproefcorrectie kalibreren.
- ⬜ Uitlegbaar scorekaartje: welke acties veranderden de rating.
- ⬜ Kalibratie met echte wedstrijden.

## 3.3 Trainingen & ontwikkeling

- ✅ Trainingen centraal in Cloud opslaan, cross-device terugvinden/openen/bewerken.
- ✅ Aanwezigheid, inzet, kwaliteit, houding/samenwerking en coachnotitie.
- ✅ Trainingsscore 1–100: inzet 40% + kwaliteit 35% + houding 25%; aanwezigheid apart.
- ⬜ Trainingsdoelen/thema's per sessie.
- ⬜ Spelerdoelen/ontwikkelpunten.
- ⬜ Trainings- en wedstrijdtrend naast elkaar.
- ⬜ Gecombineerde `Ontwikkelscore` als aparte indicator.

## 3.4 Match OS / Coach Intelligence

- ⬜ Voorwedstrijd-inzichten: beschikbaarheid, recente speeltijd, vorm, training en belasting.
- ⬜ Suggesties voor basis/rotatie als ondersteuning, nooit automatisch beslissen.
- ⬜ Live signalen: lange banktijd, ongelijke speeltijd, blessurestatus, kaart-/eventwaarschuwingen.
- ⬜ Nabeoordeling: tactische gebeurtenissen, player actions en ratingontwikkeling.
- ⬜ Teamprofiel/patronen: balverlies, veroveringen, duels, schoten, kansen en balbezit.

## 3.5 Ruimtelijke Gesture Capture — R&D, niet in huidige live UX

**Productbesluit build 2225:** het zichtbare `Actieveld` is uit de productie/browser-shell gehaald omdat het naast Snelle registratie een tweede invoeroppervlak en extra cognitieve belasting gaf.

- ✅ Onderliggende gesture/controller/event-contracten blijven in de repository als R&D en blijven geautomatiseerd testbaar.
- ✅ Bestaande action-field-eventhistorie blijft leesbaar via de event-describer.
- ✅ Snelle registratie bevat alle relevante voormalige Actieveld-snelacties zonder locatie.
- ⬜ Alleen herintroduceren als echte mobiel/tablet tests aantonen dat locatie/veegdata voldoende extra waarde geeft zonder dubbelregistratie.
- ⬜ Bij eventuele terugkeer: uitsluitend ruimtelijke context/route, nooit een tweede actiecatalogus.

---

# LAAG 4 — SCALE BETA

- ⬜ Multi-club beheer op schaal.
- ⬜ Clubspecifiek logo, naam en kleuren.
- ⬜ Notificaties/WhatsApp-laag met expliciete opt-in.
- ⬜ Import/export en bulk spelerbeheer.
- ⬜ Dataretentie/privacyinstellingen per club.
- ⬜ Observability, error telemetry en operationele alerts.
- ⬜ Back-up/restore en incident-runbook.
- ⬜ Performance/load-tests voor meerdere gelijktijdige wedstrijden.

---

# LAAG 5 — COMMERCIAL GATE

- ⬜ Free/proefomgeving.
- ⬜ Team-abonnement.
- ⬜ Team Pro/intelligence-laag.
- ⬜ Club/multi-team beheer.
- ⬜ Entitlementmodel server-side per abonnement.
- ⬜ Betaling/facturatie-integratie.
- ⬜ AVG/DPA/privacy- en verwerkersdocumentatie.
- ⬜ Support/onboarding en SLA-keuzes.
- 🔒 Pentest, security gate, back-up/recovery en monitoring vóór betaalde productie.

Eerdere prijsrichtingen blijven hypothesen; eerst pilots, gebruik, kosten en waarde valideren.

---

# LAAG 6 — ECOSYSTEEM / LATER

- ⬜ Externe club-/competitiekoppelingen.
- ⬜ Video/tagging-koppeling.
- ⬜ Trainingsbibliotheek.
- ⬜ Chat/community.
- ⬜ Native apps als web/PWA onvoldoende blijkt.
- ⬜ Publieke clubwebsite-integraties.
- ⬜ Verdere AI-assistentie voor analyse en voorbereiding, met transparante menselijke controle.

---

# Huidige uitvoeringsvolgorde

## Sprint P0 — Smart Live UX afronden

1. **Smart Snelle registratie op echte mobiel/tablet valideren:** speler kiezen → actie; A → B; Kayden → Matz → Goal/assist; Categorieën/A–Z; éénhandig gebruik en fouttikken.
2. **Volledige wedstrijdscenario's:** rust + rust undo, automatische eindstop, blessuretijd, late speler, wissel, formatie en wedstrijdafsluiting.
3. **Live veld device-tests:** drag/drop, bank ↔ veld, positieruil en formatie op desktop + Android.
4. **Generieke correcties:** snelle/analistacties, bezit, attendance en foutieve assist/context audit-safe kunnen herstellen.

## Sprint P1 — Reliability & Multi-device

1. Realtime push op twee echte devices valideren.
2. Twee coaches tegelijk: conflict recovery, duidelijke lokale feedback en geen dubbele mutaties.
3. Offline/reconnect verder afmaken; beleid voor offline writes/replay expliciet maken.
4. Echte desktopbrowser + Android E2E-suite opzetten en als releasegate gebruiken.
5. Fast Resume verder optimaliseren: actieve match/score/clock/line-up eerst, secundaire modules daarna.

## Sprint P2 — Dashboard & Intelligence v2

1. Team-balbezit, Speler 360 en actieverhoudingen met echte wedstrijddata kalibreren.
2. Filters + directe wedstrijddetail-koppeling.
3. Rating v2 met positiegewichten, score-uitleg en betrouwbaarheid.
4. Trends, belasting/speeltijd, trainings-/wedstrijdtrend en Ontwikkelscore.
5. Meetkwaliteit/completeness zichtbaar maken.

## Sprint P3 — Beheer, rollen & Security Beta

1. Team/seizoen/spelerbeheer afmaken inclusief kopiëren/archiveren.
2. Rollen/rechtenmatrix en echt ouder/verzorger-kindmodel.
3. Multi-club switcher + onboarding.
4. MFA verplicht voor admins, AAL2 voor gevoelige acties, leaked-password protection, SMTP/securitymails, auditlog en rate limits/CAPTCHA.
5. Security review/pentest.

## Sprint P4 — Scale & Commercial

1. XLSX/PDF-export.
2. WhatsApp/notificaties + branding.
3. Observability, back-up/restore, incident-runbook en load-tests.
4. Entitlements, abonnementen, betaling/facturatie.
5. AVG/DPA, support/onboarding en commerciële launch-gates.
