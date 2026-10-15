import {monitoringRequested,monitorRequest} from './community-monitor-live.js';
const base=new URL('./',import.meta.url),cache=new Map();
async function load(file){if(!cache.has(file))cache.set(file,fetch(new URL(file,base)).then(async r=>{if(!r.ok)throw Error('展示资料未能载入，请刷新重试');return r.json();}).catch(err=>{cache.delete(file);throw err;}));return cache.get(file);}
const meta=()=>load('data/workspace.json');
const readOnly=()=>{throw Error('线上展示版不提交或分析新资料。当前可浏览12周模拟报告、原始证据及已完成的词汇分析。');};
export async function onlineApi(route,body){
 const u=new URL(route,base),p=u.pathname;if(monitoringRequested())return monitorRequest(p+u.search,body);const m=await meta(),id=m.defaultReport;
 if(body!==undefined){if(p==='/api/community/demo/weekly')return {reportId:id,reused:true};return readOnly();}
 if(p==='/api/community/imports')return {imports:[structuredClone(m.import)],livePlatformConnected:false};
 if(p==='/api/community/imports/'+m.import.id)return structuredClone(m.import);
 if(p==='/api/community/reports')return {reports:structuredClone(m.reportList)};
 if(p==='/api/community/residents/'+m.profile.resident.id+'/profile')return structuredClone(m.profile);
 if(p==='/api/community/overview')return filteredOverview(m,u.searchParams);
 if(p===`/api/community/reports/${id}`||p===`/api/community/reports/${id}/export`)return structuredClone(await load(`data/${id}/report.json`));
 if(p===`/api/community/reports/${id}/lexical`)return structuredClone(await load(`data/${id}/lexical.json`));
 const ev=p.match(/^\/api\/community\/reports\/([a-f0-9-]+)\/evidence\/(ev-[a-f0-9]+)$/);
 if(ev&&ev[1]===id){const report=await load(`data/${id}/report.json`),item=report.evidence.find(e=>e.id===ev[2]);if(!item)throw Error('这条证据不存在');const group=await load(`data/${id}/evidence-${item.phaseId}.json`);return structuredClone(group[item.id]);}
 const collection=p.match(/^\/api\/community\/reports\/([a-f0-9-]+)\/collection\/([a-z-]+)$/);
 if(collection&&collection[1]===id&&m.collections[collection[2]])return structuredClone(m.collections[collection[2]]);
 throw Error('此线上展示版未包含所请求的报告或操作。');
}
function filteredOverview(m,params){
 const data=structuredClone(m.overview),dataset=params.get('dataset')||'all',from=params.get('from')||'',to=params.get('to')||'';
 if(from&&to&&from>to)throw Error('阶段开始日期不能晚于结束日期');
 const start=from?Date.parse(from+'T00:00:00+08:00'):-Infinity,end=to?Date.parse(to+'T23:59:59.999+08:00'):Infinity;
 const inside=at=>!from&&!to||Number.isFinite(Date.parse(at))&&Date.parse(at)>=start&&Date.parse(at)<=end;
 data.filters={dataset,from,to};
 if(dataset==='actual'){for(const k of ['residents','records','events','tasks','activities','mutual','services'])data[k]=[];for(const key of Object.keys(data.counts))data.counts[key]=0;data.domains.forEach(d=>{for(const k of ['covered','up','down','flat','unavailable'])d[k]=0;});return data;}
 data.records=data.records.filter(x=>inside(x.at));data.events=data.events.filter(x=>inside(x.at));data.services=data.services.filter(x=>inside(x.at));
 for(const k of ['activities','mutual'])data[k]=data[k].filter(x=>x.records.some(r=>inside(r.at))||x.events.some(r=>inside(r.at)));
 for(const resident of data.residents){resident.records=data.records.filter(x=>x.residentId===resident.id).length;resident.events=data.events.filter(x=>x.residentId===resident.id).length;if(!resident.latestReport?.phases.some(p=>Date.parse(p.startedAt)<=end&&Date.parse(p.endedAt)>=start))resident.latestReport=null;}
 data.counts.records=data.records.length;data.counts.events=data.events.length;data.counts.reported=data.residents.filter(x=>x.latestReport).length;data.counts.comparable=data.residents.filter(x=>x.latestReport?.summary.comparableDomains>0).length;data.counts.insufficient=data.residents.filter(x=>!x.latestReport||x.latestReport.summary.comparableDomains<7).length;
 return data;
}
async function downloadApi(href){
 if(monitoringRequested()){const data=await monitorRequest(href),blob=new Blob([data.download??JSON.stringify(data,null,2)],{type:data.type||'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=data.name||'青禾-真实监测报告.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);return;}
 const u=new URL(href,base),m=await meta(),id=m.defaultReport;let file,name;
 if(u.pathname===`/api/community/reports/${id}/export`){const format=u.searchParams.get('format');if(['csv','daily','evidence'].includes(format)){file=`data/${id}/${format}.csv`;name=`青禾-模拟-${format}.csv`;}else{file=`data/${id}/report.json`;name='青禾-模拟认知趋势报告.json';}}
 else if(u.pathname===`/api/community/reports/${id}/lexical`){file=`data/${id}/lexical.json`;name='青禾-模拟词汇分析.json';}
 else throw Error('此下载需使用本地分析版。');
 const r=await fetch(new URL(file,base));if(!r.ok)throw Error('下载资料未能载入');const url=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
document.addEventListener('click',event=>{const a=event.target.closest('a[href^="/api/community/"]');if(!a)return;event.preventDefault();event.stopImmediatePropagation();downloadApi(a.getAttribute('href')).catch(err=>{document.querySelector('#error').textContent=err.message;});},true);
const url=new URL(location.href);if(!url.searchParams.has('report')&&!monitoringRequested()){const m=await meta();url.searchParams.set('report',m.defaultReport);if(!url.hash)url.hash='dashboard';history.replaceState(null,'',url);}
