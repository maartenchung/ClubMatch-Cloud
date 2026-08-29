/* ClubMatch Cloud v0.8 - semantic button families and branding; visual only */
(function(global){
'use strict';
const BUILD='20260829.0520';
function stampBuild(doc=global.document){const badge=[...(doc?.querySelectorAll?.('.badge')||[])].find(el=>/v0\.8.*build/i.test(el.textContent||''));if(badge)badge.textContent=`v0.8 ONTWIKKELING · build ${BUILD}`;if(global.__ClubMatchShellBoot)global.__ClubMatchShellBoot.build=BUILD;doc?.documentElement?.setAttribute?.('data-clubmatch-build',BUILD)}
function ensurePauseGuard(doc=global.document){if(!doc||global.ClubMatchV08PauseActionGuard||doc.getElementById('v08PauseActionGuardScript'))return;const script=doc.createElement('script');script.id='v08PauseActionGuardScript';script.src=`pause-action-guard-v08.js?v=${BUILD}`;script.defer=true;doc.body.appendChild(script)}
function install(doc=global.document){if(!doc)return;if(!doc.getElementById('v08SemanticTheme')){const s=doc.createElement('style');s.id='v08SemanticTheme';s.textContent=`
/* Voorbereiding: rustig paars/outline zodat het duidelijk pre-match is. */
#v08Preparation .controls button,#v08Preparation .prepQuick button{background:#f4eef9!important;color:#4b2672!important;border:1px solid #8d6dac!important;box-shadow:none!important}
#v08Preparation #prepStartBtn{background:#6f42c1!important;color:#fff!important;border-color:#6f42c1!important}
#v08Preparation #prepSaveBtn{background:#fff!important;color:#5d3584!important;border:2px solid #6f42c1!important}
/* Live acties: helderder blauw/paars; hiermee wijken ze bewust af van voorbereiding. */
main:not(.hidden) .actionBox>.controls>button:not(.danger),main:not(.hidden) .actionBox .grid2+.controls>button:not(.danger){background:#3e5eaa;color:#fff;border:1px solid #314d91}
#subBtn{background:#295f9f!important}#goalForBtn{background:#4860ad!important}#goalAgainstBtn{background:#fff!important;color:#70408a!important;border:1px solid #70408a!important}
/* Spraak: eigen indigo familie. */
#v08Voice .voiceBtn{background:#f0efff!important;color:#3e3576!important;border:1px solid #7770af!important}#v08Voice .voiceCheckBtn{background:#5d48a1!important;color:#fff!important}#v08Voice .voiceConfirmBtn{background:#314e9b!important;color:#fff!important}#v08Voice .voiceCancelBtn{background:#fff!important;color:#62566b!important;border:1px solid #bdb2c5!important}
/* Correcties: amber outline; ongeldig: rood outline. Geen verwarring met normale live actie. */
#v08Corrections .corrActions button.secondary{background:#fff8e9!important;color:#765500!important;border:1px solid #c79528!important;font-weight:900}#v08Corrections .corrActions button.danger{background:#fff!important;color:#983263!important;border:2px solid #b95078!important;font-weight:900}#v08Corrections #corrSave{background:#c18019!important;color:#fff!important;border:1px solid #a66d0c!important}#v08Corrections #corrCancel{background:#f3f0f5!important;color:#5f5268!important;border:1px solid #bdb4c3!important}
#v08Corrections .corrState.changed{display:inline-block;background:#f0e5fa;color:#65398a;border-radius:999px;padding:2px 6px}#v08Corrections .corrState.voided{display:inline-block;background:#fff0f4;color:#983263;border-radius:999px;padding:2px 6px}
/* Live veldopstelling: alle informatie blijft leesbaar BINNEN een uniforme spelertegel. */
.v08HotfixPitchCard .v08PitchSlot{width:112px!important;height:92px!important;min-height:92px!important;max-height:92px!important}
.v08HotfixPitchCard .v08PitchPlayer{display:grid!important;grid-template-columns:minmax(0,1fr) 24px!important;grid-template-rows:14px 17px 15px 22px!important;grid-template-areas:'pos pos' 'name name' 'time time' 'action action'!important;align-content:center!important;align-items:center!important;gap:1px!important;width:100%!important;height:88px!important;min-height:88px!important;max-height:88px!important;padding:5px 6px!important;overflow:hidden!important;box-sizing:border-box!important;line-height:1.05!important}
.v08HotfixPitchCard .v08PitchPos{grid-area:pos!important;display:block!important;width:100%!important;max-width:100%!important;margin:0!important;font-size:9px!important;line-height:13px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#4b2672!important}
.v08HotfixPitchCard .v08PitchName{grid-area:name!important;display:block!important;width:100%!important;max-width:100%!important;margin:0!important;font-size:11px!important;line-height:16px!important;font-weight:900!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#241633!important}
.v08HotfixPitchCard .v08PitchTime{grid-area:time!important;display:block!important;width:100%!important;max-width:100%!important;margin:0!important;font-size:8px!important;line-height:14px!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#5d4770!important;font-variant-numeric:tabular-nums!important}
.v08HotfixPitchCard .v08PitchPlayer .v08QuickAction{grid-area:action!important;justify-self:start!important;align-self:center!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:24px!important;height:20px!important;min-height:20px!important;margin:0!important;padding:1px 6px!important;font-size:9px!important;line-height:16px!important}
.v08HotfixPitchCard .v08SlotLabel{bottom:-15px!important;font-size:7px!important;line-height:10px!important;max-width:112px!important;overflow:hidden!important;text-overflow:ellipsis!important}
@media(max-width:700px){.v08HotfixPitchCard .v08PitchSlot{width:104px!important;height:88px!important;min-height:88px!important;max-height:88px!important}.v08HotfixPitchCard .v08PitchPlayer{height:84px!important;min-height:84px!important;max-height:84px!important;grid-template-rows:13px 16px 14px 20px!important;padding:4px 5px!important}.v08HotfixPitchCard .v08PitchName{font-size:10px!important}.v08HotfixPitchCard .v08PitchTime{font-size:7.5px!important}}
.cmChungsCredit{margin-top:7px;font-size:11px;font-weight:800;color:#6f42c1}
button:focus-visible{outline:3px solid rgba(41,95,159,.35)!important;outline-offset:2px}
`;doc.head.appendChild(s)}
 const brand=doc.querySelector('.brand');if(brand)brand.textContent='Ontwikkeld door Chungs';const header=brand?.closest('.card');if(header&&!header.querySelector('.cmChungsCredit')){const credit=doc.createElement('div');credit.className='cmChungsCredit';credit.textContent='Ontwikkeld door Chungs';header.appendChild(credit)}
 stampBuild(doc);ensurePauseGuard(doc)
}
global.ClubMatchV08UxTheme={install,BUILD};install();global.setTimeout(()=>{stampBuild();ensurePauseGuard()},150);
})(typeof window!=='undefined'?window:globalThis);
