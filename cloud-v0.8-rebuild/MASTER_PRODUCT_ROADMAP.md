# ClubMatch Cloud — Master Product Roadmap

Laatste actualisatie: 27 augustus 2026

Deze roadmap vervangt losse of verouderde roadmaplijsten. Hij combineert:
- functionele pariteit met de bevroren v0.7.6/v13.x-baseline;
- de v0.8 Cloud Beta-architectuur;
- Trainingen en spelerontwikkeling;
- Match OS / Club Intelligence;
- security, schaalbaarheid en commercialisering.

Status: `✅ gebouwd + geautomatiseerd getest` · `🟡 gebouwd/basis aanwezig, praktijktest of verdere afwerking nodig` · `⬜ nog bouwen` · `🔒 release gate`.

> Een feature is pas echt release-klaar wanneer backendcontract, refresh/recovery, rechten, relevante CI en waar nodig echte desktop/Android-praktijktest zijn geslaagd.

## 0. Versie- en releasebeleid

- 🔒 `v0.7.6` blijft bevroren op `main`.
- 🛠 v0.8-development gebeurt op `clubmatch-v0.8-rebuild`.
- Publicatie gebeurt via `clubmatch-pages-v08` nadat de volledige v0.8-CI groen is.
- Geen ontwikkeling op v0.7.x meer.
- Confirmed Cloud state blijft de autoriteit; geen permanente optimistic UI-state.

---

# LAAG 1 — PARITY COMPLETE

Doel: alles wat voor dagelijks wedstrijdgebruik in/voor v0.7.6 werd verwacht betrouwbaar terugbrengen, maar op de modulaire v0.8-architectuur.

## 1.1 Navigatie en werkmodi

- 🟡 Wedstrijden als eigen werkmodus.
- 🟡 Trainingen als eigen werkmodus: wanneer Trainingen actief is verdwijnen wedstrijdselectie, score, live acties, veld, monitoring en gebeurtenissen; `Terug naar wedstrijden` herstelt de wedstrijdmodus. Code gebouwd, release/praktijktest volgt.
- ⬜ Dashboard, Beheer en Security later dezelfde duidelijke workspace-navigatie geven in plaats van losse panelen.
- ⬜ Hoofdnavigatie ontwerpen voor `Wedstrijden | Trainingen | Dashboard | Beheer`.

## 1.2 Wedstrijdvoorbereiding

- ✅ Team/seizoen kiezen.
- ✅ Tegenstander verplicht vóór start, ook server-side.
- ✅ Datum, tijd en wedstrijdduur.
- ✅ Aanwezig/afwezig en selectie.
- ✅ Exact 11 basisspelers + unieke posities server-side.
- ✅ Formatiepresets.
- ✅ Visuele basisopstelling.
- 🟡 Drag & drop beschikbare speler → basisveld → direct geselecteerd/basis; geautomatiseerd gebouwd, echte desktop/Android-validatie blijft nodig.
- 🟡 Basisopstelling terug bij bestaande/lopende wedstrijd en bewerkbaar tot de eerste wissel; praktijktest blijft releasecriterium.
- 🟡 Formatie-afhankelijke positielijst + juiste veldcoördinaten; verder visueel finetunen.
- 🟡 Scrollpositie spelerslijst bewaren tijdens selectie; browserpraktijktest.
- 🟡 Positieafkorting + Nederlandse omschrijving.
- ⬜ Volledige mobiele voorbereiding finetunen.

## 1.3 Live Match Engine

- ✅ Eén confirmed Cloud state als bron van waarheid.
- ✅ Doorlopende wedstrijdklok per seconde.
- ✅ Rustklok en pauzeklok; effectieve speeltijd bevriest bij pauze/rust.
- ✅ Veld + bank + speeltijd + banktijd + huidige beurt.
- ✅ Wissels, positie wijzigen en atomaire positieruil.
- 🟡 Drag & drop live veld: drop = echte Cloud-positiewijziging/ruil; echte devicepraktijktest blijft nodig.
- 🟡 Live bank direct onder veld en drag & drop bank ↔ veld als echte wissel.
- 🟡 Live formatie tijdens wedstrijd atomair wijzigen voor alle 11 spelers.
- ✅ Goals voor/tegen, scorer, assist, goaltype, notitie en scorebord.
- ✅ Gebeurtenissentijdlijn in het Nederlands.
- ✅ Goals tonen tussenstand; ongeldig doelpunt toont reden + teruggezette stand; strafschoppen tonen aparte penaltystand.
- ✅ Correcties en ongeldig maken append-only/auditbaar.
- ✅ Live monitoring met actuele status, positie, huidige beurt, totaal en laatste wijziging.
- 🟡 Live monitoring `positie oud → nieuw`, formatie- en dragwijzigingen volledig in praktijk valideren.
- 🟡 Kleurlegenda bij live veld, monitoring, gebeurtenissen, veld- en bankspelers; gebruikersvalidatie nodig.
- ✅ Stoppen vraagt bevestiging en is gescheiden van definitief verwijderen.
- ✅ Wedstrijd afsluiten en opslaan ≠ verwijderen.
- 🟡 Automatische server-side eindstop bij vergeten wedstrijd.
- 🟡 Verlenging en strafschoppen-flow aanwezig; volledige end-to-end wedstrijdscenario's nog testen.

