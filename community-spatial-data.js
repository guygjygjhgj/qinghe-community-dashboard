export const SPATIAL_SCHEMA='qinghe-offline-spatial/1';
export const SPATIAL_KEY='qinghe-offline-spatial-v1';
export const TEST_NAME='RBANS 视空间 / 结构';
export const DEMO_RESIDENT='demo-qinghe-weekly-12';
export const METHODS=[{key:'figure',label:'图形临摹',max:20,description:'记录图形的准确性与空间组织'},{key:'orientation',label:'线条方向',max:20,description:'记录方向辨别与空间关系判断'}];
const text=v=>String(v??'').trim().slice(0,1000);
const number=v=>v===null||v===undefined||v===''?null:Number(v);
export function validateSession(input,synthetic){
 const s={id:text(input.id),residentId:text(input.residentId),residentName:text(input.residentName),datasetType:synthetic?'synthetic':'local_unverified',status:text(input.status),at:text(input.at),place:text(input.place),assistantId:text(input.assistantId),examiner:text(input.examiner),qualification:text(input.qualification),version:text(input.version),language:text(input.language),manual:text(input.manual),paperRef:text(input.paperRef),assistance:text(input.assistance),vision:text(input.vision),motor:text(input.motor),notes:text(input.notes),reviewer:text(input.reviewer),reviewedAt:text(input.reviewedAt),reviewNote:text(input.reviewNote),consent:input.consent===true,materials:input.materials===true,training:input.training===true,figure:number(input.figure),orientation:number(input.orientation),createdAt:text(input.createdAt),updatedAt:text(input.updatedAt)};
 if(!s.id||!s.residentId||!s.residentName)throw Error('请关联居民并保留测评编号');
 if(!s.at.endsWith('+08:00')||!Number.isFinite(Date.parse(s.at))||new Date(Date.parse(s.at)+28800000).toISOString().slice(0,19)+'+08:00'!==s.at)throw Error('请提供有效的北京时间');
 if(!['scheduled','pending','reviewed'].includes(s.status))throw Error('测评状态无效');
 if(!s.place||!s.assistantId||!s.version||!s.language)throw Error('请填写地点、协助者、测验版本与语言');
 for(const m of METHODS)if(s[m.key]!==null&&(!Number.isInteger(s[m.key])||s[m.key]<0||s[m.key]>m.max))throw Error(m.label+'原始分须为0—20的整数；未完成请留空');
 if(s.status!=='scheduled'){
  if(!s.consent||!s.materials||!s.training)throw Error('完成记录需确认知情同意、授权材料及施测人员培训');
  if(!s.examiner||!s.qualification||!s.manual||!s.paperRef)throw Error('请填写施测人、资质记录、评分手册版本和答卷编号');
  if(!['none','manual_repeat','extra','unknown'].includes(s.assistance)||!['adequate','limited','unknown'].includes(s.vision)||!['adequate','limited','unknown'].includes(s.motor))throw Error('请记录协助、视力及手部操作条件');
  if(s.figure===null&&s.orientation===null&&!s.notes)throw Error('未获得分数时，请记录未完成原因');
 }
 if(s.status==='reviewed'&&(!s.reviewer||!s.reviewedAt||!s.reviewNote))throw Error('核对记录需包含核对人、时间和依据');
 return s;
}
export function eligible(s,key){return s.status==='reviewed'&&Number.isFinite(s[key])&&s.vision==='adequate'&&s.motor==='adequate'&&s.assistance==='none';}
export function comparisonKey(s){return [s.residentId,s.version,s.language,s.manual,s.assistance,s.vision,s.motor].join('|');}
export function spatialTrend(sessions,key){
 const points=sessions.filter(s=>s.status!=='scheduled').sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).map(s=>({session:s,at:s.at,value:eligible(s,key)?s[key]:null}));
 const latest=points.at(-1);if(!latest||latest.value===null)return {points,delta:null,text:'当前材料尚不可比较'};
 const comparable=points.filter(p=>p.value!==null&&comparisonKey(p.session)===comparisonKey(latest.session));
 if(comparable.length<2)return {points,delta:null,text:'已有一次可用成绩，等待同条件记录'};
 const delta=latest.value-comparable[0].value;
 return {points,delta,text:delta>0?'本测验成绩上升':delta<0?'本测验成绩下降':'首末成绩相同',baseline:comparable[0].session.id};
}
export function mergeSessions(existing,incoming,synthetic){
 if(!Array.isArray(incoming)||incoming.length>1000)throw Error('资料包最多包含1000条测评');
 const map=new Map(existing.map(s=>[s.id,s]));let added=0;
 for(const raw of incoming){
  if(raw.datasetType!==(synthetic?'synthetic':'local_unverified'))throw Error('课程资料与实际录入资料须分别导入');
  const s=validateSession(raw,synthetic),old=map.get(s.id);
  if(old&&JSON.stringify(old)!==JSON.stringify(s))throw Error('同编号测评内容冲突：'+s.id+'；未写入任何记录');
  if(!old){map.set(s.id,s);added++;}
 }
 return {sessions:[...map.values()],added};
}
export function demoSpatial(){
 const assistants=[{id:'young-demo-1',name:'陈同学',team:'青禾青年志愿队',training:'已完成协助培训',supervisor:'林老师（课程角色）'},{id:'young-demo-2',name:'周同学',team:'社区高校合作组',training:'培训中',supervisor:'林老师（课程角色）'}];
 const sessions=[[ '2026-07-22',12,11,'A'],['2026-08-26',14,13,'A'],['2026-10-07',16,15,'A']].map(([day,figure,orientation,form],i)=>validateSession({id:'spatial-demo-'+i,residentId:DEMO_RESIDENT,residentName:'李阿姨（课程案例）',datasetType:'synthetic',status:'reviewed',at:day+'T09:00:00+08:00',place:'青禾社区 · 园艺活动室',assistantId:'young-demo-1',examiner:'林老师（课程角色）',qualification:'模拟资质档案 DEMO-P01',version:'RBANS 中文适用版本 · '+form+'表',language:'普通话',manual:'课程模拟记录；实际按授权手册计分',paperRef:'DEMO-SP-'+(i+1),assistance:'none',vision:'adequate',motor:'adequate',notes:'合成分数，仅演示录入、核对与趋势；不是实际施测结果。重复使用同表存在练习效应。',consent:true,materials:true,training:true,figure,orientation,reviewer:'王老师（课程角色）',reviewedAt:day+'T10:00:00+08:00',reviewNote:'课程模拟核对：两项分数与合成答卷登记一致。',createdAt:day+'T09:00:00+08:00',updatedAt:day+'T10:00:00+08:00'},true));
 sessions.push(validateSession({id:'spatial-demo-next',residentId:DEMO_RESIDENT,residentName:'李阿姨（课程案例）',status:'scheduled',at:'2026-10-28T09:00:00+08:00',place:'青禾社区 · 园艺活动室',assistantId:'young-demo-1',version:'RBANS 中文适用版本 · B表',language:'普通话',createdAt:'2026-10-20T10:00:00+08:00',updatedAt:'2026-10-20T10:00:00+08:00'},true));
 return {schema:SPATIAL_SCHEMA,assistants,sessions};
}
export function spatialCsv(sessions){
 const cols=['datasetType','id','residentId','residentName','at','status','figure','orientation','version','language','manual','assistance','vision','motor','assistantId','examiner','qualification','paperRef','reviewer','reviewedAt','reviewNote'];
 const cell=v=>'"'+String(v??'').replace(/^[=+@\-]/,"'$&").replaceAll('"','""')+'"';
 return '\uFEFF'+[cols,...sessions.map(s=>cols.map(k=>s[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
}
