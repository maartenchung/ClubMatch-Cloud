/* ClubMatch Cloud v0.8 - security UI; delegates all auth operations */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function createSecurityUi(options={}){
  const doc=options.document||global.document;invariant(doc?.createElement,'document is required');
  const authPanel=doc.getElementById('authPanel'),appPanel=doc.getElementById('appPanel');invariant(authPanel&&appPanel,'auth/app panels are required');
  const emailInput=doc.getElementById('email'),loginBtn=doc.getElementById('loginBtn');

  const forgot=doc.createElement('button');forgot.id='forgotPasswordBtn';forgot.type='button';forgot.className='secondary';forgot.dataset.v08Action='';forgot.textContent='Wachtwoord vergeten?';loginBtn.parentElement?.appendChild(forgot);
  const resetNote=doc.createElement('div');resetNote.id='passwordResetNote';resetNote.className='muted';resetNote.style.marginTop='7px';authPanel.appendChild(resetNote);

  const recovery=doc.createElement('section');recovery.id='securityRecoveryPanel';recovery.className='card hidden';recovery.innerHTML='<h2>Nieuw wachtwoord instellen</h2><div class="muted">Gebruik minimaal 12 tekens. Na wijzigen log je opnieuw in met het nieuwe wachtwoord.</div><div class="grid2" style="margin-top:8px"><label>Nieuw wachtwoord<input id="newPassword" type="password" autocomplete="new-password"></label><label>Herhaal wachtwoord<input id="newPasswordConfirm" type="password" autocomplete="new-password"></label></div><div class="controls"><button id="saveNewPasswordBtn" data-v08-action>Nieuw wachtwoord opslaan</button></div><div id="recoveryStatus" class="muted"></div>';
  authPanel.parentElement?.insertBefore(recovery,appPanel);

  const challenge=doc.createElement('section');challenge.id='securityMfaChallenge';challenge.className='card hidden';challenge.innerHTML='<h2>2FA-verificatie</h2><div class="muted">Open je authenticator-app en vul de actuele code in.</div><label style="display:block;margin-top:8px">Authenticatorcode<input id="loginMfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></label><div class="controls"><button id="verifyLoginMfaBtn" data-v08-action>Verifiëren</button><button id="mfaChallengeLogoutBtn" class="secondary" data-v08-action>Uitloggen</button></div><div id="mfaChallengeStatus" class="muted"></div>';
  recovery.parentElement?.insertBefore(challenge,appPanel);

  const securityCard=doc.createElement('section');securityCard.id='securitySettingsCard';securityCard.className='card';securityCard.innerHTML='<div class="sectionTitle"><div><h2>Beveiliging</h2><div class="muted">Wachtwoord, sessie en tweestapsverificatie</div></div><span id="mfaAalBadge" class="badge">AAL —</span></div><div id="mfaFactorList" class="muted" style="margin:8px 0">2FA-status laden…</div><div class="controls"><button id="enableMfaBtn" class="secondary" data-v08-action>+ Authenticator toevoegen</button><button id="refreshSecurityBtn" class="secondary" data-v08-action>↻ Security</button></div><div id="mfaEnrollBox" class="hidden" style="margin-top:10px;border:1px solid #e4d4f2;border-radius:12px;padding:10px"><b>Authenticator instellen</b><div class="muted">Scan de QR-code of voer de geheime sleutel handmatig in. Bewaar bij voorkeur een tweede factor als back-up.</div><img id="mfaQr" alt="2FA QR-code" style="display:block;max-width:240px;margin:10px auto"><div class="muted">Sleutel: <code id="mfaSecret"></code></div><label style="display:block;margin-top:8px">Code<input id="mfaEnrollCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></label><div class="controls"><button id="verifyMfaEnrollBtn" data-v08-action>2FA activeren</button><button id="cancelMfaEnrollBtn" class="secondary" data-v08-action>Annuleren</button></div></div>';
  appPanel.insertBefore(securityCard,appPanel.firstElementChild?.nextSibling||appPanel.firstChild);

  function setText(id,value){const el=doc.getElementById(id);if(el)el.textContent=String(value??'')}
  function showRecovery(show=true){recovery.classList.toggle('hidden',!show);authPanel.classList.toggle('hidden',show);appPanel.classList.add('hidden');challenge.classList.add('hidden')}
  function showChallenge(show=true){challenge.classList.toggle('hidden',!show);if(show){authPanel.classList.add('hidden');recovery.classList.add('hidden');appPanel.classList.add('hidden')}}
  function showApp(){challenge.classList.add('hidden');recovery.classList.add('hidden');authPanel.classList.add('hidden');appPanel.classList.remove('hidden')}
  function showLoggedOut(){challenge.classList.add('hidden');recovery.classList.add('hidden');appPanel.classList.add('hidden');authPanel.classList.remove('hidden')}
  function render(state){
    const mfa=state?.mfa||{},factors=mfa.factors||[];setText('mfaAalBadge',(mfa.currentLevel||'AAL —').toUpperCase());
    const list=doc.getElementById('mfaFactorList');if(list){list.replaceChildren();if(!factors.length)list.textContent='Nog geen 2FA-factor ingesteld.';else factors.forEach(f=>{const row=doc.createElement('div');row.style.cssText='display:flex;justify-content:space-between;gap:8px;align-items:center;padding:6px 0;border-top:1px solid #eee';const label=doc.createElement('span');label.textContent=`${f.friendly_name||'Authenticator'} · ${f.status||''}`;row.appendChild(label);if(f.status==='verified'){const remove=doc.createElement('button');remove.type='button';remove.className='small danger';remove.dataset.factorId=f.id;remove.textContent='Verwijder';remove.onclick=()=>options.onUnenroll?.(f.id);row.appendChild(remove)}list.appendChild(row)})}
    const enroll=doc.getElementById('mfaEnrollBox'),data=state?.enrollment;enroll?.classList.toggle('hidden',!data);if(data){const qr=doc.getElementById('mfaQr');if(qr)qr.src=data.qrCode||'';setText('mfaSecret',data.secret||'')}
  }
  forgot.onclick=()=>options.onRequestReset?.(emailInput?.value||'');
  doc.getElementById('saveNewPasswordBtn').onclick=()=>options.onUpdatePassword?.(doc.getElementById('newPassword').value,doc.getElementById('newPasswordConfirm').value);
  doc.getElementById('verifyLoginMfaBtn').onclick=()=>options.onVerifyLoginMfa?.(doc.getElementById('loginMfaCode').value);
  doc.getElementById('mfaChallengeLogoutBtn').onclick=()=>options.onLogout?.();
  doc.getElementById('enableMfaBtn').onclick=()=>options.onBeginEnrollment?.();
  doc.getElementById('refreshSecurityBtn').onclick=()=>options.onRefreshSecurity?.();
  doc.getElementById('verifyMfaEnrollBtn').onclick=()=>options.onVerifyEnrollment?.(doc.getElementById('mfaEnrollCode').value);
  doc.getElementById('cancelMfaEnrollBtn').onclick=()=>options.onCancelEnrollment?.();
  return Object.freeze({showRecovery,showChallenge,showApp,showLoggedOut,render,setResetNote:value=>setText('passwordResetNote',value),setRecoveryStatus:value=>setText('recoveryStatus',value),setChallengeStatus:value=>setText('mfaChallengeStatus',value)});
}
global.ClubMatchV08SecurityUi={createSecurityUi};
})(typeof window!=='undefined'?window:globalThis);
