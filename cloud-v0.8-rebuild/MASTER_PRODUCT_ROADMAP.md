# ClubMatch Cloud — Master Product Roadmap

Laatste actualisatie: 28 augustus 2026

Deze roadmap is de actuele productwaarheid voor ClubMatch Cloud en combineert pariteit, Cloud Beta, Trainingen, Club Intelligence, security en commercialisering.

Status: `✅ gebouwd + geautomatiseerd getest` · `🟡 gebouwd/basis aanwezig, praktijktest of verdere afwerking nodig` · `⬜ nog bouwen` · `🔒 release gate`.

> Een feature is pas echt release-klaar wanneer backendcontract, refresh/recovery, rechten, relevante CI en waar nodig echte desktop/Android-praktijktest zijn geslaagd.

## 0. Versie- en releasebeleid

- 🔒 `v0.7.6` blijft bevroren op `main`.
- 🛠 v0.8-development gebeurt op `clubmatch-v0.8-rebuild`.
- Publicatie gebeurt via `clubmatch-pages-v08` nadat de volledige v0.8-CI groen is.
- Confirmed Cloud state blijft de autoriteit; geen permanente optimistic UI-state.

---

# LAAG 1 — PARITY COMPLETE

## 1.1 Navigatie en werkmodi

- ✅ Trainingen is een geïsoleerde werkruimte.
- ✅ Dashboard is een geïsoleerde werkruimte; live wedstrijdpanelen verdwijnen tijdens analyse.
- ✅ Beheer gebruikt een aparte werkruimte.
- 🟡 Wedstrijden als primaire werkmodus; verdere hoofdnavigatie finetunen.
- ⬜ Definitieve hoofdnavigatie `Wedstrijden | Trainingen | Dashboard | Beheer` voor desktop/mobiel.

## 1.2 Wedstrijdvoorbereiding

- ✅ Team/seizoen, tegenstander, datum, tijd en wedstrijdduur.
- ✅ Aanwezig/afwezig en selectie.
- ✅ Exact 11 basisspelers + unieke posities server-side.
- ✅ Formatiepresets en visuele basisopstelling.
- ✅ Opgeslagen voorbereiding opnieuw openen en direct starten als niets is gewijzigd.
- 🟡 Drag & drop beschikbare speler → basisveld → geselecteerd/basis; echte devicevalidatie blijft nodig.
- 🟡 Basisopstelling bij lopende wedstrijd historisch zichtbaar; tegels compacter gemaakt.
- 🟡 Formatie-afhankelijke positielijst + veldcoördinaten verder visueel finetunen.
- ⬜ Volledige mobiele voorbereiding praktijktesten en finetunen.

## 1.3 Live Match Engine

- ✅ Eén confirmed Cloud state als bron van waarheid.
- ✅ Doorlopende wedstrijdklok, rustklok en pauzeklok.
- ✅ Rustduur wordt bij start tweede helft als gebeurtenis vastgelegd/geprojecteerd.
- ✅ Live status toont fase, eigen teamnaam, tegenstander en blessuretijd.
- ✅ Blessuretijd toont ingestelde minuten en voortgang naast de officiële wedstrijdklok.
- ✅ Veld + bank + speeltijd + banktijd + huidige beurt.
- ✅ Wissels, positie aanpassen en atomaire positieruil.
- ✅ Positie aanpassen blijft voor één speler naar een vrije/nieuwe positie; positieruil is voor twee bezette posities.
- 🟡 Drag & drop live veld en bank ↔ veld; echte devicepraktijktest blijft nodig.
- 🟡 Live formatie tijdens wedstrijd atomair wijzigen; praktijktest blijft nodig.
- ✅ Goals voor/tegen, scorer, assist, goaltype, notitie en scorebord.
- ✅ Gebeurtenissentijdlijn in het Nederlands met score/correcties.
- ✅ Snelle speleractie kan een doelpunt registreren inclusief type en optionele assist.
- ✅ Overtreding/vrije trap mee en overtreding/vrije trap tegen herkenbaar in snelle acties.
- ✅ Speler die tijdens wedstrijd later aankomt kan vanaf dat moment aan de bank/selectie worden toegevoegd; reden en tijd komen in gebeurtenissen.
- ✅ Dropdowns worden niet meer elke live refresh opnieuw opgebouwd als de opties gelijk zijn; bedoeld om flikkeren tijdens scroll te stoppen.
- ✅ Stoppen vraagt bevestiging en is gescheiden van definitief verwijderen.
- 🟡 Automatische server-side eindstop, verlenging en strafschoppen aanwezig; volledige wedstrijdscenario's nog echt testen.

## 1.4 Balbezit en snelle registratie

