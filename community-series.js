const dayMs=86400000;
export function chinaDay(value){return new Date(Date.parse(value)+8*3600000).toISOString().slice(0,10);}
export function weekPhases(start,count=12){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(Date.parse(start))||new Date(start+'T00:00:00Z').toISOString().slice(0,10)!==start||!Number.isInteger(count)||count<1||count>52)throw Error('请选择有效开始日期及1—52周');
  const at=Date.parse(start+'T00:00:00+08:00');return Array.from({length:count},(_,i)=>({id:'week-'+(i+1),label:'第'+(i+1)+'周',startedAt:new Date(at+i*7*dayMs).toISOString(),endedAt:new Date(at+(i+1)*7*dayMs-1).toISOString()}));
}
export function reportSeries(report,domainKey,cadence='phase'){
  const d=report.domains.find(x=>x.key===domainKey),m=d.metrics.find(x=>x.key===d.primaryMetric);
  if(cadence==='phase')return report.phases.map((p,i)=>({id:p.id,label:p.label,at:p.startedAt,end:p.endedAt,score:m.standardized[i]?.score??null,...m.perPhase[i],score:m.standardized[i]?.score??null,matchedCount:m.matched[i]?.denominator??0}));
  const valid=e=>['consistent','conflict'].includes(e.status),rows=report.evidence.filter(e=>e.metric===m.key&&e.counted),base=rows.filter(e=>e.phaseId===report.phases[0].id&&e.mainEligible&&valid(e)),last=new Set(rows.filter(e=>e.phaseId===report.phases.at(-1).id&&e.mainEligible&&valid(e)).map(e=>e.stratum));
  const weights=[...new Set(base.map(e=>e.stratum))].filter(k=>last.has(k)).map(k=>({key:k,n:base.filter(e=>e.stratum===k).length})),total=weights.reduce((sum,w)=>sum+w.n,0),start=Date.parse(chinaDay(report.phases[0].startedAt)+'T00:00:00+08:00'),end=Date.parse(chinaDay(report.phases.at(-1).endedAt)+'T00:00:00+08:00');
  const points=[];for(let at=start;at<=end&&points.length<3660;at+=dayMs){const date=chinaDay(new Date(at).toISOString()),items=rows.filter(e=>e.at&&chinaDay(e.at)===date),good=items.filter(e=>valid(e)&&e.status==='consistent'),eligible=items.filter(e=>e.mainEligible&&valid(e)),groups=weights.map(w=>({w,rows:eligible.filter(e=>e.stratum===w.key)})),score=total&&groups.every(g=>g.rows.length)?groups.reduce((sum,g)=>sum+g.rows.filter(e=>e.status==='consistent').length/g.rows.length*100*g.w.n/total,0):null;
    points.push({id:date,label:date.slice(5).replace('-','/'),at:new Date(at).toISOString(),end:new Date(at+dayMs-1).toISOString(),score,numerator:good.length,denominator:items.filter(valid).length,matchedCount:eligible.filter(e=>weights.some(w=>w.key===e.stratum)).length,excluded:items.filter(e=>e.status==='excluded').length,unresolved:items.filter(e=>e.status==='unresolved').length,evidenceIds:items.map(e=>e.id)});
  }return points;
}
