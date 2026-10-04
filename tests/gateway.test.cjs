'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {requestFor,parseResponse}=require('../lib/providers.cjs');
test('provider adapters preserve correct protocol and requested model',()=>{
 process.env.ZHIYAN_TEST_KEY='test-only-not-a-real-key';
 const common={model:'model-under-test',baseUrl:'https://provider.invalid/v1',keyEnv:'ZHIYAN_TEST_KEY'};
 const gemini=requestFor({...common,provider:'gemini'},{question:'问'});
 assert.equal(gemini.headers['x-goog-api-key'],'test-only-not-a-real-key');assert.match(gemini.url,/model-under-test:generateContent$/);assert.ok(gemini.body.contents);
 const claude=requestFor({...common,provider:'anthropic'},{});assert.ok(claude.body.system);assert.equal(claude.body.model,'model-under-test');assert.equal(claude.headers['anthropic-version'],'2023-06-01');
 const local=requestFor({...common,keyEnv:undefined,provider:'openai-compatible'},{});assert.deepEqual(local.headers,{});assert.equal(local.body.model,'model-under-test');
 const reasoning=requestFor({...common,provider:'openai-compatible',tokenParameter:'max_completion_tokens',maxOutputTokens:4096},{});assert.equal(reasoning.body.max_completion_tokens,4096);assert.equal('max_tokens' in reasoning.body,false);
 assert.equal(parseResponse('gemini',{candidates:[{content:{parts:[{text:'A'},{text:'B'}]}}]}).answer,'AB');
 assert.equal(parseResponse('anthropic',{content:[{type:'thinking',text:'hidden'},{type:'text',text:'C'}]}).answer,'C');
 assert.throws(()=>parseResponse('openai-compatible',{}),/No textual/);
});
test('gateway serves local files, enforces provider allowlist and relays explanations',async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'zhiyan-test-'));let last;
 const provider=http.createServer(async(req,res)=>{let body='';for await(const x of req)body+=x;last={url:req.url,body:JSON.parse(body)};res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'这是合成样本解释。'}}],usage:{total_tokens:12}}))});
 await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
 process.env.ZHIYAN_MODELS_FILE=path.join(tmp,'models.json');
 fs.writeFileSync(process.env.ZHIYAN_MODELS_FILE,JSON.stringify({models:[{id:'local',label:'Llama test',provider:'openai-compatible',model:'llama-test',source:'local',baseUrl:'http://127.0.0.1:'+provider.address().port+'/v1'},{id:'cloud',label:'Claude test',provider:'anthropic',model:'claude-test',source:'cloud',baseUrl:'https://api.anthropic.com/v1',keyEnv:'ABSENT_ZHIYAN_KEY'},{id:'placeholder',label:'Deployment',vendor:'Custom',provider:'openai-compatible',model:'YOUR_MODEL',source:'local',baseUrl:'http://127.0.0.1:1/v1',requiresModelId:true}]}));
 const gateway=require('../server.cjs');await new Promise(resolve=>gateway.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+gateway.address().port;
 const post=(data,headers={})=>fetch(base+'/api/agent-response',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
 try{
 assert.equal((await fetch(base+'/')).status,200);
 const models=await (await fetch(base+'/api/models')).json();assert.equal(models.models[1].configured,false);assert.equal(JSON.stringify(models).includes('keyEnv'),false);
 const input={model:'local',persona:{name:'林悦',segment:'新客'},question:'如何选择？'};
 let response=await post(input);assert.equal(response.status,200);const data=await response.json();assert.match(data.answer,/合成样本/);assert.equal(last.body.model,'llama-test');assert.equal(data.changesBusinessMetrics,false);
 assert.equal((await post({...input,model:'unknown'})).status,400);
 assert.equal((await post({...input,model:'cloud'})).status,503);
 assert.equal((await post(null)).status,400);
 assert.equal(models.models[2].status,'needs-model-id');assert.equal(models.models[2].configured,false);
 assert.equal((await post({...input,model:'placeholder'})).status,503);
 assert.equal((await post(input,{Origin:'https://attacker.invalid'})).status,403);
 assert.equal((await post({...input,question:'x'.repeat(20000)})).status,400);
 assert.equal((await fetch(base+'/api/missing')).status,404);
 }finally{gateway.closeAllConnections();provider.closeAllConnections();await Promise.all([new Promise(r=>gateway.close(r)),new Promise(r=>provider.close(r))]);fs.rmSync(tmp,{recursive:true});delete process.env.ZHIYAN_MODELS_FILE;}
});
