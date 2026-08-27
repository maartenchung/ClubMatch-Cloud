# ClubMatch Cloud v0.8 — Parity Audit tegen v0.7.6

Auditdatum: 27 augustus 2026
Referentie: bevroren `main/cloud-v0.7-test`, inclusief `v076-ui.js`.

Doel: onderscheid maken tussen `code aanwezig`, `geautomatiseerd getest` en `praktisch zichtbaar/bruikbaar`.

Status: `✅ parity aanwezig` · `🟡 aanwezig maar echte browser/device-validatie of UX-afwerking nodig` · `⬜ ontbreekt / opnieuw bouwen`.

## Wedstrijdselectie en voorbereiding

- ✅ Team/seizoen kiezen.
- ✅ Tegenstander, datum, tijd en duur.
- ✅ Tegenstander verplicht bij start.
- ✅ Aanwezigheid/selectie.
- ✅ Exact 11 basisspelers.
- ✅ Formatie en unieke posities.
- 🟡 Visuele basisopstelling: aanwezig in v0.8, verdere gebruikersvalidatie bij bestaande/lopende wedstrijden.
- 🟡 Drag & drop basisopstelling en beschikbare spelers → basis.
- 🟡 Scrollpositie selectie behouden.
- 🟡 Alleen formatiegeldige posities tonen + juiste veldcoördinaten.
- 🟡 Nederlandse positienaam achter afkorting.

## Live wedstrijd

- ✅ Eén doorlopende effectieve wedstrijdklok.
- ✅ Pauze/rust bevriest speeltijd.
- ✅ Aparte rustklok.
- ✅ Aparte pauzeklok in v0.8.
- ✅ Veld- en banktijd + huidige beurt.
- ✅ Wissels.
- ✅ Positie wijzigen.
- ✅ Atomaire positieruil.
- ✅ Scorebord + eigen/tegen-goals.
- ✅ Scorer/assist + goaltype/notitie.
- ✅ Correcties en ongeldig maken.
- ✅ Stoppen met bevestiging.
- ✅ Afsluiten en opslaan is gescheiden van definitief verwijderen.
- 🟡 Live veld visueel/veldmarkeringen verder gebruikersvalideren.
- 🟡 Live drag & drop veld → veld.
- 🟡 Live bank onder veld + drag/drop bank ↔ veld.
- 🟡 Formatie tijdens wedstrijd atomair wijzigen.
- 🟡 Live monitoring moet alle drag/formatie/positie-effecten overal correct tonen.
- 🟡 Kleurlegenda moet op live veld, monitoring, gebeurtenissen, veld- en bankspelers zichtbaar zijn.
- 🟡 Automatische eindstop + verlenging + strafschoppen volledig E2E testen.

## Gebeurtenissen

- ✅ Nederlandse beschrijvingen.
- ✅ Werkelijke gebeurtenisdata en exacte wedstrijdtijd.
- ✅ Positiewijziging `oud → nieuw`.
- ✅ Goal toont tussenstand.
- ✅ Ongeldige goal toont reden + gecorrigeerde stand.
- ✅ Strafschoppen hebben aparte stand.
- ✅ Speleracties als events.

## Spraak

- ✅ Naam en rugnummer.
- ✅ Tekstfallback.
- ✅ Expliciete bevestiging vóór mutatie.
- ✅ Restart-safe SpeechRecognition-sessie.
- 🟡 Android/Chrome praktijkbetrouwbaarheid nog testen.

## Historie en verwijderen

- ✅ Opgeslagen voorbereiding opnieuw openen.
- ✅ Wedstrijdhistorie basis.
- ✅ Afgeronde/opgeslagen wedstrijd veilig verwijderen.
- ✅ Oefenwedstrijd 22 augustus bewaard.
- ⬜ Volledig wedstrijddetail met events/correcties/opstellingen/fases.
- ⬜ Exportpariteit CSV/XLSX/PDF.

## Dashboard

- ✅ Basis Cloud dashboard.
- ✅ Wedstrijden aan/uit voor dashboard/rating.
- ✅ Speleraggregaties.
- ✅ Actieaggregaties.
- ✅ Rating 1–100 basis.
- ⬜ Uitgebreide filters en sortering/ranking.
- ⬜ Wedstrijddetail vanuit dashboard.
- ⬜ Trends/grafieken.

## Beheer

- 🟡 Nieuwe club/team/seizoen/speler basis aanwezig; verdere gebruikerstest/UX nodig.
- 🟡 Rugnummer/voorkeursposities/spelergegevens basis aanwezig.
- ⬜ Volledig wijzigen/kopiëren/overzetten tussen seizoenen.
- ⬜ Gebruikers, rollen en rechtenmatrix.

## Trainingen — nieuw boven v0.7.6

- ✅ Trainingsmomenten + aanwezigheid + beoordelingen.
- ✅ Eén centrale opslagactie.
- ✅ Opgeslagen training opnieuw openen/bewerken.
- 🟡 Geïsoleerde Trainingen-workspace gebouwd; release en praktijktest volgen.
- ✅ Trainingsscore 1–100 basis.

## Belangrijkste parity-gaten vóór 'Parity Complete'

1. Echte browser/device-validatie van basis/live drag & drop, bank en formatie.
2. Mobiele UX van voorbereiding/live schermen.
3. Volledig historie-/wedstrijddetail.
4. Exportpariteit.
5. Uitgebreide dashboardfilters/ranking.
6. Team/seizoen/spelerbeheer praktisch afronden.
7. Alle zichtbare teksten/legenda's/plaatsing nog één keer gebruikersgericht nalopen.
