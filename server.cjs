'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'docs'),port=Number(process.env.PORT||61321);
const providers=require('./lib/providers.cjs');
const allowed=new Set(['http://127.0.0.1:'+port,'http://localhost:'+port,'https://kzczc.github.io']);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.png':'image/png','.webm':'video/webm','.vtt':'text/vtt; charset=utf-8'};
let busy=0;
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
async function json(req){let buffer='';for await(const chunk of req){buffer+=chunk;if(Buffer.byteLength(buffer)>16384)throw new Error('Request too large')}return JSON.parse(buffer)}
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin;
 if(origin&&!allowed.has(origin))return send(res,403,{error:'Origin not allowed'});
 if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
 res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/models'){try{return send(res,200,{ready:true,models:providers.publicModels(),mode:'server-configured'})}catch{return send(res,500,{error:'Invalid server model registry'})}}
 if(url.pathname==='/api/agent-response'){
  if(req.method!=='POST')return send(res,405,{error:'Use POST'});
  if(busy>=2)return send(res,429,{error:'Two requests already in progress'});
  let input;try{input=await json(req)}catch{return send(res,400,{error:'Invalid JSON or body exceeds 16 KB'})}
  if(!input||typeof input!=='object'||Array.isArray(input))return send(res,400,{error:'Expected a JSON object'});
  let entry;try{entry=providers.registry().find(m=>m.id===input.model)}catch{return send(res,500,{error:'Invalid registry'})}
  if(!entry)return send(res,400,{error:'Unknown model'});
  if(entry.requiresModelId)return send(res,503,{error:'Replace the example model ID in the server registry first'});
  if(entry.keyEnv&&!process.env[entry.keyEnv])return send(res,503,{error:'Provider key is not configured on the server'});
  if(!input.persona||typeof input.persona.name!=='string'||typeof input.question!=='string'||input.question.length>1200)return send(res,400,{error:'persona.name and question (max 1200 chars) are required'});
  busy++;
  try{
   const persona={name:input.persona.name.slice(0,80),segment:String(input.persona.segment||'').slice(0,100),status:String(input.persona.status||'').slice(0,100)};
   const result=await providers.invoke(entry,{persona,strategy:input.strategy,context:input.context,question:input.question});
   send(res,200,{...result,model:entry.model,provider:entry.provider,persona,source:'model-provider',changesBusinessMetrics:false});
  }catch{return send(res,502,{error:'Model provider unavailable or timed out'})}finally{busy--}
  return;
 }
 if(url.pathname.startsWith('/api/'))return send(res,404,{error:'Unknown endpoint'});
 if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Use GET'});
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname))}catch{return send(res,400,{error:'Invalid path'})}
 if(!file.startsWith(root+path.sep))return send(res,403,{error:'Forbidden'});
 fs.readFile(file,(error,data)=>{if(error)return send(res,404,{error:'Not found'});res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data)});
});
if(require.main===module)server.listen(port,'127.0.0.1',()=>console.log('ZHIYAN http://127.0.0.1:'+port));
module.exports=server;
