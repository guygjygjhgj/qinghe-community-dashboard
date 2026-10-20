import test from 'node:test';
import assert from 'node:assert/strict';
import {demoSpatial,validateSession,mergeSessions,spatialTrend,spatialCsv} from '../community-spatial-data.js';
test('raw-score changes are computed from reviewed records, separately per test',()=>{
 const {sessions}=demoSpatial();assert.equal(spatialTrend(sessions,'figure').delta,4);assert.equal(spatialTrend(sessions,'orientation').delta,4);assert.equal(spatialTrend(sessions,'figure').points.length,3);
});
test('zero is valid, missing stays null, pending and affected records do not become zeros',()=>{
 const [s]=demoSpatial().sessions;
 assert.equal(validateSession({...s,figure:0},true).figure,0);
 assert.equal(validateSession({...s,figure:''},true).figure,null);
 assert.equal(spatialTrend([{...s,status:'pending'}],'figure').points[0].value,null);
 for(const change of [{vision:'limited'},{motor:'unknown'},{assistance:'extra'}])assert.equal(spatialTrend([{...s,...change}],'figure').points[0].value,null);
});
test('different resident windows, forms, languages and scoring manuals do not share baselines',()=>{
 const sessions=demoSpatial().sessions.filter(s=>s.status!=='scheduled');
 for(const change of [{residentId:'other-resident'},{version:'Other form'},{language:'Other language'},{manual:'Other norms'}])assert.equal(spatialTrend([sessions[0],{...sessions[2],...change}],'figure').delta,null);
});
test('out-of-range scores, invalid dates and missing consent or qualification are blocked',()=>{
 const [s]=demoSpatial().sessions;
 for(const change of [{figure:21},{orientation:-1},{figure:2.5},{figure:'abc'},{consent:false},{materials:false},{training:false},{qualification:''},{at:'2026-02-31T09:00:00+08:00'}])assert.throws(()=>validateSession({...s,...change},true));
});
test('duplicate imports are idempotent and conflicts fail atomically',()=>{
 const {sessions}=demoSpatial();const original=JSON.stringify(sessions),result=mergeSessions(sessions,sessions,true);assert.equal(result.added,0);assert.equal(result.sessions.length,4);
 assert.throws(()=>mergeSessions(sessions,[{...sessions[0],figure:19}],true),/冲突/);assert.equal(JSON.stringify(sessions),original);
 assert.throws(()=>mergeSessions([],sessions,false),/分别导入/);
});
test('CSV retains provenance, exact raw scores and mitigates spreadsheet formula injection',()=>{
 const [s]=demoSpatial().sessions,csv=spatialCsv([{...s,residentName:'=1+1'}]);assert.match(csv,/synthetic/);assert.match(csv,/"12","11"/);assert.ok(csv.includes("'=1+1"));
});
