// Shared, dependency-free CSV reader. JSON-valued cells keep nested metadata intact.
export function parseCsv(source) {
  const rows=[]; let row=[],value='',quoted=false,closed=false;
  source=source.replace(/^\uFEFF/,'');
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(quoted){if(c==='"'&&source[i+1]==='"'){value+='"';i++;}else if(c==='"'){quoted=false;closed=true;}else value+=c;}
    else if(c==='"'){if(value||closed)throw Error('CSV引号位置不正确');quoted=true;}
    else if(c===','||c==='\n'||c==='\r'){
      row.push(value);value='';closed=false;
      if(c!==','){if(c==='\r'&&source[i+1]==='\n')i++;if(row.some(x=>x!==''))rows.push(row);row=[];}
    }else{if(closed)throw Error('CSV闭合引号后需要逗号或换行');value+=c;}
  }
  if(quoted)throw Error('CSV引号未闭合');
  row.push(value);if(row.some(x=>x!==''))rows.push(row);
  const headers=(rows.shift()||[]).map(x=>x.trim());
  if(!headers.length||headers.some(x=>!x)||new Set(headers).size!==headers.length)throw Error('CSV列名不能为空或重复');
  return {headers,rows:rows.map((r,i)=>{if(r.length!==headers.length)throw Error(`CSV第${i+2}行列数不一致`);return Object.fromEntries(headers.map((h,j)=>[h,r[j]]));})};
}
export function toCsv(rows,columns) {
  const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
  return '\uFEFF'+[columns,...rows.map(r=>columns.map(k=>typeof r[k]==='object'&&r[k]!==null?JSON.stringify(r[k]):r[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
}
export const csvFields={residents:['id','name'],records:['id','residentId','actorId','text','at','businessId','replyToId','factId','kind','scene','observationContext','conditions','inputMode','appVersion','pageVersion','authorship'],facts:['id','residentId','businessId','version','effectiveAt','sourceId','confirmed','kind','slots'],events:['id','residentId','actorId','at','businessId','recordId','factId','taskId','type','outcome','feedback','conditions','scene','inputMode','appVersion','pageVersion']};
export const fieldAliases={id:['编号'],name:['姓名','居民姓名'],residentId:['resident_id','居民ID','居民编号'],actorId:['actor_id','作者ID','用户ID'],text:['原文','内容','body'],at:['时间','timestamp','createdAt'],businessId:['business_id','业务ID'],replyToId:['reply_to_id','回复ID'],sourceId:['source_id','来源ID'],effectiveAt:['effective_at','生效时间'],version:['版本'],kind:['类别'],type:['事件类型'],slots:['核对项'],conditions:['条件'],confirmed:['已确认']};
