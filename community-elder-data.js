import {ELDER_STORAGE_KEY,assessmentResidents,readAssessmentPackage,exportAssessmentPackage,normalizeAssessment} from './community-elder-schema.js';
import {monitoringRequested,cloudResidents} from './community-monitor-live.js';
export const TRANSFER_KEY='qinghe-community-assessments-v1';
export function readConnectedResidents(storage){
 if(typeof location!=='undefined'&&monitoringRequested())return cloudResidents()||{residents:[],assessmentCount:0,issues:['正在连接已授权居民资料，请稍候'],live:true};
 const issues=[];let state={},saved=[];
 try{state=JSON.parse(storage.getItem(ELDER_STORAGE_KEY)||'{}');}catch{issues.push('老人端记录无法读取；请在原浏览器重新导出资料。');}
 try{const value=JSON.parse(storage.getItem(TRANSFER_KEY)||'[]');if(!Array.isArray(value))throw Error();saved=value;}catch{issues.push('本机导入记录无法读取，请重新导入原资料包。');}
 const connected=assessmentResidents(state);issues.push(...connected.issues);
 const map=new Map(connected.residents.map(r=>[r.sourceUserId,{...r,sources:['老人端 · 当前浏览器']}]));
 for(const raw of saved)try{
  const incoming=readAssessmentPackage(raw),existing=map.get(incoming.sourceUserId);
  if(!existing){map.set(incoming.sourceUserId,{...incoming,sources:['文件导入 · 当前浏览器']});continue;}
  existing.sources.push('文件导入 · 当前浏览器');
  for(const a of incoming.assessments){const old=existing.assessments.find(x=>x.assessmentId===a.assessmentId);if(old&&JSON.stringify(old)!==JSON.stringify(a)){issues.push(`${existing.name}：同编号测评内容冲突，保留老人端原记录`);continue;}if(!old)existing.assessments.push(a);}
 }catch(err){issues.push(err.message);}
 const residents=[...map.values()].map(r=>({...r,sources:[...new Set(r.sources)],assessments:r.assessments.sort((a,b)=>a.completedAt.localeCompare(b.completedAt))}));
 return {residents,issues,assessmentCount:residents.reduce((n,r)=>n+r.assessments.length,0)};
}
export function importAssessmentPackage(storage,value){
 if(value?.datasetType==='synthetic'||value?.resident?.datasetType==='synthetic'||value?.resident?.sourceUserId?.startsWith('course-demo-'))throw Error('这是课程模拟资料，请通过“案例选择”查看，不会写入真实居民档案');
 const incoming=readAssessmentPackage(value),all=readConnectedResidents(storage),resident=all.residents.find(r=>r.sourceUserId===incoming.sourceUserId);
 let added=0,duplicates=0;
 for(const a of incoming.assessments){const old=resident?.assessments.find(x=>x.assessmentId===a.assessmentId);if(old){if(JSON.stringify(old)!==JSON.stringify(a))throw Error('同一居民的测评编号与已有内容冲突，未导入任何记录');duplicates++;}else added++;}
 // Resolve duplicates inside the file before writing anything.
 const unique=new Map();for(const a of incoming.assessments){const old=unique.get(a.assessmentId);if(old&&JSON.stringify(old)!==JSON.stringify(a))throw Error('资料包内的测评编号冲突');unique.set(a.assessmentId,a);}
 const saved=JSON.parse(storage.getItem(TRANSFER_KEY)||'[]');if(!Array.isArray(saved))throw Error('本机资料索引损坏，请先备份现有记录');
 const index=saved.findIndex(p=>p.resident?.sourceUserId===incoming.sourceUserId);
 const old=index<0?[]:readAssessmentPackage(saved[index]).assessments;
 const combined=new Map(old.map(a=>[a.assessmentId,a]));for(const a of unique.values())combined.set(a.assessmentId,a);
 const next=exportAssessmentPackage(incoming,[...combined.values()]);if(index<0)saved.push(next);else saved[index]=next;
 try{storage.setItem(TRANSFER_KEY,JSON.stringify(saved));}catch{throw Error('本机存储空间不足，文件未导入；原记录保持不变');}
 return {residentId:incoming.id,added:new Set(incoming.assessments.filter(a=>!resident?.assessments.some(x=>x.assessmentId===a.assessmentId)).map(a=>a.assessmentId)).size,duplicates};
}
// Legacy standalone exports have no authenticated account. Require an explicit ID and name.
export async function prepareStandalone(value,sourceUserId,name){
 if(!sourceUserId.trim()||!name.trim())throw Error('独立或旧版记录没有居民身份，请填写原账号居民编号与姓名后导入');
 const raw={...value,completedAt:value.completedAt||value.exportedAt};
 if(!raw.assessmentId){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));raw.assessmentId='legacy-'+[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
 return {schema:'qinghe-cognitive-transfer/v1',resident:{sourceUserId:sourceUserId.trim(),name:name.trim()},assessments:[normalizeAssessment(raw)]};
}
export function taskHistory(resident,index){return resident.assessments.map(a=>({assessment:a,index}));}
