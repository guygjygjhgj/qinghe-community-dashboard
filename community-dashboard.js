import {trendMeaning} from './community-inspection.js';
import {reportSeries,chinaDay} from './community-series.js';
import {reportVisuals,drawReportVisuals} from './community-visuals.js';
import {interpretDomain} from './community-interpretation.js';
const fmt=n=>Number.isFinite(n)?n.toFixed(1):'—';
export function dashboardSnapshot(r){
 const observed=r.domains.map(d=>({domain:d,interpretation:interpretDomain(r,d)}));
 const comparable=observed.filter(x=>x.interpretation.direction!=='unknown');
 const falling=comparable.filter(x=>x.interpretation.delta<0).sort((a,b)=>a.interpretation.delta-b.interpretation.delta);
 const rising=comparable.filter(x=>x.interpretation.delta>0).sort((a,b)=>b.interpretation.delta-a.interpretation.delta);
 const missing=observed.filter(x=>x.interpretation.direction==='unknown');
 const activePhases=r.phases.filter(p=>observed.some(x=>x.interpretation.points.find(v=>v.phase.id===p.id)?.score!=null)).length;
 return {observed,comparable:comparable.length,priority:falling[0]||missing[0]||comparable[0]||observed[0],priorityLabel:falling.length?'优先查看的下降表现':missing.length?'需要补齐的资料':'当前关注的表现',strength:rising[0]||null,activePhases,weekly:r.phases.every(p=>Math.abs(Date.parse(p.endedAt)-Date.parse(p.startedAt)+1-7*86400000)<1000),age:Number.isFinite(r.resident.age)?r.resident.age+'岁':'未记录',education:typeof r.resident.education==='string'&&r.resident.education.trim()?r.resident.education:'未记录'};
}
export function directionCounts(r){return {up:r.domains.filter(d=>d.delta!==null&&d.delta>0).length,down:r.domains.filter(d=>d.delta!==null&&d.delta<0).length,flat:r.domains.filter(d=>d.delta===0).length,missing:r.domains.filter(d=>d.delta===null).length};}
export function evidenceComposition(r){const rows=r.evidence.filter(e=>e.counted);return [{label:'可核对',value:rows.filter(e=>['consistent','conflict'].includes(e.status)).length,color:'#d99718'},{label:'已排除',value:rows.filter(e=>e.status==='excluded').length,color:'#c1c8cc'},{label:'不可判定',value:rows.filter(e=>e.status==='unresolved').length,color:'#f0dca2'}];}
function setup(canvas,height){const width=canvas.parentElement.clientWidth,ratio=window.devicePixelRatio||1;canvas.width=width*ratio;canvas.height=height*ratio;canvas.style.height=height+'px';const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.font='12px "Noto Sans SC","Microsoft YaHei"';return {ctx,width,height};}
export function createDashboard({api,escape:e,date,onEvidence,onReport,onResident}){
  let data=null,residentId=null,report=null,cadence='phase',domainKey=null,generation=0,lastReportId=null;const cache=new Map();
  const root=()=>document.querySelector('#dashboard-content');
  const badge=synthetic=>`<span class="badge ${synthetic?'synthetic':''}">${synthetic?'模拟资料':'导出资料'}</span>`;
  async function update(next){
    data=next;report=null;const seq=++generation,queryReport=new URL(location.href).searchParams.get('report');
    if(!data.residents.some(p=>p.id===residentId))residentId=data.residents.find(p=>p.latestReport?.id===queryReport)?.id||data.residents.find(p=>p.latestReport)?.id||data.residents[0]?.id||null;
    const p=data.residents.find(p=>p.id===residentId);
    root().innerHTML=`<div class="dashboard-toolbar"><label>当前居民<select id="dash-resident"><option value="">${p?'选择居民':'尚无居民资料'}</option>${data.residents.map(x=>`<option value="${e(x.id)}" ${x.id===residentId?'selected':''}>${e(x.name)}${x.synthetic?' · 模拟':''}</option>`).join('')}</select></label><div class="dashboard-scope"><strong>社区概览</strong><span><a href="#residents">${data.counts.residents}位居民</a></span><span><a href="#residents">${data.counts.comparable}位可比较</a></span></div><button id="dash-open-report" disabled>查看完整报告</button></div><div id="dash-analysis"><div class="empty"><p>${p?.latestReport?'正在载入阶段图表…':'还没有阶段报告。导入资料并选择观察阶段后生成。'}</p>${!p?.latestReport?'<a class="button primary" href="#residents">进入居民档案</a><button data-weekly-demo>打开12周模拟案例</button>':''}</div></div><details class="resident-overview"><summary>社区居民列表（${data.residents.length}位）</summary><div class="section-heading"><a href="#residents">查看全部档案</a></div>${data.residents.length?`<div class="table-wrap"><table><thead><tr><th>居民</th><th>最近报告</th><th>可比较领域</th><th>操作</th></tr></thead><tbody>${data.residents.map(x=>`<tr><td><strong>${e(x.name)}</strong> ${badge(x.synthetic)}</td><td>${x.latestReport?date(x.latestReport.createdAt):'尚无报告'}</td><td>${x.latestReport?.summary.comparableDomains??0}/7</td><td><button data-dash-resident="${e(x.id)}">查看趋势</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="small">尚无已接入居民。</p>'}</details>`;
    if(!p?.latestReport){report=null;return;}
    try{if(!cache.has(p.latestReport.id))cache.set(p.latestReport.id,await api('/api/community/reports/'+p.latestReport.id));if(seq!==generation)return;report=cache.get(p.latestReport.id);document.querySelector('#dash-open-report').disabled=false;renderReportPanel();}catch(err){if(seq===generation)document.querySelector('#dash-analysis').innerHTML=`<div class="empty"><h3>图表暂未载入</h3><p>${e(err.message)}</p><button id="dash-retry">重新载入</button></div>`;}
  }
  function renderReportPanel(){
    const snap=dashboardSnapshot(report),c=directionCounts(report);
    if(lastReportId!==report.id){domainKey=snap.priority.domain.key;lastReportId=report.id;}
    const d=report.domains.find(d=>d.key===domainKey)||report.domains[0];domainKey=d.key;
    const highlight=(entry,label,tone)=>{
      if(!entry)return `<section class="observation-highlight neutral"><p class="highlight-label">${label}</p><h3>暂无首末上升的领域</h3><p class="highlight-context">保留持平、下降与资料缺口，按实际结果呈现。</p></section>`;
      const {domain:x,interpretation:t}=entry;
      return `<section class="observation-highlight ${tone}"><div><p class="highlight-label">${e(label)}</p><button class="highlight-domain" data-dash-domain="${x.key}">${e(x.label)}</button><div class="highlight-value"><button class="number-link" data-dash-explain="${x.key}">${t.delta===null?'—':(t.delta>0?'+':'')+fmt(t.delta)}</button><span>${t.delta===null?'暂不可比较':'个百分点'}</span></div><p class="highlight-context">${e(t.pattern)} · ${fmt(t.first?.score)} → ${fmt(t.last?.score)}</p></div><div class="highlight-graphic"><canvas data-highlight="${x.key}" role="img" aria-label="${e(x.label)}的阶段轨迹，首末值${fmt(t.first?.score)}至${fmt(t.last?.score)}"></canvas><button data-dash-explain="${x.key}" class="highlight-evidence">查看依据</button></div></section>`;
    };
    document.querySelector('#dash-analysis').innerHTML=`
      <section class="resident-snapshot" aria-label="居民基础认知信息">
        <div class="snapshot-person"><span class="snapshot-avatar" aria-hidden="true">${e(report.resident.name.slice(0,1))}</span><div><p class="snapshot-kicker">居民认知相关表现档案 ${badge(report.synthetic)}</p><h2>${e(report.resident.name)}</h2><p class="snapshot-demographics">年龄 <strong>${e(snap.age)}</strong><span>受教育情况 <strong>${e(snap.education)}</strong></span></p></div></div>
        <div class="snapshot-baseline"><span>七维观察基线</span><strong>${e(report.phases[0].label)} · ${snap.observed.filter(x=>Number.isFinite(x.interpretation.first?.score)).length}/7领域有值</strong><p>基线来自所选首阶段的活动记录。<br>标准化认知筛查：未提供</p></div>
        <div class="snapshot-window"><span>本期观察窗口</span><strong>${report.phases.length}${snap.weekly?'周':'个阶段'}</strong><p>${chinaDay(report.phases[0].startedAt)} — ${chinaDay(report.phases.at(-1).endedAt)}</p><small>截至资料日期 ${chinaDay(report.phases.at(-1).endedAt)}</small></div>
        <img class="snapshot-mascot" src="./community-assets/mascot.png" alt="" aria-hidden="true" width="108" height="145">
      </section>
      <div class="observation-highlights" aria-label="本期重点观察">
        ${highlight(snap.priority,snap.priorityLabel,'attention-highlight')}
        ${highlight(snap.strength,'首末升幅较大的表现','growth-highlight')}
        <section class="observation-coverage"><p class="highlight-label">本期可比较资料</p><div><button class="number-link" data-dash-inspect="comparable"><strong>${snap.comparable}<small>/7</small></strong></button><span>领域可比较</span></div><div class="phase-coverage" role="img" aria-label="${snap.activePhases}/${report.phases.length}个阶段有有效观察值">${report.phases.map(p=>`<i class="${snap.observed.some(x=>x.interpretation.points.find(v=>v.phase.id===p.id)?.score!=null)?'covered':''}" title="${e(p.label)}"></i>`).join('')}</div><p><button class="number-link" data-dash-inspect="phases">${snap.activePhases}/${report.phases.length}</button> 有效阶段 <span>·</span> <button class="number-link" data-dash-inspect="effective">${report.summary.effectiveEvents}</button> 有效事件</p><small>${c.up}项上升 · ${c.down}项下降 · ${c.flat}项首末相同</small></section>
      </div>
      <div class="dashboard-section-heading"><div><h2>七维认知相关表现</h2><p>选择维度查看周／日轨迹，点击分数查看评分依据。</p></div><span>活动观察分 0—100</span></div>
      <div class="domain-selector" role="group" aria-label="选择认知维度">${report.domains.map(x=>`<div class="domain-choice" data-selected="${x.key===domainKey}"><button class="domain-choice-label" data-dash-domain="${x.key}" aria-pressed="${x.key===domainKey}"><span>${e(x.label)}</span></button><button class="domain-choice-score" data-dash-explain="${x.key}" aria-label="${e(x.label)}变化评分原因"><strong class="${x.delta===null?'unknown':x.delta>0?'up':x.delta<0?'down':'flat'}">${x.delta===null?'暂无比较':(x.delta>0?'+':'')+fmt(x.delta)}<small>${x.delta===null?'':'个百分点'}</small></strong></button></div>`).join('')}</div>
      <div class="dashboard-primary-grid">
        <section class="dash-trend chart-panel"><div class="chart-title-row"><div><h2>重点维度趋势</h2><p id="dash-line-caption" class="small"></p></div><div class="tab-bar" role="group" aria-label="看板时间粒度"><button data-dash-cadence="phase" aria-pressed="${cadence==='phase'}">每周／阶段</button><button data-dash-cadence="day" aria-pressed="${cadence==='day'}">每日</button></div></div><div class="dash-plot"><canvas id="dash-trend" role="img" aria-label="所选认知维度的观察分趋势；完整数值及证据见阶段报告"></canvas></div><div class="selected-domain-reading"><div><strong id="dash-domain-conclusion"></strong><span id="dash-trajectory" class="trajectory-tag"></span></div><p id="dash-trend-meaning"></p><details><summary>查看完整解释与影响因素</summary><p id="dash-full-meaning"></p></details></div><p class="chart-caption">缺失不补零 · 点击数据点查看原文</p></section>
        <div class="dash-current-profile"></div>
      </div>
      <section class="dashboard-visuals" aria-label="全周期覆盖与每日变化">${reportVisuals(report,{prefix:'dash-'})}</section>
      <section class="dash-quality chart-panel"><h2>证据与数据质量</h2><p class="small">核对项构成 · 点击计数查看原因</p><div class="donut-container"><canvas id="dash-quality" role="img" aria-label="可核对、已排除和不可判定的核对项构成"></canvas></div><div id="dash-quality-legend" class="donut-legend"></div><p class="quality-reading">提示、协助和界面异常单独保留，不直接记作认知错误。</p></section>
      <div class="inspection-entry"><button data-dash-inspect="guide">数据采集与评分方法</button><span class="small">七维分别观察，不合成为脑健康总分</span></div><p class="dashboard-footnote">${report.synthetic?'本页为模拟案例。':''}观察分用于认知相关表现的趋势参考；构建能力等未覆盖部分保留缺口。</p>`;
    const visuals=root().querySelector('.dashboard-visuals .visual-grid'),comparison=visuals.querySelector('.visual-card');
    comparison.classList.add('baseline-comparison');comparison.querySelector('h3').textContent='七维基线与当前表现';
    root().querySelector('.dash-current-profile').append(comparison);
    visuals.append(root().querySelector('.dash-quality'));
    draw();if(root().getBoundingClientRect().width)requestAnimationFrame(()=>window.scrollTo(0,0));
  }

  function drawTrend(){
    const canvas=document.querySelector('#dash-trend');if(!canvas||!canvas.getBoundingClientRect().width)return;const {ctx,width,height}=setup(canvas,260),d=report.domains.find(d=>d.key===domainKey),points=reportSeries(report,domainKey,cadence),left=34,right=20,top=23,bottom=34,w=width-left-right,h=height-top-bottom;
    const interpretation=interpretDomain(report,d);document.querySelector('#dash-domain-conclusion').textContent=interpretation.title;document.querySelector('#dash-trajectory').textContent=interpretation.pattern;document.querySelector('#dash-trend-meaning').textContent=interpretation.meaning;document.querySelector('#dash-full-meaning').textContent=trendMeaning(report,d);
    document.querySelector('#dash-line-caption').textContent=d.label+' / '+(cadence==='day'?'每日变化':'每周／阶段变化');
    [0,25,50,75,100].forEach(value=>{const y=top+h*(1-value/100);ctx.strokeStyle='#eae4d8';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();ctx.fillStyle='#756b60';ctx.textAlign='left';ctx.fillText(value,0,y+4);});
    const first=Date.parse(points[0].at),last=Date.parse(points.at(-1).at),plotted=points.map(p=>({...p,x:points.length===1?left+w/2:left+(Date.parse(p.at)-first)/(last-first||1)*w,y:p.score===null?null:top+h*(1-p.score/100)}));
    ctx.lineWidth=2.4;ctx.strokeStyle='#bd6316';for(let i=1;i<plotted.length;i++)if(plotted[i-1].y!==null&&plotted[i].y!==null){ctx.beginPath();ctx.moveTo(plotted[i-1].x,plotted[i-1].y);ctx.lineTo(plotted[i].x,plotted[i].y);ctx.stroke();}
    const step=Math.max(1,Math.ceil(points.length/(width<450?4:7)));plotted.forEach((p,i)=>{ctx.textAlign='center';ctx.fillStyle='#756b60';if(i%step===0||i===points.length-1)ctx.fillText(p.label,p.x,height-10);if(p.y===null)return;ctx.fillStyle='#bd6316';ctx.beginPath();ctx.arc(p.x,p.y,cadence==='day'?2.4:3.7,0,Math.PI*2);ctx.fill();if(cadence==='phase'&&(width>550||i%step===0||i===points.length-1))ctx.fillText(fmt(p.score),p.x,p.y-9);});
    const closest=event=>{const x=event.clientX-canvas.getBoundingClientRect().left;return plotted.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a,plotted[0]);};canvas.onmousemove=event=>{const p=closest(event);canvas.title=`${cadence==='day'?p.id:p.label}：${fmt(p.score)}；符合依据/可核对 ${p.numerator}/${p.denominator}`;};canvas.onclick=event=>{const p=closest(event);onEvidence(report,d.key,d.primaryMetric,cadence==='phase'?p.id:null,cadence==='day'?p.id:null);};
  }
  function drawQuality(){const canvas=document.querySelector('#dash-quality');if(!canvas||!canvas.getBoundingClientRect().width)return;const {ctx,width}=setup(canvas,185),parts=evidenceComposition(report),total=parts.reduce((sum,p)=>sum+p.value,0),x=width/2,y=92,rad=62;let angle=-Math.PI/2;
    if(!total){ctx.strokeStyle='#e8e6df';ctx.lineWidth=20;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.stroke();}for(const part of parts){const end=angle+(total?part.value/total:0)*Math.PI*2;if(part.value){ctx.beginPath();ctx.strokeStyle=part.color;ctx.lineWidth=20;ctx.arc(x,y,rad,angle,end);ctx.stroke();}angle=end;}
    canvas.tabIndex=0;canvas.style.cursor='pointer';canvas.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();onEvidence(report,null,null,null,null,{status:'valid'});}};canvas.onclick=event=>{const rect=canvas.getBoundingClientRect();let a=Math.atan2(event.clientY-rect.top-y,event.clientX-rect.left-x)+Math.PI/2;if(a<0)a+=Math.PI*2;let sum=0;const chosen=parts.find(p=>(sum+=p.value/(total||1)*Math.PI*2)>a)||parts[0];onEvidence(report,null,null,null,null,{status:chosen.label==='可核对'?'valid':chosen.label==='已排除'?'excluded':'unresolved'});};
    ctx.textAlign='center';ctx.fillStyle='#302018';ctx.font='bold 22px "Noto Sans SC"';ctx.fillText(parts[0].value,x,y+2);ctx.fillStyle='#756b60';ctx.font='12px "Noto Sans SC"';ctx.fillText('可核对项',x,y+24);document.querySelector('#dash-quality-legend').innerHTML=parts.map(p=>`<span><i class="${p.label==='可核对'?'quality-valid':p.label==='已排除'?'quality-excluded':'quality-unknown'}"></i>${p.label}<button class="number-link" data-dash-status="${p.label==='可核对'?'valid':p.label==='已排除'?'excluded':'unresolved'}"><strong>${p.value}</strong></button></span>`).join('');
  }
  function drawHighlights(){
    root().querySelectorAll('canvas[data-highlight]').forEach(canvas=>{
      const domain=report.domains.find(d=>d.key===canvas.dataset.highlight),points=reportSeries(report,domain.key,'phase'),{ctx,width,height}=setup(canvas,45),left=5,top=7,w=width-10,h=height-14;
      ctx.strokeStyle=domain.delta<0?'#b67642':'#4b8063';ctx.lineWidth=2;
      const plotted=points.map((p,i)=>({x:left+(points.length===1 ? .5 : i/(points.length-1))*w,y:p.score===null?null:top+(1-p.score/100)*h}));
      for(let i=1;i<plotted.length;i++)if(plotted[i-1].y!==null&&plotted[i].y!==null){ctx.beginPath();ctx.moveTo(plotted[i-1].x,plotted[i-1].y);ctx.lineTo(plotted[i].x,plotted[i].y);ctx.stroke();}
      plotted.forEach(p=>{if(p.y===null)return;ctx.beginPath();ctx.fillStyle=ctx.strokeStyle;ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();});
    });
  }
  function draw(){if(!report||!root()?.getBoundingClientRect().width)return;drawHighlights();drawTrend();drawQuality();drawReportVisuals(report,{root:root(),prefix:'dash-',detailKey:domainKey,onEvidence:(...args)=>onEvidence(report,...args)});}
  root().addEventListener('change',event=>{if(event.target.id==='dash-resident'){residentId=event.target.value;cadence='phase';update(data);}});
  root().addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.dashExplain)onEvidence(report,b.dataset.dashExplain);if(b.dataset.dashInspect)onEvidence(report,null,null,null,null,{scope:b.dataset.dashInspect});if(b.dataset.dashStatus)onEvidence(report,null,null,null,null,{status:b.dataset.dashStatus});if(b.dataset.dashDomain){domainKey=b.dataset.dashDomain;root().querySelectorAll('.domain-choice').forEach(x=>x.dataset.selected=x.querySelector('[data-dash-domain]').dataset.dashDomain===domainKey);root().querySelectorAll('[data-dash-domain]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.dashDomain===domainKey));draw();}if(b.dataset.dashCadence){cadence=b.dataset.dashCadence;root().querySelectorAll('[data-dash-cadence]').forEach(x=>x.setAttribute('aria-pressed',x===b));draw();}if(b.dataset.dashResident){residentId=b.dataset.dashResident;cadence='phase';update(data);}if(b.id==='dash-open-report'&&report)onReport(report.id);if(b.id==='dash-retry')update(data);});
  window.addEventListener('resize',draw);document.fonts.ready.then(draw);return {update,draw};
}