- ✅ Gedetailleerd spelerbezit/Analistmodus blijft optioneel.
- ✅ Team-balbezit kan onafhankelijk van een speler worden gestart: `Ons bezit` of `Tegenstander`.
- ✅ Wisselen tussen beide kanten stopt de vorige timer en start de nieuwe atomair.
- ✅ Team-bezit stopt automatisch bij rust en wedstrijd einde.
- ✅ Duur van bezitmomenten wordt in gebeurtenissen opgeslagen/getoond.
- ✅ Dashboard toont team-balbezit eerste helft, tweede helft en totaal; verlenging apart indien gebruikt.
- ✅ Speleranalyses bevatten pass ontvangen, pass geslaagd, balverliesverhouding, duels, schoten en oorzaken van balverlies waar gemeten.
- 🟡 Meetkwaliteit blijft expliciet belangrijk: gemiste acties mogen niet als volledige wedstrijdstatistiek worden gepresenteerd.

## 1.5 Historie, verwijderen en export

- ✅ Opgeslagen voorbereidingen opnieuw openen.
- ✅ Wedstrijdhistorie.
- ✅ Historisch wedstrijddetail met opstelling, fases, gebeurtenissen en correcties.
- ✅ CSV-export per wedstrijd.
- ✅ Veilige aparte delete-flow met extra bevestiging.
- ⬜ XLSX-export van wedstrijden/dashboard/spelers/trainingen.
- ⬜ PDF-rapport waar zinvol.

## 1.6 Team-, seizoen- en spelersbeheer

- 🟡 Nieuwe club, team/seizoen (bijv. O16-2) en spelers aanmaken; server/UI aanwezig, praktijkvalidatie blijft nodig.
- 🟡 Spelernaam, roepnaam, rugnummer, shirtmaat, voorkeursposities, actief/inactief beheren.
- ✅ Platformbeheer/superuser wordt in Beheer herkenbaar gemaakt.
- ✅ Beheerknop wordt voor rollen zonder beheerrechten verborgen; server-side rechten blijven altijd leidend.
- ⬜ Team kopiëren naar nieuw seizoen.
- ⬜ Spelers overzetten/kopiëren tussen teams/seizoenen.
- ⬜ Archiveren i.p.v. hard verwijderen waar historie behouden moet blijven.

---

# LAAG 2 — CLOUD BETA

## 2.1 Realtime en herstel

- ✅ Lifecycle-resync bij refresh/focus/pageshow/online.
- 🟡 Polling fallback.
- ⬜ Echte Supabase Realtime push voor match/events/projecties.
- ⬜ Mobiel ↔ tablet ↔ desktop vrijwel directe sync.
- ⬜ Conflictafhandeling als twee coaches tegelijk muteren.
- ⬜ Offline/reconnect-strategie en duidelijke statusindicator.
- 🔒 Echte desktopbrowser E2E-suite.
- 🔒 Echte Android/mobile E2E-suite.

## 2.2 Gebruikers, rollen en tenantbeheer

- 🟡 Gebruikers uitnodigen via server-side invite-flow.
- ✅ Platform-admin/superuser basis.
- ✅ Club-admin basis.
- ✅ Trainer/editor basis.
- ✅ Viewer/read-only basis.
- 🟡 UI verbergt Beheer voor niet-beheerders; server-side mutaties zijn rolbeveiligd.
- ⬜ `parent`/ouder-verzorger echt privacy-scopen aan gekoppeld kind/team. Tot dit datamodel bestaat is ouder/verzorger niet wezenlijk anders dan read-only clubtoegang en mag het niet als kind-afgeschermd worden verkocht.
- ⬜ Multi-club switcher voor platformbeheer.
- ⬜ Club onboarding-wizard.

### Doelrechten

- **Platform-admin:** alle clubs, gebruikers, teams en platformbeheer.
- **Club-admin:** beheer eigen club, teams, trainers/viewers en masterdata.
- **Trainer/editor:** wedstrijden/trainingen invoeren en bewerken, geen clubbrede gebruikersadministratie.
- **Viewer:** alleen lezen van toegewezen club/teamdata.
- **Ouder/verzorger (toekomst):** alleen gekoppeld kind + noodzakelijke teamcontext; geen privé coachnotities of volledige andere-spelerprofielen.

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
- ✅ Actieverhoudingen zoals pass ontvangen vs balverlies, duel%, schot-op-doel% waar gemeten.
- ⬜ Filters: club, team, seizoen, speler, periode en wedstrijdtype verder uitbreiden.
- ⬜ Wedstrijddetail vanuit Dashboard rechtstreeks openen.
- ⬜ Trends/grafieken per speler/team.
- ⬜ Belastings-/speeltijdanalyse.

## 3.2 Rating v2

