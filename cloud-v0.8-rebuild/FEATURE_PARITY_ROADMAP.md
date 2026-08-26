# ClubMatch Cloud v0.8 — feature parity + roadmap

Status: `✅ klaar` · `🟡 basis aanwezig / verder afmaken` · `⬜ nog bouwen` · `🔒 release gate`

## A. Functionele pariteit met v0.7.6

### Account / sessie
- ✅ E-mail/wachtwoord login
- ✅ Wachtwoord vergeten + reset
- ✅ Sessies bewaren/verversen
- ✅ Uitloggen
- 🟡 TOTP 2FA UI/API aanwezig; verplichte admin-AAL2 volgt

### Wedstrijdvoorbereiding
- ✅ Team/seizoen kiezen
- ✅ Tegenstander, datum, tijd, duur
- ✅ Aanwezig / afwezig
- ✅ Selectie
- ✅ Exact 11 basisspelers server-side gevalideerd
- ✅ Posities uniek server-side gevalideerd
- ✅ Formatie opslaan
- 🟡 Visuele veldopstelling
- 🟡 Formatiepresets en automatische positie-indeling
- 🟡 Duidelijke bank/reservelijst
- ⬜ Rugnummer-/naamselectie optimaliseren
- ⬜ Voorbereiding volledig mobiel optimaliseren

### Live wedstrijd
- ✅ Confirmed Cloud state als enige waarheid
- ✅ Wedstrijdklok per seconde
- ✅ Aparte rustklok
- ✅ Pauze/rust bevriest effectieve speeltijd
- ✅ Veld + bank
- ✅ Totale speeltijd
- ✅ Totale banktijd
- ✅ Huidige veldbeurt
- ✅ Huidige bankbeurt
- ✅ Wissels
- ✅ Positie wijzigen
- ✅ Posities atomair ruilen
- ✅ Eigen goal + scorer + assist
- ✅ Goal tegenstander
- ✅ Scorebord
- ✅ Wisselmonitor
- ✅ Eventtijdlijn
- ✅ Stop wedstrijd
- ✅ Veilig verwijderen afgeronde wedstrijd
- ⬜ Goaltype
- ⬜ Correctie wissel achteraf
- ⬜ Correctie positie achteraf
- ⬜ Correctie goal achteraf
- ⬜ Event ongeldig maken/herstellen vanuit UI
- ⬜ Spraakbediening naam/rugnummer

### Refresh / apparaten
- ✅ Actieve wedstrijd herstellen na refresh
- ✅ Basis- en current state uit Cloud herladen
- ✅ Focus/pageshow/online lifecycle resync
- 🟡 Polling fallback elke 5 seconden
- ⬜ Echte Supabase Realtime cross-device push
- 🔒 Desktop + Android echte E2E-test vóór beta

### Dashboard / historie
- ✅ Cloud dashboard-RPC
- ✅ Teamfilter basis
- ✅ Wedstrijdhistorie basis
- ✅ Speleraggregaties basis
- ⬜ Uitgebreide filters team/seizoen/speler/periode
- ⬜ Wedstrijddetail + events/correcties
- ⬜ Ranking/sortering per kolom
- ⬜ Export CSV/XLSX/PDF waar zinvol

### Beheer
- ⬜ Clubbeheer
- ⬜ Teambeheer
- ⬜ Seizoenen
- ⬜ Spelers toevoegen/wijzigen/verwijderen
- ⬜ Rugnummer + voorkeursposities beheren
- ⬜ Gebruikers uitnodigen
- ⬜ Rollen: platform-admin / club-admin / coach-editor / viewer
- ⬜ Rechtenmatrix in UI én server-side

## B. Belangrijke roadmap-zaken boven v0.7.6

### Security
- ✅ Publishable key only in browser
- ✅ RLS/RPC server-side autorisatiebasis
- ✅ Password recovery
- ✅ TOTP primitives/UI
- ⬜ Leaked Password Protection inschakelen
- ⬜ MFA verplicht voor platform-/club-admin
- ⬜ Server-side AAL2 voor destructieve/admin-RPC's
- ⬜ Security notification e-mails
- ⬜ Productie-SMTP
- ⬜ CAPTCHA/rate-limit profiel
- ⬜ Auditlog admin/security/destructieve mutaties
- 🔒 Pentest vóór commerciële productie

### Architectuur / kwaliteit
- ✅ Eén eventmodel → één derived live state → meerdere views
- ✅ Geen permanente optimistic UI-state
- ✅ Unieke client_event_id
- ✅ Exacte match_second als tijdbron
- ✅ CI na iedere v0.8-push
- ✅ Regressiegates 1–17
- ✅ Browser-assets versie-gepind tegen cache-regressies
- ⬜ Browser E2E-suite desktop
- ⬜ Android/mobile E2E-suite
- ⬜ Realtime transport
- ⬜ Observability/error telemetry

### Product / schaalbaarheid
- ⬜ Multi-club beheer
- ⬜ Multi-team/seizoen beheer
- ⬜ Generieke branding per club
- ⬜ Notificaties/WhatsApp-laag
- ⬜ Voice-command laag
- ⬜ Abonnement/entitlement model
- ⬜ Audit/export/dataretentie

## Releasevolgorde v0.8
1. **Parity Core** — voorbereiding, visuele opstelling, live, correcties, refresh/device consistency.
2. **Parity Complete** — spraak, historie/dashboard, beheerfuncties die in v0.7.6 werden verwacht.
3. **Security Beta Gate** — MFA/AAL2, roles/RLS, security checks, real-device E2E.
4. **Scale Beta** — Realtime, multi-team/club beheer, export/notifications.
5. **Commercial Gate** — pentest, observability, SMTP/security mails, abonnement/entitlements, operations.

## Regel
Geen feature wordt als `✅ klaar` beschouwd wanneer alleen de UI bestaat. Backendcontract + recovery/refresh + relevante test moeten ook werken.
