export const courseAccountsRequested=()=>new URL(location.href).searchParams.get('cohort')==='accounts';
export const courseRequested=()=>new URL(location.href).searchParams.get('cohort')==='course';
export const MONITOR_OWNER_ORIGIN='https://qinghe-registration-review.hebaixuan01111123.chatgpt.site';
export const monitoringRequested=()=>new URL(location.href).searchParams.get('reference')!=='1';
const pending=new Map();let revision=-1,timer=null,refreshing=false,stopped=false,cloud=null,lastError='',pendingPaint=false;
export const cloudResidents=()=>monitoringRequested()?cloud:null;
export function monitorRequest(route,body,options={}){
 if(courseAccountsRequested())route='/api/community/course/accounts/read?route='+encodeURIComponent(route);
 if(courseRequested()){if(body!==undefined)return Promise.reject(Error('课程资料为只读，不能改写为真实业务'));return fetch('https://qinghe-registration-service.hebaixuan01111123.chatgpt.site/api/community/v1/course?route='+encodeURIComponent(route),{signal:AbortSignal.timeout(25000)}).then(async response=>{const value=await response.json();if(!response.ok)throw Error(value.error?.message||'课程资料暂未连接');return value;});}
 if(!monitoringRequested()||window.parent===window)return Promise.reject(Error('请从社区管理员专属监测入口登录后查看真实资料'));
 const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timeout=window.setTimeout(()=>{pending.delete(id);reject(Error('监测连接超时，原记录保持不变，请重试'));},25000);pending.set(id,{resolve,reject,timeout});window.parent.postMessage({source:'qinghe-monitor-child',version:1,id,route,body,cursor:options.cursor,requestId:options.requestId||crypto.randomUUID()},MONITOR_OWNER_ORIGIN);});
}
if(typeof window!=='undefined')window.addEventListener('message',event=>{const d=event.data;if(event.origin!==MONITOR_OWNER_ORIGIN||event.source!==window.parent||d?.source!=='qinghe-monitor-host'||d.version!==1)return;const p=pending.get(d.id);if(!p)return;pending.delete(d.id);window.clearTimeout(p.timeout);if(d.ok)p.resolve(d.result);else p.reject(Error(d.error||'监测请求未完成'));});
export async function refreshMonitoring(){
 if(!monitoringRequested()||refreshing||stopped||document.hidden)return;refreshing=true;
 try{const next=await monitorRequest('/api/community/monitor/state',undefined,{cursor:revision});if(!next.unchanged){revision=next.revision;cloud={residents:next.residents,assessmentCount:next.residents.reduce((n,r)=>n+r.assessments.length,0),issues:[],live:true,revision};pendingPaint=true;}if(pendingPaint&&!document.activeElement?.matches('input,textarea,select')&&!document.querySelector('dialog[open]')){pendingPaint=false;document.dispatchEvent(new window.CustomEvent('qinghe-monitor-updated',{detail:{revision}}));}if(lastError&&document.querySelector('#error')?.textContent===lastError)document.querySelector('#error').textContent='';lastError='';const banner=document.querySelector('.online-banner span');if(banner)banner.textContent=courseRequested()?'课程案例 · 预设资料 · 王桂香 / 张翠兰 / 李建文':courseAccountsRequested()?'课程账号当前记录 · 按账号自动同步 · 每2秒检查更新':'实时连接 · 已登录账号共享数据 · 每2秒检查更新';}
 catch(error){if(error.message!==lastError){lastError=error.message;const el=document.querySelector('#error');if(el)el.textContent=error.message;}}
 finally{refreshing=false;window.clearTimeout(timer);if(!stopped&&!document.hidden)timer=window.setTimeout(refreshMonitoring,2000);}
}
export function startMonitoring(){
 if(!monitoringRequested())return;
 if(courseRequested()||courseAccountsRequested()){const brand=document.querySelector('.brand');if(brand)brand.href=courseAccountsRequested()?'?cohort=accounts#dashboard':'?cohort=course#dashboard';const label=document.querySelector('.online-banner strong');if(label)label.textContent=courseAccountsRequested()?'课程账号当前记录':'课程人物档案';const select=document.querySelector('#dashboard-filters select[name=dataset]');if(select){select.value='synthetic';for(const option of select.options)if(option.value==='actual')option.disabled=true;}void refreshMonitoring();return;}
 const select=document.querySelector('#dashboard-filters select[name=dataset]');if(select){select.value='actual';for(const option of select.options){if(option.value==='synthetic'){option.hidden=true;option.disabled=true;}if(option.value==='actual')option.textContent='社区共享资料';}}
 const label=document.querySelector('.online-banner strong'),banner=document.querySelector('.online-banner span');if(label)label.textContent='社区信息监测';if(banner)banner.textContent='正在连接已授权居民资料…';
 if(window.parent===window){const entry=document.querySelector('.header-context a');if(entry){entry.textContent='进入社区工作台';entry.href=MONITOR_OWNER_ORIGIN+'/monitor';}if(banner)banner.textContent='请登录社区工作台查看已授权居民资料';}
 const intro=document.querySelector('[data-panel=cognition] .monitor-intro p');if(intro)intro.textContent='查看居民的单次任务表现和历次测评，与日常活动监测分别呈现。';
 const u=new URL(location.href);u.searchParams.delete('case');u.searchParams.delete('report');history.replaceState(null,'',u);void refreshMonitoring();
}
if(typeof window!=='undefined'){document.addEventListener('visibilitychange',()=>{window.clearTimeout(timer);if(!document.hidden)void refreshMonitoring();});window.addEventListener('focus',()=>{if(monitoringRequested())void refreshMonitoring();});window.addEventListener('pagehide',()=>{stopped=true;window.clearTimeout(timer);for(const p of pending.values()){window.clearTimeout(p.timeout);p.reject(Error('监测页面已关闭'));}pending.clear();},{once:true});}
