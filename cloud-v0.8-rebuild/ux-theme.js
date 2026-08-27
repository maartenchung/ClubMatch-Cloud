/* ClubMatch Cloud v0.8 - semantic button families; visual only, no action logic */
(function(global){
'use strict';
function install(doc=global.document){if(!doc||doc.getElementById('v08SemanticTheme'))return;const s=doc.createElement('style');s.id='v08SemanticTheme';s.textContent=`
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
button:focus-visible{outline:3px solid rgba(41,95,159,.35)!important;outline-offset:2px}
`;doc.head.appendChild(s)}
global.ClubMatchV08UxTheme={install};install();
})(typeof window!=='undefined'?window:globalThis);
