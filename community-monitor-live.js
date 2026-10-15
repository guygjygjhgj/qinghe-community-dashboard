export const MONITOR_OWNER_ORIGIN='https://qinghe-registration-review.hebaixuan01111123.chatgpt.site';
export const monitoringRequested=()=>new URL(location.href).searchParams.get('live')==='1';
const pending=new Map();let revision=-1,timer=null,refreshing=false,stopped=false,cloud=null,lastError='',pendingPaint=false;
export const cloudResidents=()=>monitoringRequested()?cloud:null;
export function monitorRequest(route,body,options={}){
 if(!monitoringRequested()||window.parent===window)return Promise.reject(Error('请从社区管理员专属监测入口登录后查看真实资料'));
 const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timeout=window.setTimeout(()=>{pending.delete(id);reject(Error('监测连接超时，原记录保持不变，请重试'));},25000);pending.set(id,{resolve,reject,timeout});window.parent.postMessage({source:'qinghe-monitor-child',version:1,id,route,body,cursor:options.cursor,requestId:options.requestId||crypto.randomUUID()},MONITOR_OWNER_ORIGIN);});
}
if(typeof window!=='undefined')window.addEventListener('message',event=>{const d=event.data;if(event.origin!==MONITOR_OWNER_ORIGIN||event.source!==window.parent||d?.source!=='qinghe-monitor-host'||d.version!==1)return;const p=pending.get(d.id);if(!p)return;pending.delete(d.id);window.clearTimeout(p.timeout);if(d.ok)p.resolve(d.result);else p.reject(Error(d.error||'监测请求未完成'));});
export async function refreshMonitoring(){
 if(!monitoringRequested()||refreshing||stopped||document.hidden)return;refreshing=true;
 try{const next=await monitorRequest('/api/community/monitor/state',undefined,{cursor:revision});if(!next.unchanged){revision=next.revision;cloud={residents:next.residents,assessmentCount:next.residents.reduce((n,r)=>n+r.assessments.length,0),issues:[],live:true,revision};pendingPaint=true;}if(pendingPaint&&!document.activeElement?.matches('input,textarea,select')&&!document.querySelector('dialog[open]')){pendingPaint=false;document.dispatchEvent(new window.CustomEvent('qinghe-monitor-updated',{detail:{revision}}));}if(lastError&&document.querySelector('#error')?.textContent===lastError)document.querySelector('#error').textContent='';lastError='';const banner=document.querySelector('.online-banner span');if(banner)banner.textContent='实时连接 · 已登录账号共享数据 · 每2秒检查更新';}
 catch(error){if(error.message!==lastError){lastError=error.message;const el=document.querySelector('#error');if(el)el.textContent=error.message;}}
 finally{refreshing=false;window.clearTimeout(timer);if(!stopped&&!document.hidden)timer=window.setTimeout(refreshMonitoring,2000);}
}
export function startMonitoring(){if(!monitoringRequested())return;const select=document.querySelector('#dashboard-filters select[name=dataset]');if(select)select.value='actual';const label=document.querySelector('.online-banner strong');if(label)label.textContent='实时社区监测';const u=new URL(location.href);u.searchParams.delete('case');u.searchParams.delete('report');history.replaceState(null,'',u);void refreshMonitoring();}
if(typeof window!=='undefined'){document.addEventListener('visibilitychange',()=>{window.clearTimeout(timer);if(!document.hidden)void refreshMonitoring();});window.addEventListener('focus',()=>{if(monitoringRequested())void refreshMonitoring();});window.addEventListener('pagehide',()=>{stopped=true;window.clearTimeout(timer);for(const p of pending.values()){window.clearTimeout(p.timeout);p.reject(Error('监测页面已关闭'));}pending.clear();},{once:true});}
