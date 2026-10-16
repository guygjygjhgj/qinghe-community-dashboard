import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.location={href:'https://guygjygjhgj.github.io/qinghe-community-dashboard/'};
globalThis.window={addEventListener(){}};window.parent=window;
const nodes=new Map();
globalThis.document={hidden:true,addEventListener(){},querySelector:selector=>nodes.get(selector)||null};
globalThis.history={replaceState(_state,_title,url){location.href=String(url);}};
const {monitoringRequested,monitorRequest,startMonitoring,MONITOR_OWNER_ORIGIN}=await import('../community-monitor-live.js');
const {readConnectedResidents}=await import('../community-elder-data.js');

test('normal and old report URLs always request authenticated shared records and ignore browser fixtures',()=>{
 for(const query of ['','?case=mci&report=old','?live=0']){
  location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/'+query;
  assert.equal(monitoringRequested(),true);
  const result=readConnectedResidents({getItem(){throw Error('Local records must not replace shared records');}});
  assert.equal(result.live,true);assert.deepEqual(result.residents,[]);
 }
});
test('a direct public page cannot retrieve resident records and links to the protected workbench',async()=>{
 location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/?report=old&case=mci';window.parent=window;
 const entry={},banner={};nodes.set('.header-context a',entry);nodes.set('.online-banner span',banner);
 startMonitoring();assert.equal(entry.href,MONITOR_OWNER_ORIGIN+'/monitor');assert.match(banner.textContent,/登录社区工作台/);
 assert.equal(new URL(location.href).searchParams.has('report'),false);assert.equal(new URL(location.href).searchParams.has('case'),false);
 await assert.rejects(monitorRequest('/api/community/monitor/state'),/管理员专属/);
});
test('reference material is available only through an explicit separate mode',()=>{
 location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/?reference=1';assert.equal(monitoringRequested(),false);
});

test('course records use only a separate read-only API and never an owner bridge',async()=>{
 location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/?cohort=course';
 const calls=[];globalThis.fetch=async url=>{calls.push(String(url));return {ok:true,json:async()=>({datasetType:'synthetic',residents:[]})};};
 const data=await monitorRequest('/api/community/monitor/state');assert.equal(data.datasetType,'synthetic');
 assert.match(calls[0],/\/api\/community\/v1\/course\?route=/);assert.equal(new URL(calls[0]).searchParams.get('route'),'/api/community/monitor/state');
 await assert.rejects(monitorRequest('/api/community/notes',{note:'x'}),/只读/);assert.equal(calls.length,1);
 globalThis.fetch=async()=>({ok:false,json:async()=>({error:{message:'资料暂不可用'}})});
 await assert.rejects(monitorRequest('/api/community/monitor/state'),/资料暂不可用/);
});
