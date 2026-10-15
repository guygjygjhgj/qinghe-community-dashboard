// Descriptive interpretation of the saved, condition-matched series. No clinical cutoffs.
const finite = Number.isFinite;
const fmt = n => finite(n) ? n.toFixed(1) : '—';
const profiles = {
 immediate_memory: {subject:'新信息使用', focus:'新约定中的时间、数量等信息，在后续表达中与来源相符的比例', review:'结合信息是否仍可见、是否重新查看及提示记录，判断新信息使用的条件。'},
 delayed_memory: {subject:'历史信息再现', focus:'间隔一段时间后，对历史记录或约定的再现与原始依据相符的比例', review:'结合实际间隔、历史重看和提示记录解释，不能仅按间隔长短推断记忆能力。'},
 attention: {subject:'明确目标匹配', focus:'针对已明确的任务目标，选择、确认或回答与目标相符的比例', review:'核对目标是否明确呈现及相关界面异常；未回复或浏览时间不作为注意错误。'},
 language: {subject:'语义信息对应', focus:'本人表达中的对象、时间、数量等明确信息与当时依据相符的比例', review:'同时查看分词覆盖、词汇多样性与句法特征；此分数不代表词汇丰富程度。'},
 executive: {subject:'约定变更更新', focus:'约定修改后，按已生效的新条件回应或确认的比例', review:'检查新版本的生效与查看时间；流程完成率另行计数，不与信息更新合并。'},
 social: {subject:'明确需求回应', focus:'对他人已明确提出的请求或澄清，回应切合其具体需求的比例', review:'查看请求内容及回应关系；对方采纳、感谢和帮助次数仅作互动背景。'},
 visuospatial: {subject:'空间关系对应', focus:'对资料中已有位置、方向等空间关系，表达与依据相符的比例', review:'当前材料仅覆盖空间关系；没有构建任务材料时，构建能力仍为未覆盖。'}
};
export function interpretDomain(report, domain) {
 const metric=domain.metrics.find(m=>m.key===domain.primaryMetric), profile=profiles[domain.key]||{subject:metric.label,focus:metric.label,review:domain.scope||''};
 // Align by phase ID, never replace missing selected endpoints with other valid periods.
 const points=report.phases.map(p=>({phase:p,score:metric.standardized.find(x=>x.phaseId===p.id)?.score??null,counts:metric.matched?.find(x=>x.phaseId===p.id)}));
 const first=points[0],last=points.at(-1),covered=points.filter(p=>finite(p.score)).length;
 const comparable=domain.delta!==null&&points.length>1&&finite(first?.score)&&finite(last?.score);
 const delta=comparable?last.score-first.score:null, direction=!comparable?'unknown':delta>1e-8?'up':delta< -1e-8?'down':'flat';
 let rises=0,falls=0,adjacent=0;
 for(let i=1;i<points.length;i++)if(finite(points[i-1].score)&&finite(points[i].score)){adjacent++;const change=points[i].score-points[i-1].score;if(change>1e-8)rises++;if(change< -1e-8)falls++;}
 const complete=covered===points.length, mixed=rises>0&&falls>0;
 let pattern=!comparable?'暂不可比较':!complete?'阶段覆盖不连续':direction==='flat'?(rises||falls?'首末相同，期间波动':'各阶段观察值相同'):mixed?(direction==='up'?'波动中上升':'波动中下降'):points.length===2?'仅有首末对比':direction==='up'?'逐阶段不下降':'逐阶段不上升';
 const change=direction==='unknown'?'缺少可比较的首末数据':direction==='flat'?'首末比例相同':direction==='up'?'相符比例提高':'相符比例降低';
 const title=profile.subject+' · '+change;
 const meaning=comparable?profile.focus+(direction==='up'?'增加':direction==='down'?'减少':'首末相同')+'。':`目前${covered}/${points.length}个阶段有有效值；首末共同条件或有效资料不足，不能判断方向。`;
 const countText=p=>p?.counts&&p.counts.denominator>0?`${p.counts.numerator}/${p.counts.denominator}`:'—';
 const evidence=`有效阶段 ${covered}/${points.length}；首末匹配项 ${countText(first)} → ${countText(last)}。`;
 const trajectory=!comparable?'不替换观察窗口、不补零。':!complete?'缺失阶段保持空白，不跨缺口判断连续变化。':mixed?`相邻阶段出现${rises}次上升、${falls}次下降，首末方向不等于全程持续变化。`:direction==='flat'?'本周期所观察比例未变；仍需结合每期机会数和事件内容。':points.length===2?'目前只能描述首末差异，不能判断中间过程。':`相邻有效阶段${rises}次上升、${falls}次下降，其余持平；描述的是观察分方向。`;
 const stability=direction==='flat'?'首末比例相同不等于认知能力已证实稳定。':'';
 return {metric,points,first,last,delta,direction,covered,rises,falls,adjacent,pattern,title,meaning,evidence,trajectory,review:profile.review,scope:domain.scope||'',summary:`${profile.subject}：${fmt(first?.score)} → ${fmt(last?.score)}，${comparable?(delta>0?'+':'')+fmt(delta)+' 个百分点':'暂不可比较'}。${meaning}${pattern}；${trajectory}${stability} ${profile.review}`};
}
export function reportNarrative(report){
 const groups={up:[],down:[],flat:[],unknown:[]};
 for(const d of report.domains)groups[interpretDomain(report,d).direction].push(profiles[d.key]?.subject||d.label);
 return [groups.up.length?groups.up.join('、')+'的首末对应率上升':'',groups.down.length?groups.down.join('、')+'的首末对应率下降':'',groups.flat.length?groups.flat.join('、')+'首末相同':'',groups.unknown.length?groups.unknown.join('、')+'资料不足':''].filter(Boolean).join('；')+'。';
}
