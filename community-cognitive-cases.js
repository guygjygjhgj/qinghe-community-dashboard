import {TASKS,normalizeAssessment,exportAssessmentPackage,taskScore} from './community-elder-schema.js';

// Fictional case labels are scenario inputs, never predictions from the answers.
export const COURSE_CASE_OPTIONS=[['normal','模拟正常','认知正常'],['mci','模拟MCI','MCI（轻度认知障碍）'],['dementia','模拟痴呆','痴呆']];
const profiles={
 normal:{name:'案例A（模拟）',description:'用于演示任务表现较完整的病例。',correct:[[2,2,2],[1,0,0],[2,3,3],[2,3,3],[10,11,12],[3,4,4],[4,4,4],[3,3,3],[2,1,0]]},
 mci:{name:'案例B（模拟）',description:'用于演示部分任务存在困难的病例。',correct:[[1,1,2],[2,2,1],[1,1,2],[1,2,2],[7,8,9],[3,3,4],[3,4,4],[2,2,3],[4,3,2]]},
 dementia:{name:'案例C（模拟）',description:'用于演示多项任务需要支持的病例。',correct:[[0,1,1],[5,5,4],[0,1,1],[1,1,1],[4,5,6],[1,1,2],[1,2,2],[1,1,2],[9,8,7]]}
};
const days=['02','09','16'];
const digits=[3,1,7,4,1,8,2,5,1,6,4,1,9,3,2,1,7,6,1,5];
const repetitions=['叶子','杯子','钥匙','叶子','雨伞','鱼','杯子','苹果','钥匙','小鸟','鱼','花'];
function choices(questions,expected,correct,wrong='不记得'){
 return questions.map((question,i)=>({question,answer:i<correct?expected[i]:Array.isArray(wrong)?wrong[i]:wrong,expected:expected[i],correct:i<correct,latencyMs:1100+i*250}));
}
function assessment(key,stage){
 const p=profiles[key],n=i=>p.correct[i][stage],day=days[stage];
 const dateValues=['2026 年','10 月',`${Number(day)} 日`,'星期五'];
 const items=[];
 items[0]=choices(['长椅旁有几盆花？','浇水壶是什么颜色？'],['2 盆','橙黄色'],n(0));
 items[1]=[];for(let expected=1;expected<=9;expected++){
  if(expected<=n(1))items[1].push({clicked:expected===9?1:expected+1,expected,correct:false,atMs:items[1].length*1200+1200});
  items[1].push({clicked:expected,expected,correct:true,atMs:items[1].length*1200+1200});
 }
 items[2]=choices(['长椅下面是什么动物？','花盆是什么颜色？','图片里有没有长椅？'],['小猫','陶土色','有'],n(2));
 items[3]=[1,3,6].map((expected,i)=>({question:`找到${['杯子','雨伞','叶子'][i]}的位置`,answer:i<n(3)?expected:expected===6?5:expected+1,expected,correct:i<n(3),latencyMs:1800+i*400}));
 const seen=new Set();items[4]=repetitions.map((image,i)=>{const repeated=seen.has(image),correct=i<n(4),respond=correct?repeated:!repeated;seen.add(image);return {question:`第 ${i+1} 张图片`,image,answer:respond?'刚才见过':'第一次见',expected:repeated?'刚才见过':'第一次见',correct,repeated,responseRepeated:respond,latencyMs:1000+i*80};});
 items[5]=choices(['3 ＋ 5 ＝ ？','7 ＋ 2 ＝ ？','2 × 4 ＝ ？','3 × 3 ＝ ？'],['8','9','8','9'],n(5),['7','10','6','8']);
 items[6]=choices(['现在是哪一年？','现在是几月？','今天是几号？','今天是星期几？'],dateValues,n(6),['2025 年','9 月',`${Number(day)+1} 日`,'星期四']);
 items[7]=choices(['第1张物品命名','第2张物品命名','第3张物品命名'],['杯子','雨伞','剪刀'],n(7),['钥匙','杯子','雨伞']).map(x=>({...x,assistedReveal:key!=='normal'}));
 items[8]=digits.map((digit,i)=>{const target=digit===1,responded=i<n(8)?!target:target;return {trial:i+1,digit,target,responded,clicks:responded?1:0,reactionMs:responded?480+stage*25+(i%3)*60:null,interrupted:false,outcome:target?(responded?'命中':'漏答'):(responded?'误触':'正确等待')};});
 let elapsed=0,activeMs=0;const start=Date.parse(`2026-10-${day}T01:00:00Z`);
 const tasks=TASKS.map((t,i)=>{const durationMs=i===8?27000:i===1?(9+n(1))*1200:Math.max(9000,items[i].reduce((s,x)=>s+(x.latencyMs||1100),0)+(i===0?15000:i===3?8000:0));
  const startedAt=new Date(start+elapsed).toISOString();elapsed+=durationMs;activeMs+=durationMs;
  const completedAt=new Date(start+elapsed).toISOString();elapsed+=5000;
  return {name:t.name,record:{completed:true,status:'completed',startedAt,completedAt,durationMs,items:items[i],notes:['课程模拟数据，不对应真实老人。','病例分类由预设场景给定，任务分数不用于生成疾病诊断。']}};
 });
 return normalizeAssessment({assessmentId:`course-${key}-202610-${day}`,prototype:'QH-DEMO-1.0',startedAt:new Date(start).toISOString(),completedAt:new Date(start+elapsed).toISOString(),referenceLocalDate:`2026-10-${day}`,tourMode:false,activeMs,pauseCount:0,hiddenCount:0,sound:false,tasks});
}
export function courseCases(){return COURSE_CASE_OPTIONS.map(([key,,demoConclusion])=>({caseKey:key,id:'course-demo:'+key,sourceUserId:'course-demo-'+key,name:profiles[key].name,age:null,education:null,datasetType:'synthetic',demoConclusion,description:profiles[key].description,sources:['课程模拟资料'],assessments:[0,1,2].map(stage=>assessment(key,stage))}));}
export function isCourseCase(resident){return resident?.datasetType==='synthetic'&&COURSE_CASE_OPTIONS.some(([key,,label])=>resident.id==='course-demo:'+key&&resident.demoConclusion===label);}
export function assessmentExport(resident){const value=exportAssessmentPackage(resident);return isCourseCase(resident)?{...value,datasetType:'synthetic',demoConclusion:resident.demoConclusion,conclusionSource:'课程预设病例，不是模型预测或真实诊断',resident:{...value.resident,datasetType:'synthetic',demoConclusion:resident.demoConclusion}}:value;}
export function assessmentCsv(resident){
 const demo=isCourseCase(resident),cell=v=>'"'+String(v??'').replaceAll('"','""').replace(/^[\s]*[=+@-]/,"'$&")+'"';
 const rows=[['资料说明','课程模拟结论','居民编号','姓名','测评编号','测评版本','开始','完成','任务','正确数','有效数','正确率','排除','活动毫秒','状态']];
 for(const a of resident.assessments)TASKS.forEach((t,i)=>{const s=taskScore(a,i);rows.push([demo?'课程模拟': '居民导出资料',demo?resident.demoConclusion:'',resident.sourceUserId,resident.name,a.assessmentId,a.prototype,a.startedAt,a.completedAt,t.name,s.numerator,s.denominator,s.score,s.excluded,a.tasks[i].record.durationMs,a.tasks[i].record.status]);});
 return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