## 1.4 Spraak en snelle acties

- ✅ Spraak + tekstfallback.
- ✅ Namen én rugnummers.
- ✅ Voorstel eerst tonen; pas na expliciete bevestiging schrijven.
- ✅ Verse SpeechRecognition-sessie per luisteractie + watchdog/cleanup.
- 🟡 Praktijktest Chrome/Android en verdere Nederlandse spraakgrammatica.
- ✅ Snelle speleracties als append-only events: balcontrole, balverovering, onderschepping, blok, balverlies, verkeerde pass, kans, duel, schot, overtreding, redding, blessure enz.
- 🟡 Balbezit-timer/overdracht verder UX-testen; geregistreerd bezit blijft afhankelijk van invoerkwaliteit.

## 1.5 Historie, verwijderen en export

- ✅ Opgeslagen voorbereidingen opnieuw openen.
- ✅ Wedstrijdhistorie basis.
- ✅ Veilige aparte delete-flow met extra bevestiging.
- ✅ Historische oefenwedstrijd 22 augustus blijft als wedstrijddata bewaard.
- ⬜ Volledig wedstrijddetail met alle events, correcties, opstellingen en fases.
- ⬜ CSV-export.
- ⬜ XLSX-export van wedstrijden/dashboard/spelers/trainingen.
- ⬜ PDF-rapport waar zinvol.

## 1.6 Team-, seizoen- en spelersbeheer

- 🟡 Nieuwe club, team/seizoen (bijv. O16-2) en spelers aanmaken: server/UI basis aanwezig; praktijktest en UX-afwerking nodig.
- 🟡 Spelernaam, roepnaam, rugnummer, shirtmaat, voorkeursposities, actief/inactief beheren.
- ⬜ Bestaand team/seizoen volledig hernoemen met goede validatie.
- ⬜ Team kopiëren naar nieuw seizoen.
- ⬜ Spelers overzetten/kopiëren tussen teams/seizoenen.
- ⬜ Archiveren i.p.v. hard verwijderen waar historie behouden moet blijven.

---

# LAAG 2 — CLOUD BETA

Doel: betrouwbaar multi-user/multi-device gebruik voor echte clubs.

## 2.1 Realtime en herstel

- ✅ Lifecycle-resync bij refresh/focus/pageshow/online.
- 🟡 Polling fallback.
- ⬜ Echte Supabase Realtime push voor match/events/projecties.
- ⬜ Mobiel ↔ desktop vrijwel directe sync.
- ⬜ Conflictafhandeling als twee coaches tegelijk muteren.
- ⬜ Offline/reconnect-strategie en duidelijke statusindicator.
- 🔒 Echte desktopbrowser E2E-suite.
- 🔒 Echte Android/mobile E2E-suite.

## 2.2 Gebruikers, rollen en tenantbeheer

- ⬜ Gebruikers uitnodigen.
- ⬜ Platform-admin.
- ⬜ Club-admin.
- ⬜ Coach/editor.
- ⬜ Viewer/read-only.
- ⬜ Rechtenmatrix in UI én server-side.
- ⬜ Multi-club switcher voor platformbeheer.
- ⬜ Club onboarding-wizard.

## 2.3 Security Beta Gate

- ✅ Publishable key only in browser.
- ✅ RLS/RPC-autorisatiebasis.
- ✅ Password recovery.
- ✅ TOTP primitives/UI.
- ⬜ MFA verplicht voor platform-/club-admin.
- ⬜ Server-side AAL2 voor verwijderen en gevoelige beheer-RPC's.
- ⬜ Leaked Password Protection inschakelen.
- ⬜ Security-notificatiemails.
- ⬜ Productie-SMTP.
- ⬜ CAPTCHA/rate-limit profiel.
- ⬜ Admin/security/destructief auditlog.
- 🔒 Security review + pentest vóór commerciële productie.

---

# LAAG 3 — DASHBOARD & CLUB INTELLIGENCE

Doel: data omzetten naar bruikbare coach- en spelerinzichten.

## 3.1 Dashboard v2

- ✅ Wedstrijden permanent aan/uit zetten voor dashboard/rating.
- ✅ Basis KPI's, historie en speleraggregaties.
- ✅ Speleracties worden server-side geaggregeerd.
- ✅ ClubMatch Rating 1–100 basis.
- ⬜ Filters: club, team, seizoen, speler, periode, wedstrijdtype en geselecteerde wedstrijden.
- ⬜ Sorteerbare/rankbare kolommen.
- ⬜ Wedstrijddetail vanuit dashboard openen.
- ⬜ Trends en grafieken per speler/team.
- ⬜ Belastings-/speeltijdanalyse.

