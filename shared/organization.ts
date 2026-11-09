// Shared by the deck and the idempotent data migration.
export const departments = [
  {id:'administrativo',name:'Administrativo',model:'administrativo',topic:'Organización y recursos'},
  {id:'contabilidad',name:'Contabilidad',model:'contabilidad',topic:'Facturación, impuestos y flujo de caja'},
  {id:'legal',name:'Legal',model:'legal',topic:'Contratos y propiedad intelectual'},
  {id:'ventas',name:'Ventas',model:'soporte',topic:'Prospección, negociación y cierre'},
  {id:'soporte',name:'Soporte Técnico de Plataforma',model:'soporte',topic:'Estabilidad y resolución de fallas'},
  {id:'marketing',name:'Mercadeo y Publicidad',model:'marketing',topic:'Marca, campañas y adquisición'},
  {id:'investigacion',name:'I+D e Inteligencia de Mercado',model:'contabilidad',topic:'Innovación, tendencias y benchmarking'},
  {id:'rrhh',name:'Recursos Humanos',model:'diseno',topic:'Talento, cultura y bienestar'},
  {id:'licitaciones',name:'Licitaciones Públicas',model:'legal',topic:'Oportunidades SECOP, pliegos y contratación pública con Croma'},
  {id:'calidad',name:'ISO y Calidad',model:'administrativo',topic:'Gestión documental, auditorías y mejora continua'},
  {id:'fabrica',name:'Fábrica de Agentes IA y Automatizaciones',model:'diseno',topic:'Arquitectura, prompts, conocimiento, evaluación e integración de agentes'},
  {id:'ciberseguridad',name:'Ciberseguridad',model:'marketing',topic:'Protección de sistemas, riesgos e incidentes'},
].map((d,i,all)=>{const angle=(i-1)*Math.PI*2/all.length;return {...d,color:'#8750bd',angle,x:36*Math.sin(angle),z:-36*Math.cos(angle)};});

export const providers = [
  {id:'vercel',name:'Vercel',kind:'mcp',color:'#252530',model:'soporte',key:'VERCEL_TOKEN',modelEnv:'',docs:'https://vercel.com/docs/rest-api'},
  {id:'apify',name:'Apify',kind:'mcp',color:'#a84be5',model:'administrativo',key:'APIFY_TOKEN',modelEnv:'',docs:'https://docs.apify.com/mcp'},
  {id:'composio',name:'Composio',kind:'mcp',color:'#25a8cc',model:'soporte',key:'COMPOSIO_API_KEY',modelEnv:'',docs:'https://docs.composio.dev'},
  {id:'openai',name:'ChatGPT · OpenAI',kind:'llm',color:'#16866e',model:'legal',key:'OPENAI_API_KEY',modelEnv:'OPENAI_MODEL',docs:'https://developers.openai.com/api/docs'},
  {id:'claude',name:'Claude',kind:'llm',color:'#cd7654',model:'diseno',key:'ANTHROPIC_API_KEY',modelEnv:'ANTHROPIC_MODEL',docs:'https://platform.claude.com/docs'},
  {id:'grok',name:'Grok',kind:'llm',color:'#222635',model:'soporte',key:'XAI_API_KEY',modelEnv:'XAI_MODEL',docs:'https://docs.x.ai'},
  {id:'kimi',name:'Kimi',kind:'llm',color:'#3052cc',model:'contabilidad',key:'MOONSHOT_API_KEY',modelEnv:'MOONSHOT_MODEL',docs:'https://platform.moonshot.ai/docs'},
  {id:'deepseek',name:'DeepSeek',kind:'llm',color:'#466dea',model:'administrativo',key:'DEEPSEEK_API_KEY',modelEnv:'DEEPSEEK_MODEL',docs:'https://api-docs.deepseek.com'},
  {id:'perplexity',name:'Perplexity',kind:'llm',color:'#21888d',model:'marketing',key:'PERPLEXITY_API_KEY',modelEnv:'PERPLEXITY_MODEL',docs:'https://docs.perplexity.ai'},
  {id:'gemini',name:'Gemini',kind:'llm',color:'#7065cf',model:'diseno',key:'GEMINI_API_KEY',modelEnv:'GEMINI_MODEL',docs:'https://ai.google.dev/gemini-api/docs'},
] as const;
export const deckCount=2+6+departments.length*7+providers.length;
