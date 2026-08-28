# ClubMatch Cloud v0.8 — zichtbare roadmap na build 20260828.2225

## P0 — Smart Live UX
1. Echte mobiel/tablet test van speler → actie, A → B en Goal/assist.
2. Volledig wedstrijdscenario: rust/undo, automatische stop, blessuretijd, late speler, wissels, formatie, einde.
3. Live veld drag/drop, bank ↔ veld en positieruil op desktop + Android.
4. Generieke audit-safe correcties voor snelle/analistacties, bezit, attendance en assistcontext.

## P1 — Reliability & Multi-device
1. Realtime op twee echte devices valideren.
2. Twee coaches tegelijk: conflict recovery + duidelijke lokale feedback + geen dubbele mutaties.
3. Offline/reconnect en beleid voor offline writes/replay.
4. Desktopbrowser + Android E2E-suite als vaste releasegate.
5. Fast Resume: actieve match/score/clock/line-up vóór secundaire modules.

## P2 — Dashboard & Intelligence
1. Echte data kalibreren voor Speler 360, balbezit en actieverhoudingen.
2. Filters + directe wedstrijddetail-koppeling.
3. Rating v2: positiegewichten, uitleg en betrouwbaarheid.
4. Trends, belasting/speeltijd en Ontwikkelscore.
5. Meetkwaliteit/completeness zichtbaar maken.

## P3 — Beheer, rollen & Security
1. Team/seizoen/spelerbeheer inclusief kopiëren en archiveren.
2. Rollenmatrix + ouder/verzorger-kindmodel.
3. Multi-club switcher + onboarding.
4. MFA/AAL2, leaked-password protection, SMTP/securitymails, auditlog, CAPTCHA/rate limits.
5. Security review/pentest.

## P4 — Scale & Commercial
1. XLSX/PDF-export.
2. WhatsApp/notificaties + clubbranding.
3. Observability, backup/restore, incident-runbook en load-tests.
4. Entitlements, abonnementen en betaling/facturatie.
5. AVG/DPA, support/onboarding en commerciële launch-gates.
