import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.location={href:'https://guygjygjhgj.github.io/qinghe-community-dashboard/'};
globalThis.window={addEventListener(){}};window.parent=window;
const nodes=new Map();
globalThis.document={hidden:true,addEventListener(){},querySelector:selector=>nodes.get(selector)||null};
globalThis.history={replaceState(_state,_title,url){location.href=String(url);}};
const {monitoringRequested,monitorRequest,startMonitoring,MONITOR_OWNER_ORIGIN}=await import('../community-monitor-live.js');
const {readConnectedResidents}=await import('../community-elder-data.js');

test('direct and old report URLs open the original dashboard without a login bridge',()=>{
 for(const query of ['','?case=mci&report=old','?live=0']){
  location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/'+query;
  assert.equal(monitoringRequested(),false);
  const result=readConnectedResidents({getItem(){return null;}});
  assert.notEqual(result.live,true);assert.deepEqual(result.residents,[]);
 }
});
test('a direct public page preserves the report and never redirects to login',async()=>{
 location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/?report=old&case=mci';window.parent=window;
 const entry={},banner={};nodes.set('.header-context a',entry);nodes.set('.online-banner span',banner);
 startMonitoring();assert.equal(entry.href,undefined);assert.equal(banner.textContent,undefined);
 assert.equal(new URL(location.href).searchParams.get('report'),'old');assert.equal(new URL(location.href).searchParams.get('case'),'mci');
 await assert.rejects(monitorRequest('/api/community/monitor/state'),/管理员专属/);
});
test('explicit reference links remain compatible',()=>{
 location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/?reference=1';assert.equal(monitoringRequested(),false);
});

test('embedded monitoring still uses protected shared records and ignores local fixtures',()=>{
 location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/';window.parent={};
 assert.equal(monitoringRequested(),true);
 const result=readConnectedResidents({getItem(){throw Error('Local records must not replace shared records');}});
 assert.equal(result.live,true);assert.deepEqual(result.residents,[]);
 window.parent=window;
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

test('current course-account activity requires the private owner bridge',async()=>{
 location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/?cohort=accounts';window.parent=window;
 let fetched=false;globalThis.fetch=async()=>{fetched=true;throw Error('must not use public course history endpoint');};
 await assert.rejects(monitorRequest('/api/community/monitor/state'),/管理员专属/);assert.equal(fetched,false);
});
