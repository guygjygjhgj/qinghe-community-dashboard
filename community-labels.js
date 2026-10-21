// Presentation labels only. Original identities, provenance and exports stay intact.
export function residentLabel(value){
 const name=String(value??'');
 const aliases={'案例A（模拟）':'王阿姨','案例A（课程）':'王阿姨','案例B（模拟）':'张阿姨','案例B（课程）':'张阿姨','案例C（模拟）':'陈叔叔','案例C（课程）':'陈叔叔'};
 return aliases[name]||name.replace(/（(?:12周)?(?:模拟|课程)）$/,'');
}
export function taskResultTitle(assessment){
 return assessment?'九项任务表现':'等待测评记录';
}
// Keep provenance in one persistent line instead of repeating it on each card.
export const REFERENCE_DATA_NOTICE='模拟资料 · 展示任务成绩与活动变化';
