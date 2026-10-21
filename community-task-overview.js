import {residentLabel,taskResultTitle} from './community-labels.js';
import {TASKS,taskScore,comparableTask} from './community-elder-schema.js';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value=n=>Number.isFinite(n)?n.toFixed(1)+'%':'—';
const when=v=>new Date(v).toLocaleString('zh-CN',{hour12:false});
const labels={immediate_memory:'即刻记忆与学习',delayed_memory:'延迟记忆',attention:'注意相关任务',executive:'执行功能相关任务',language:'语言与语义信息使用',visuospatial:'视觉位置记忆'};
export function taskObservation(resident,assessment,index){
 const empty={...TASKS[index],score:null,numerator:0,denominator:0,excluded:0,assisted:0,status:'not_connected'};
 if(!resident||!assessment)return {score:empty,points:[],delta:null,first:null,last:null};
 const history=[...resident.assessments].sort((a,b)=>a.completedAt.localeCompare(b.completedAt));
 const selected=history.findIndex(a=>a.assessmentId===assessment.assessmentId);
 const points=history.slice(0,selected+1).map(a=>({a,s:taskScore(a,index),comparable:comparableTask(a,assessment,index)}));
 const eligible=points.filter(p=>p.comparable&&p.s.score!==null),score=taskScore(assessment,index),first=eligible[0]||null,last=eligible.at(-1)||null;
 const delta=score.score!==null&&last?.a.assessmentId===assessment.assessmentId&&eligible.length>1?last.s.score-first.s.score:null;
 return {score,points,delta,first,last};
}
function sparkline(points,name){
 const xy=points.map((p,i)=>({...p,x:points.length===1?150:12+i*276/(points.length-1),y:p.s.score===null?null:49-p.s.score*.4}));
 return `<svg viewBox="0 0 300 60" role="img" aria-label="${e(name)}历次任务正确率，缺失不连线"><path d="M12 49H288M12 29H288M12 9H288" stroke="#ece7db" stroke-width="1" fill="none"/>${xy.map((p,i)=>`${i&&p.comparable&&xy[i-1].comparable&&p.y!==null&&xy[i-1].y!==null?`<path d="M${xy[i-1].x} ${xy[i-1].y}L${p.x} ${p.y}" fill="none" stroke="currentColor" stroke-width="2.3"/>`:''}${p.y!==null?`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${p.comparable?'currentColor':'#9d958a'}"><title>${e(when(p.a.completedAt))} ${value(p.s.score)}${p.comparable?'':'（条件不同）'}</title></circle>`:''}`).join('')}${!points.some(p=>p.s.score!==null)?'<text x="150" y="33" text-anchor="middle">等待有效测评记录</text>':''}</svg>`;
}
export function taskOverview(residents,resident,assessment,{allowDemo=false,expanded=false}={}){
 const rows=TASKS.map((t,i)=>({...taskObservation(resident,assessment,i),task:t,index:i}));
 const measured=rows.filter(r=>r.score.score!==null).length,compared=rows.filter(r=>r.delta!==null).length;
 return `<section class="task-monitor" aria-label="九项改编任务成绩与趋势"><header class="task-monitor-head"><div><span class="badge">改编任务 · 成绩与趋势</span><h2>${resident?e(residentLabel(resident.name))+'的九项测评':'九项任务测评看板'}</h2><p>${assessment?`${e(assessment.prototype)} · ${e(when(assessment.completedAt))}`:resident?'原账号已关联，尚无分项成绩':'接入老人端完成的测评或导入 JSON，即可自动显示成绩。'}</p></div><div class="task-monitor-selectors"><label>测评居民<select id="elder-dash-resident" ${residents.length?'':'disabled'}>${residents.length?residents.map(r=>`<option value="${e(r.id)}" ${r.id===resident?.id?'selected':''}>${e(residentLabel(r.name))} · ${e(r.sourceUserId)}</option>`).join(''):'<option>尚无测评档案</option>'}</select></label>${resident?.assessments.length?`<label>测评记录<select id="elder-dash-assessment">${[...resident.assessments].reverse().map(a=>`<option value="${e(a.assessmentId)}" ${a.assessmentId===assessment?.assessmentId?'selected':''}>${e(when(a.completedAt))}${a.tourMode?' · 讲解模式':''}</option>`).join('')}</select></label>`:''}</div></header>
 <div class="task-monitor-caption"><span><strong>${measured}/9</strong>项有有效成绩</span><span><strong>${compared}/9</strong>项可比较</span><span>正确率＝正确数 / 有效作答数</span><a href="#assessments">记录、导入与完整报告</a></div>
 ${!assessment?`<div class="task-missing-note"><p>${resident?'旧版只保存完成或跳过标记，没有逐题答案。完成新版测评或导入已有记录后，以下九项自动更新。':'尚无逐题测评记录。可接入老人端记录，或先查看已有测评记录。'}</p>${allowDemo?'<button data-course-example>查看九项测评</button>':''}</div>`:''}
 <details class="task-detail-fold" ${expanded?'open':''}><summary>查看九项任务成绩与历次趋势</summary><div class="task-monitor-grid">${rows.map(({task:t,index,score:s,points,delta})=>{const direction=delta===null?'unavailable':delta>0?'up':delta<0?'down':'flat';const status=s.score!==null?'任务正确率':s.status==='skipped'?'已跳过':s.status==='unavailable'?'前置任务未完成':s.status==='not_connected'?'尚未接入':'无有效成绩';return `<article class="task-monitor-card ${direction}" data-task-card="${t.id}"><header><span class="task-order">${index+1}</span><div><h3>${e(residentLabel(t.name))}</h3><small>${e(labels[t.domain]||'时间定向')}</small></div></header><div class="task-monitor-value"><button ${assessment?`data-elder-task="${index}"`:'disabled'} aria-label="${e(residentLabel(t.name))}成绩 ${value(s.score)}，查看计分依据">${value(s.score)}</button><span>${status}</span></div><div class="task-monitor-spark">${sparkline(points,t.name)}</div><div class="task-monitor-bottom"><button ${assessment?`data-elder-task="${index}"`:'disabled'}>${s.score===null?'暂无有效作答':`${s.numerator}/${s.denominator} 正确 / 有效`}</button><span>${delta===null?'暂不可比较':`${delta>0?'↑ +':delta<0?'↓ ':'→ '}${delta.toFixed(1)}个百分点`}</span></div>${index===7&&s.assisted?`<p class="task-card-note">显示图片辅助 ${s.assisted}次，单列记录</p>`:index===8&&s.score!==null?`<p class="task-card-note">命中 ${s.hits}/${s.targets} · 漏答 ${s.misses} · 误触 ${s.falseAlarms}</p>`:''}</article>`;}).join('')}</div>
 </details><p class="task-monitor-footnote">九项均独立显示，未完成及缺失不记零分。变化表示同任务表现的差异，不合成为认知总分；查看数字可展开原始答案、任务时间与辅助记录。</p></section>`;
}