- ✅ Transparante 1–100 wedstrijdrating met neutrale basis en positieve/negatieve acties.
- ✅ Speeltijdnormalisatiebasis en betrouwbaarheid laag/middel/hoog.
- ⬜ Positie-afhankelijke gewichten: keeper/verdediger/middenvelder/aanvaller.
- ⬜ Minimum-minuten/steekproefcorrectie verder kalibreren.
- ⬜ Uitlegbaar scorekaartje: welke acties veranderden de rating.
- ⬜ Kalibratie met echte wedstrijden.

## 3.3 Trainingen & ontwikkeling

- ✅ Trainingen centraal in Cloud opslaan, cross-device terugvinden, openen/bewerken en opnieuw opslaan.
- ✅ Aanwezigheid, inzet, kwaliteit, houding/samenwerking, coachnotitie.
- ✅ Trainingsscore 1–100: inzet 40% + kwaliteit 35% + houding 25%; aanwezigheid apart.
- ⬜ Trainingsdoelen/thema's per sessie.
- ⬜ Spelerdoelen/ontwikkelpunten.
- ⬜ Trainings- en wedstrijdtrend naast elkaar.
- ⬜ Gecombineerde `Ontwikkelscore` als aparte indicator.

## 3.4 Match OS / Coach Intelligence

- ⬜ Voorwedstrijd-inzichten: beschikbaarheid, recente speeltijd, vorm, training, belasting.
- ⬜ Suggesties voor basis/rotatie als ondersteuning, nooit automatisch beslissen.
- ⬜ Live signalen: lange banktijd, ongelijke speeltijd, blessurestatus, kaart-/eventwaarschuwingen.
- ⬜ Nabeoordeling: tactische gebeurtenissen, player actions en ratingontwikkeling.
- ⬜ Teamprofiel/patronen: balverlies, veroveringen, duels, schoten, kansen en balbezit.

## 3.5 Live Action Field / Gesture Capture — R&D

Doel: invoer tijdens snel spel veel sneller maken dan formulieren en dropdowns, zonder de tactische opstelling te beschadigen.

- ⬜ Naast de tactische `Live opstelling` een aparte tab/weergave `Actieveld`.
- ⬜ Eigen spelers én tegenstander/tegenstanderzones zichtbaar op het Actieveld.
- ⬜ Tik eigen speler = speler/bezit selecteren.
- ⬜ Sleep eigen speler → eigen speler = voorstel `pass`.
- ⬜ Sleep richting tegenstander/ruimte/buiten = voorstel `balverlies/passpoging`.
- ⬜ Swipe richting doel = voorstel `schot`; daarna één tik voor op doel/mis/goal.
- ⬜ Tik tegenstander of tegenstanderzone = snelle overgang naar `tegenstander bezit`.
- ⬜ Long-press speler = compacte actiepalette.
- ⬜ Gebaren leveren eerst een duidelijke actievoorstel/correctiemogelijkheid; ambigu gebaar mag niet stilzwijgend statistieken vervuilen.
- ⬜ Team-balbezitknoppen blijven altijd de snelle fallback als individuele acties niet bijgehouden kunnen worden.
- ⬜ Eerste prototype eerst mobiel/tablet testen op snelheid, fouttikken en éénhandig gebruik voordat het de standaard live-interface wordt.

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

- ⬜ Free / proefomgeving.
- ⬜ Team-abonnement.
- ⬜ Team Pro / intelligence-laag.
- ⬜ Club / multi-team beheer.
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

## Sprint P0 — Live UX & Parity afronden
1. Fase/rust/blessuretijd/teamnamen en stabiele dropdowns in echte mobiel/tablet/browserpraktijk valideren.
2. Team-balbezit en late speler end-to-end in een echte wedstrijd testen.
3. Basis/live veld + bank + drag/drop + formatie + legenda device-tests.
4. Resterende v0.7.6-paritypunten opnieuw classificeren.

## Sprint P1 — Dashboard & Intelligence v2
1. Team-balbezit, Speler 360 en actieverhoudingen met echte wedstrijddata kalibreren.
2. Filters en directe wedstrijddetail-koppeling.
3. Rating v2 + positiegewichten + uitleg/betrouwbaarheid.
4. Trainings-/wedstrijdtrends en Ontwikkelscore.
5. `Actieveld` klikbaar prototype ontwerpen en vervolgens mobiel/tablet valideren.

## Sprint P2 — Beheer, rollen en Realtime
1. Team/seizoen/spelerbeheer afmaken.
2. Rollen/rechtenmatrix incl. echt ouder/verzorger-kindmodel.
3. Supabase Realtime + conflict/reconnect.
4. Desktop + Android E2E.

## Sprint P3 — Security Beta
MFA/AAL2, leaked-password protection, SMTP/security mails, auditlog, rate limits/CAPTCHA en security review.

## Sprint P4 — Scale & Commercial
XLSX/PDF-export, WhatsApp/branding, observability, backup, entitlements, abonnementen en commerciële launch-gates.
