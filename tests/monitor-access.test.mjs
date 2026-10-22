import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.location={href:'https://guygjygjhgj.github.io/qinghe-community-dashboard/'};
let messages=0;
globalThis.window={parent:null,postMessage(){messages++;}};window.parent=window;
globalThis.history={replaceState(_state,_title,url){location.href=String(url);}};
const {monitoringRequested,courseRequested,courseAccountsRequested,monitorRequest,startMonitoring,refreshMonitoring,cloudResidents}=await import('../community-monitor-live.js');
test('direct, old cohort and embedded links always use the public data path',()=>{
 for(const embedded of [false,true])for(const query of ['','?reference=1','?cohort=course','?cohort=accounts','?live=1','?case=mci&report=old']){
  window.parent=embedded?{postMessage(){messages++;}}:window;
  location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/'+query+'#cognition';
  assert.equal(monitoringRequested(),false);assert.equal(courseRequested(),false);assert.equal(courseAccountsRequested(),false);assert.equal(cloudResidents(),null);
 }
});
test('old account parameters are removed while preserving the report and screen',()=>{
 location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/?cohort=accounts&live=1&report=old&case=mci#reports';
 startMonitoring();const url=new URL(location.href);
 assert.equal(url.searchParams.has('cohort'),false);assert.equal(url.searchParams.has('live'),false);
 assert.equal(url.searchParams.get('report'),'old');assert.equal(url.searchParams.get('case'),'mci');assert.equal(url.hash,'#reports');
});
test('the retired connection neither fetches nor sends a parent message',async()=>{
 let fetched=0;globalThis.fetch=async()=>{fetched++;throw Error('No account request is expected');};
 await refreshMonitoring();await assert.rejects(monitorRequest('/api/community/monitor/state'),/不连接账号服务/);
 assert.equal(fetched,0);assert.equal(messages,0);
});
test('old cohort links return the original bundled overview and report',async()=>{
 const {readFile}=await import('node:fs/promises');const calls=[];
 globalThis.document={addEventListener(){}};
 globalThis.fetch=async value=>{const u=new URL(value);calls.push(u);const file=new URL('..'+u.pathname.slice('/qinghe-community-dashboard'.length),import.meta.url);const content=await readFile(file,'utf8');return {ok:true,json:async()=>JSON.parse(content)};};
 location.href='https://guygjygjhgj.github.io/qinghe-community-dashboard/?cohort=accounts#dashboard';
 const source=(await readFile(new URL('../community-online.js',import.meta.url),'utf8'))
  .replace("from './community-monitor-live.js'",'from '+JSON.stringify(new URL('../community-monitor-live.js',import.meta.url).href))
  .replace("new URL('./',import.meta.url)","new URL('https://guygjygjhgj.github.io/qinghe-community-dashboard/')");
 const {onlineApi}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const overview=await onlineApi('/api/community/overview');assert.ok(overview.residents.length>0);assert.ok(overview.counts.records>0);
 const reports=await onlineApi('/api/community/reports');assert.ok(reports.reports.length>0);
 const id=new URL(location.href).searchParams.get('report');assert.ok(id);
 const report=await onlineApi('/api/community/reports/'+id);assert.equal(report.id,id);
 assert.ok(calls.every(u=>u.pathname.includes('/data/')));
});
