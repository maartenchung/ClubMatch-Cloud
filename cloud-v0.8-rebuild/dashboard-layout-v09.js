/* ClubMatch Cloud v0.8 - v09 dashboard typography and contextual-info layout owner */
(function(global){
'use strict';const doc=global.document;if(!doc)return;
function install(){if(doc.getElementById('dashboardLayoutV09'))return;const s=doc.createElement('style');s.id='dashboardLayoutV09';s.textContent=`
#v08PerformanceAnalysis .cmInfoAnchor,#v08PerformanceAnalysis .cmiScoreCard,#v08PerformanceAnalysis .cmiKpi,#v08PerformanceAnalysis .cmiMetric,#v08PerformanceAnalysis .cmiPlayer{position:relative;padding-right:48px!important}
#v08PerformanceAnalysis .cmInfoAnchor>.cmInfoBtn{right:10px!important;top:10px!important;width:24px!important;height:24px!important;z-index:5!important}
#v08PerformanceAnalysis .cmiInfo{right:10px!important;top:10px!important;width:24px!important;height:24px!important;z-index:5!important}
#v08PerformanceAnalysis .cmiScoreCard strong{font-size:34px!important;line-height:1.05!important;max-width:calc(100% - 10px)}
#v08PerformanceAnalysis .cmiKpi b{font-size:23px!important;line-height:1.1!important}
#v08PerformanceAnalysis .cmiKpi span{font-size:12px!important;line-height:1.3!important}
#v08PerformanceAnalysis .cmiKpi small,#v08PerformanceAnalysis .cmiMetric p,#v08PerformanceAnalysis .cmiFact{font-size:11px!important;line-height:1.45!important}
#v08PerformanceAnalysis .cmiScore{font-size:25px!important}
#v08PerformanceAnalysis .cmiPlayerRating{font-size:18px!important;min-width:46px!important;height:40px!important}
#v08PerformanceAnalysis .cmiPlayerKpis b{font-size:13px!important}
#v08PerformanceAnalysis .cmiPlayerKpis i{font-size:10px!important}
@media(max-width:620px){#v08PerformanceAnalysis .cmInfoAnchor,#v08PerformanceAnalysis .cmiScoreCard,#v08PerformanceAnalysis .cmiKpi,#v08PerformanceAnalysis .cmiMetric,#v08PerformanceAnalysis .cmiPlayer{padding-right:44px!important}#v08PerformanceAnalysis .cmiScoreCard strong{font-size:30px!important}}
`;doc.head.appendChild(s)}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install,{once:true});else install();
global.ClubMatchV09DashboardLayout={install};
})(typeof window!=='undefined'?window:globalThis);