## 3.2 Rating v2

- ✅ Transparante 1–100 wedstrijdrating met neutrale basis en positieve/negatieve acties.
- ✅ Speeltijdnormalisatiebasis en betrouwbaarheid laag/middel/hoog.
- ⬜ Minimum-minuten/steekproefcorrectie verder kalibreren.
- ⬜ Positie-afhankelijke gewichten: keeper/verdediger/middenvelder/aanvaller.
- ⬜ Wedstrijdcontext zoals tegenstandniveau en wedstrijdtype optioneel meenemen.
- ⬜ Uitlegbaar scorekaartje: welke acties veranderden de rating.
- ⬜ Kalibratie met echte wedstrijden voordat rating als serieuze performance-indicator wordt gebruikt.

## 3.3 Trainingen & ontwikkeling

- ✅ Trainingen opslaan, later openen/bewerken en opnieuw opslaan.
- ✅ Aanwezigheid, inzet, kwaliteit, houding/samenwerking, coachnotitie.
- ✅ Trainingsscore 1–100: inzet 40% + kwaliteit 35% + houding 25%; aanwezigheid apart.
- ⬜ Trainingsdoelen/thema's per sessie.
- ⬜ Spelerdoelen/ontwikkelpunten.
- ⬜ Trainings- en wedstrijdtrend naast elkaar.
- ⬜ Gecombineerde `Ontwikkelscore` als aparte indicator; wedstrijd- en trainingsscore blijven ook los zichtbaar.
- ⬜ Coachnotities over tijd en voortgang.

## 3.4 Match OS / Coach Intelligence

- ⬜ Voorwedstrijd-inzichten: beschikbaarheid, recente speeltijd, vorm, training, belasting.
- ⬜ Suggesties voor basis/rotatie als ondersteuning, nooit automatisch beslissen.
- ⬜ Live signalen: lange banktijd, ongelijke speeltijd, blessurestatus, kaart-/eventwaarschuwingen.
- ⬜ Nabeoordeling: tactische gebeurtenissen, player actions en ratingontwikkeling.
- ⬜ Teamprofiel/patronen: balverlies, veroveringen, duels, schoten, kansen enz.

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

Indicatieve productstructuur, pas definitief na echte pilotdata:

- ⬜ Free / proefomgeving.
- ⬜ Team-abonnement.
- ⬜ Team Pro / intelligence-laag.
- ⬜ Club / multi-team beheer.
- ⬜ Entitlementmodel: features server-side afdwingbaar per abonnement.
- ⬜ Betaling/facturatie-integratie.
- ⬜ AVG/DPA/privacy- en verwerkersdocumentatie.
- ⬜ Support/onboarding en SLA-keuzes.
- 🔒 Pentest, security gate, back-up/recovery en monitoring vóór betaalde productie.

Eerdere prijsrichtingen (bijv. circa €59/jaar Team en €99/jaar Team Pro) blijven hypothesen, geen vastgestelde prijzen; eerst pilot, gebruik en kosten valideren.

---

# LAAG 6 — ECOSYSTEEM / LATER

Niet nodig voor Cloud Beta en bewust later:

- ⬜ Externe club-/competitiekoppelingen.
- ⬜ Video/tagging-koppeling.
- ⬜ Trainingsbibliotheek.
- ⬜ Chat/community.
- ⬜ Native apps als web/PWA onvoldoende blijkt.
- ⬜ Publieke clubwebsite-integraties.
- ⬜ Verdere AI-assistentie voor analyse en voorbereiding, met transparante menselijke controle.

---

# Huidige uitvoeringsvolgorde

## Sprint P0 — Parity & UX dichtzetten
1. Trainingen als volledig geïsoleerde werkruimte.
2. Basis/live veld + bank + drag/drop + formatie + legenda in echte browser/device-tests nalopen.
3. Alle v0.7.6-paritypunten opnieuw classificeren op werkelijk zichtbaar/bruikbaar gedrag.
4. Mobiele voorbereiding/live bediening finetunen.
5. Historie/detail + exportpariteit completeren.

## Sprint P1 — Dashboard & Intelligence v2
1. Filters en wedstrijddetail.
2. Rating v2 + positiegewichten + uitleg/betrouwbaarheid.
3. Trainings-/wedstrijdtrends en Ontwikkelscore.
4. Speler-/teamactievisualisaties en bezitregistratie verbeteren.

## Sprint P2 — Beheer, rollen en Realtime
1. Team/seizoen/spelerbeheer afmaken.
2. Gebruikers/rollen/rechtenmatrix.
3. Supabase Realtime + conflict/reconnect.
4. Desktop + Android E2E.

## Sprint P3 — Security Beta
MFA/AAL2, leaked-password protection, SMTP/security mails, auditlog, rate limits/CAPTCHA en security review.

## Sprint P4 — Scale & Commercial
Export/WhatsApp/branding, observability, backup, entitlements, abonnementen en commerciële launch-gates.
