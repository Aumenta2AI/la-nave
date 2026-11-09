import fs from 'node:fs';
fs.mkdirSync('public/brands',{recursive:true});
for(const name of ['openai','claude','grok','kimi','deepseek','perplexity','gemini']){
 const url=`https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-svg/icons/${name}.svg`;
 const r=await fetch(url);if(!r.ok)throw Error(`${name}: ${r.status}`);const svg=await r.text();if(!svg.includes('<svg')||/<script|onload=|<foreignObject/i.test(svg))throw Error('SVG inválido');fs.writeFileSync(`public/brands/${name}.svg`,svg.replaceAll('currentColor','#ffffff'));console.log(name,r.status);
}
const license=await fetch('https://raw.githubusercontent.com/lobehub/lobe-icons/master/LICENSE');if(license.ok)fs.writeFileSync('public/brands/LICENSE-lobe-icons.txt',await license.text());
