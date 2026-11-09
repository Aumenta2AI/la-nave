import {all} from './store.ts';
const day=(value:number)=>new Date(value).toLocaleDateString('en-CA',{timeZone:'America/Bogota'});
export function analytics(range:string,now=Date.now()){
 const days=range==='7'?7:range==='30'?30:0;
 const sources={messages:all('messages'),jobs:all('jobs'),users:all('users'),requests:all('requests')};
 const dates=Object.values(sources).flat().map(x=>Date.parse(x.createdAt||'')).filter(d=>Number.isFinite(d)&&d<=now);
 const today=day(now),start=days?day(now-(days-1)*86400000):day(dates.reduce((a,b)=>Math.min(a,b),now));
 const selected=(rows:any[])=>rows.filter(r=>{const date=Date.parse(r.createdAt||'');return Number.isFinite(date)&&date<=now&&day(date)>=start&&day(date)<=today;});
 const messages=selected(sources.messages),jobs=selected(sources.jobs),users=selected(sources.users),requests=selected(sources.requests);
 const buckets=new Map<string,{date:string;messages:number;jobs:number;users:number}>();
 // Bound all-history charts to monthly buckets for histories longer than 120 days.
 const monthly=(Date.parse(today)-Date.parse(start))/86400000>120;
 // Keep empty calendar intervals so gaps are not presented as continuous activity.
 const cursor=new Date(start+'T00:00:00Z');if(monthly)cursor.setUTCDate(1);
 while(cursor.toISOString().slice(0,10)<=today){const key=cursor.toISOString().slice(0,monthly?7:10);buckets.set(key,{date:key,messages:0,jobs:0,users:0});if(monthly)cursor.setUTCMonth(cursor.getUTCMonth()+1);else cursor.setUTCDate(cursor.getUTCDate()+1);}
 for(const [name,rows] of Object.entries({messages,jobs,users}))for(const r of rows){const key=day(Date.parse(r.createdAt)).slice(0,monthly?7:10);const b=buckets.get(key)||{date:key,messages:0,jobs:0,users:0};b[name as 'messages'|'jobs'|'users']++;buckets.set(key,b);}
 const distribution=Object.entries(jobs.reduce((a:any,j:any)=>{a[j.status]=(a[j.status]||0)+1;return a;},{})).map(([label,value])=>({label,value}));
 const agents=all('agents');
 const grouped=(field:'agent'|'provider')=>{const counts=new Map<string,number>();for(const j of jobs){const a=agents.find(a=>a.id===j.agentId);const label=field==='agent'?(a?.name||'Agente no disponible'):(a?.provider||'Motor general');counts.set(label,(counts.get(label)||0)+1);}return [...counts].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,12);};
 return {byAgent:grouped('agent'),byProvider:grouped('provider'),range,start,end:today,monthly,totals:{messages:messages.length,jobs:jobs.length,users:users.length,completed:jobs.filter(j=>j.status==='done').length,failed:jobs.filter(j=>j.status==='error').length,pending:requests.filter(r=>r.status==='pending').length},series:[...buckets.values()].sort((a,b)=>a.date.localeCompare(b.date)),distribution,undated:Object.values(sources).flat().filter(r=>!Number.isFinite(Date.parse(r.createdAt||''))).length,scope:'Instalación local · fechas de creación · America/Bogota'};
}

