// Optional REAL model test. Requires running Pulpo and authenticated Codex CLI.
const base='http://localhost:3210/api';
const api=async(url,body)=>{const r=await fetch(base+url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error(await r.text());return r.json();};
if((await api('/state')).testMode)throw Error('Esta prueba requiere el servidor real, sin PULPO_TEST_MODE');
const key='pulpo-'+Date.now();
async function send(text){const job=await api('/agents/administrativo/messages',{text});for(let n=0;n<300;n++){const s=await api('/state');const current=s.jobs.find(j=>j.id===job.id);if(current.status==='error')throw Error(current.error);if(current.status==='done')return s;await new Promise(r=>setTimeout(r,1000));}throw Error('Timeout');}
const first=await send(`Prueba de continuidad. Recuerda la clave ${key}. Confirma sin acciones.`);
const id=first.agents.find(a=>a.id==='administrativo').sessionId;
const second=await send('¿Cuál es la clave que acabo de darte? Responde sin acciones.');
if(!id||id!==second.agents.find(a=>a.id==='administrativo').sessionId)throw Error('Cambió la sesión');
const reply=second.messages.filter(m=>m.agentId==='administrativo'&&m.role==='assistant').at(-1)?.text;
if(!reply?.includes(key))throw Error('No recordó la clave: '+reply);
console.log('Codex real: sesión continuada y clave recordada. Modelo gpt-6-luna.');
