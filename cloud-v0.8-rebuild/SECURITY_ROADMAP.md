# ClubMatch Cloud v0.8 — Security roadmap

## Doel
ClubMatch moet schaalbaar zijn naar meerdere clubs, teams en beheerders zonder dat een gestolen wachtwoord, oude sessie of foutieve client toegang geeft tot andere clubs of destructieve beheeracties.

## S0 — v0.8 development / vóór brede test
- [x] Alleen Supabase publishable key in browser; nooit service-role/secret key.
- [x] RLS + club-toegang als server-side autorisatiebasis.
- [x] Destructieve match-delete via expliciete server-RPC + club-admin controle + `DELETE` bevestiging.
- [x] Seriële/idempotente live-mutaties met `client_event_id`.
- [x] Auth-sessie refresh, logout en lifecycle-resync.
- [x] Gelokaliseerde loginfout zonder technische Auth-details.
- [x] Password-recovery transport: resetmail, recovery callback, nieuw wachtwoord.
- [x] TOTP/MFA transport: factors, enroll, challenge, verify, unenroll, AAL-status.
- [ ] Recovery UI volledig browser-getest op preview + redirect allowlist geverifieerd.
- [ ] TOTP enrollment/challenge UI volledig browser-getest.
- [ ] Supabase Leaked Password Protection inschakelen (security advisor-waarschuwing oplossen).

## S1 — vóór beta met echte coaches/beheerders
- [ ] MFA (TOTP) verplicht voor platform-admin/super-admin.
- [ ] MFA verplicht voor club-admin bij gevoelige acties; editor/coach gefaseerd.
- [ ] Server-side AAL2 afdwingen voor admin/destructieve RPC's; frontendcontrole is nooit voldoende.
- [ ] Minimaal één extra/backup MFA-factor adviseren voor admins. Supabase levert momenteel geen recovery codes.
- [ ] Sessiebeheer: actieve sessies/apparaten tonen en intrekken waar mogelijk.
- [ ] Re-authentication voor wijzigen e-mail/wachtwoord, rechten, club-admin en security-instellingen.
- [ ] Security notification e-mails voor wachtwoord/e-mail/MFA-wijzigingen inschakelen.
- [ ] Custom SMTP voor productie; standaard Supabase mailservice alleen voor development/test.
- [ ] CAPTCHA/botbescherming op login/reset/signup waar relevant.
- [ ] Auth rate limits controleren en productieprofiel vastleggen.

## S2 — vóór commerciële productie
- [ ] Least-privilege rollenmatrix: platform-admin, club-admin, team-manager/coach, editor, viewer.
- [ ] Auditlog voor login/security/admin en alle mutaties/correcties/verwijderingen.
- [ ] RLS/BOLA regressietests per rol, club en team.
- [ ] Security headers/CSP op productiehosting.
- [ ] Dependency/SCA, secret scanning, SAST en DAST in CI.
- [ ] Back-up/restore en incident-response runbook.
- [ ] Pentest vóór commerciële livegang en opnieuw na grote Auth/RBAC-wijzigingen.
- [ ] Monitoring/alerts op abnormale login- en mutatiepatronen.
- [ ] Periodieke key/secret-rotatie en toegangsreview.

## S3 — groei / enterprise
- [ ] Passkeys/WebAuthn evalueren zodra Supabase Auth passkeys uit beta en voor onze use-case production-ready zijn.
- [ ] SSO/OIDC/SAML voor grotere clubs/organisaties indien commercieel nodig.
- [ ] Organisatiebeleid voor verplichte MFA en session assurance.
- [ ] Dataretentie, export/verwijderbeleid en compliance-controles per tenant.

## Security release gates
1. Geen release wanneer v0.8 CI rood is.
2. Geen gevoelige client-only autorisatie: database/RPC moet dezelfde regel afdwingen.
3. Geen secrets in GitHub/browserbuild.
4. Na DDL/RLS/security-wijziging: Supabase security advisor + regressietests.
5. Voor productie: recovery + MFA + sessie + RBAC + pentest-gates moeten groen zijn.
