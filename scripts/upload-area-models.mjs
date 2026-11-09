import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync('tmp/area-uploads.json','utf8'));
const results=[];
for(const row of rows){
 try{const r=await fetch(row.proxyUploadUrl,{method:'PUT',headers:{'Content-Type':'image/png'},body:fs.readFileSync(`public/models/areas/${row.id}.png`),signal:AbortSignal.timeout(90000)});results.push({id:row.id,path:row.path,status:r.status});console.log(row.id,r.status);}
 catch(e){results.push({id:row.id,path:row.path,error:e.message});console.log(row.id,e.message);}
 fs.writeFileSync('tmp/area-upload-results.json',JSON.stringify(results,null,2));
}
