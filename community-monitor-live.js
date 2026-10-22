// The public site always uses bundled dashboard data, including old and embedded links.
export const courseAccountsRequested=()=>false;
export const courseRequested=()=>false;
export const monitoringRequested=()=>false;
export const cloudResidents=()=>null;
export function monitorRequest(){
 return Promise.reject(Error('当前页面直接展示现有看板资料，不连接账号服务。'));
}
export async function refreshMonitoring(){}
export function startMonitoring(){
 const url=new URL(location.href);
 if(url.searchParams.has('cohort')||url.searchParams.has('live')){
  url.searchParams.delete('cohort');url.searchParams.delete('live');
  history.replaceState(null,'',url);
 }
}
