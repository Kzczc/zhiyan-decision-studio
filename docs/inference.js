(function(){
'use strict';
const $=s=>document.querySelector(s);
let persona=null,connected=false,catalog=[],returnFocus=null,personaIdentity='',requestId=0,asking=false;
let config={gateway:['127.0.0.1','localhost'].includes(location.hostname)?location.origin:'http://127.0.0.1:61321',groups:{},actors:{}};
try{const raw=JSON.parse(localStorage.getItem('zhiyan-models-v1')||'null');if(raw&&typeof raw==='object'){config.gateway=typeof raw.gateway==='string'?raw.gateway:config.gateway;config.groups=raw.groups||{};config.actors=raw.actors||{}}}catch{}
const examples=window.ZhiyanModelCatalog||[];
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=()=>{try{localStorage.setItem('zhiyan-models-v1',JSON.stringify(config))}catch{}};
const allModels=()=>connected?catalog:examples;
const moduleId=()=>window.YanceApp.getModule().id;
const actorKey=()=>moduleId()+':'+persona?.id;
const assigned=()=>config.actors[actorKey()]||config.groups[moduleId()+':'+persona?.segmentIndex]||'rules';
function modelName(id){
 if(id==='rules')return '规则说明（不调用 LLM）';
 const m=allModels().find(x=>x.id===id)||examples.find(x=>x.id===id);
 return m?(m.vendor||m.provider)+' · '+m.model:id;
}
function modelStatus(id){
 if(id==='rules')return '即时可用';
 const m=allModels().find(x=>x.id===id);
 if(!m)return '当前注册表未提供';
 if(m.requiresModelId||m.status==='needs-model-id')return '需填写实际型号';
 if(!connected)return '待连接服务';
 if(m.configured===false)return '服务端待配置';
 return '服务已连接 · 调用待验证';
}
function filtered(){
 const q=($('#model-search')?.value||'').trim().toLowerCase(),vendor=$('#model-vendor')?.value||'',source=$('#model-source')?.value||'';
 return allModels().filter(m=>(!vendor||(m.vendor||m.provider)===vendor)&&(!source||m.source===source)&&(!q||(m.label+' '+m.model+' '+(m.vendor||'')).toLowerCase().includes(q)));
}
function options(value,useFilters=true){
 const all=allModels(),list=useFilters?filtered():all.slice(),chosen=all.find(m=>m.id===value);
 if(chosen&&!list.some(m=>m.id===value))list.unshift(chosen);
 const groups=[...new Set(list.map(m=>m.vendor||m.provider))];
 return '<option value="rules">规则说明（不调用 LLM）</option>'+groups.map(v=>'<optgroup label="'+safe(v)+'">'+list.filter(m=>(m.vendor||m.provider)===v).map(m=>'<option value="'+safe(m.id)+'" '+(m.id===value?'selected':'')+'>'+safe(m.model+' · '+(m.source==='local'?'本地':'云端'))+'</option>').join('')+'</optgroup>').join('')+(!chosen&&value&&value!=='rules'?'<option value="'+safe(value)+'" selected>'+safe(value)+' · 注册表暂未提供</option>':'');
}
function clearAnswer(){requestId++;asking=false;$('#model-answer').textContent=''}
function renderOverview(){
 const id=moduleId(),values=window.YanceApp.getModule().segments4.map((_,i)=>config.groups[id+':'+i]||'rules');
 const uniform=values.every(x=>x===values[0]),select=$('#workspace-model');
 select.innerHTML=(uniform?'':'<option value="" selected disabled>已按人群分别设置</option>')+options(uniform?values[0]:null,false);select.value=uniform?values[0]:'';
 const active=values.filter(x=>x!=='rules').length,overrideKeys=Object.keys(config.actors).filter(k=>k.startsWith(id+':')),overrides=overrideKeys.length,hasLLM=active||overrideKeys.some(k=>config.actors[k]!=='rules');
 $('#llm-badge').textContent=hasLLM?(connected?'服务已连接':'待连接服务'):'规则说明';
 $('#llm-badge').dataset.state=hasLLM?(connected?'connected':'pending'):'rules';
 $('#llm-summary').textContent=uniform?'人群默认：'+modelName(values[0])+' · '+modelStatus(values[0]):active+' 类人群已选 LLM · '+(connected?'服务已连接，调用时验证':'待连接服务');
 $('#llm-scope').textContent='统一选择应用到当前研究的 4 类人群。'+(overrides?'另有 '+overrides+' 位人物单独设置，继续保留。':'也可按人群或单个人物分别设置。');
 $('#observer-model-open').disabled=!persona;
 $('#observer-model-label').textContent=persona?'解释方式：'+modelName(assigned())+' · '+(config.actors[actorKey()]?'人物单独设置':'跟随人群')+' · '+modelStatus(assigned()):'选择人物后，可查看解释方式并提问。';
}
function render(){
 const module=window.YanceApp.getModule(),all=allModels(),vendor=$('#model-vendor').value;
 $('#model-vendor').innerHTML='<option value="">全部提供商</option>'+[...new Set(all.map(m=>m.vendor||m.provider))].sort().map(v=>'<option value="'+safe(v)+'">'+safe(v)+'</option>').join('');
 if([...$('#model-vendor').options].some(o=>o.value===vendor))$('#model-vendor').value=vendor;
 $('#model-catalog-status').textContent=(connected?'服务目录':'示例目录')+' · '+all.length+' 个型号 · 找到 '+filtered().length+' 个';
 $('#model-groups').innerHTML=module.segments4.map((g,i)=>{
  const value=config.groups[module.id+':'+i]||'rules';
  return '<label><span>'+safe(g.name)+'</span><select data-group="'+module.id+':'+i+'">'+options(value)+'</select><small>'+safe(modelStatus(value))+'</small></label>';
 }).join('');
 $('#model-persona').textContent=persona?persona.name+' · '+persona.segment:'先在地图中选择一位人物';
 $('#actor-model').innerHTML='<option value="">跟随人群默认</option>'+options(config.actors[actorKey()]||'rules');
 $('#actor-model').value=config.actors[actorKey()]||'';
 $('#actor-model').disabled=!persona;$('#model-ask').disabled=!persona||asking;
 $('#actor-effective').textContent=persona?'当前使用：'+modelName(assigned())+' · '+modelStatus(assigned()):'选择后可为此人物单独指定型号，或跟随所在人群。';
 $('#model-ask').textContent=persona&&assigned()!=='rules'?'向模型提问':'查看规则说明';
 renderOverview();
}
function openModels(section='model-selection',source=document.activeElement){
 returnFocus=source;render();$('#models-dialog').showModal();window.yanceTown?.setPlaying(false);
 requestAnimationFrame(()=>{const target=$('#'+section);target.scrollIntoView({block:'start'});(section==='model-connection'?$('#model-gateway'):section==='model-person-section'?$('#actor-model'):$('#model-search')).focus({preventScroll:true})});
}
document.body.insertAdjacentHTML('beforeend',[
 '<dialog id="models-dialog" aria-labelledby="models-title"><header class="dialog-header"><div><span class="small-label">AI MODEL SETTINGS</span><h2 id="models-title">AI 模型 · 人物解释</h2></div><button class="icon-button" data-close aria-label="关闭 AI 模型设置">×</button></header>',
 '<nav class="model-steps" aria-label="模型设置步骤"><button data-model-section="model-selection"><b>1</b>选择型号</button><button data-model-section="model-connection"><b>2</b>连接服务</button><button data-model-section="model-person-section"><b>3</b>人物提问</button></nav>',
 '<div class="dialog-body"><section id="model-selection" class="model-section"><h3>按人群分配 LLM</h3><p class="model-explainer">先选型号，再连接本地或云端服务。模型用于解释人物的选择；场景行为与业务指标仍按规则计算。</p>',
 '<div class="model-filters"><input id="model-search" type="search" placeholder="搜索 DeepSeek、Claude、Qwen…" aria-label="搜索型号"><select id="model-vendor" aria-label="提供商筛选"><option value="">全部提供商</option></select><select id="model-source" aria-label="部署位置筛选"><option value="">全部部署</option><option value="cloud">云端 API</option><option value="local">本地模型</option></select></div><p id="model-catalog-status" class="caption"></p><div id="model-groups" class="model-grid"></div>',
 '<details class="model-add"><summary>添加其他型号</summary><p>在服务端模型注册表中增加型号后，重新连接即可。配置方法见 <a href="https://github.com/Kzczc/zhiyan-decision-studio/blob/main/API.md" target="_blank" rel="noopener">模型接入文档</a>。</p></details></section>',
 '<section id="model-connection" class="model-section"><h3>连接模型服务</h3><p>选择型号后，连接已配置密钥或本地模型的服务。选择本身不会发起模型调用。</p><div class="model-connection"><label class="field"><span>模型服务地址</span><input id="model-gateway" type="url" autocomplete="off"></label><button id="model-connect" class="button">检查连接</button></div><p id="gateway-status" role="status">未连接服务。规则说明可直接查看。</p></section>',
 '<section id="model-person-section" class="model-section"><h3>为当前人物提问</h3><p id="model-persona"></p><label class="field"><span>此人物的解释方式</span><select id="actor-model"></select></label><p id="actor-effective" class="caption"></p><label class="field"><span>你想了解什么？</span><textarea id="model-question" maxlength="1200" rows="2">这个方案会怎样影响你的选择？</textarea></label><button id="model-ask" class="button primary">查看规则说明</button><div id="model-answer" role="status"></div><p class="caption">API 密钥仅配置在服务端。生成内容单独展示，不改写业务指标。</p></section></div></dialog>'
].join(''));
$('.header-actions').insertAdjacentHTML('afterbegin','<button id="models-open" class="button quiet"><i data-lucide="brain-circuit"></i><span>AI 模型</span></button>');
$('#view-world').insertAdjacentHTML('afterbegin',[
 '<section class="llm-workspace" aria-labelledby="llm-title"><div class="llm-heading"><span class="llm-icon" aria-hidden="true"><i data-lucide="brain-circuit"></i></span><div><h3 id="llm-title">人物解释 · AI 模型</h3><p>选择 LLM，了解人物为什么这样选择。</p></div><span id="llm-badge" class="llm-badge"></span></div>',
 '<div class="llm-controls"><label for="workspace-model"><span>人群默认解释方式</span><select id="workspace-model" aria-describedby="llm-scope llm-summary"></select></label><button id="llm-groups-open" class="button primary"><i data-lucide="users-round"></i>按人群分配</button><button id="llm-connect-open" class="button"><i data-lucide="plug"></i>连接模型服务</button></div>',
 '<div class="llm-feedback"><p id="llm-summary" role="status"></p><p id="llm-scope"></p></div><div class="llm-guidance"><span><b>1</b>选择型号</span><i data-lucide="chevron-right"></i><span><b>2</b>连接服务</span><i data-lucide="chevron-right"></i><span><b>3</b>选中地图人物并提问</span><small>场景与业务指标使用规则计算；LLM 用于人物解释。</small></div></section>'
].join(''));
$('.observation').insertAdjacentHTML('beforeend','<div class="observer-inference"><span id="observer-model-label"></span><button id="observer-model-open" class="text-button" disabled><i data-lucide="message-circle"></i>模型设置与提问</button></div>');
$('#model-gateway').value=config.gateway;
$('#model-search').oninput=render;$('#model-vendor').onchange=render;$('#model-source').onchange=render;
$('#models-open').onclick=()=>openModels();$('#llm-groups-open').onclick=()=>openModels();$('#llm-connect-open').onclick=()=>openModels('model-connection');$('#observer-model-open').onclick=()=>openModels('model-person-section');
$('.model-steps').onclick=e=>{const button=e.target.closest('[data-model-section]');if(button)$('#'+button.dataset.modelSection).scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})};
$('#workspace-model').onchange=e=>{window.YanceApp.getModule().segments4.forEach((_,i)=>{config.groups[moduleId()+':'+i]=e.target.value});clearAnswer();save();render()};
$('#models-dialog').addEventListener('close',()=>{window.YanceApp.setView(window.YanceApp.getInterface().currentView);if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true})});
$('#model-groups').onchange=e=>{if(e.target.dataset.group){config.groups[e.target.dataset.group]=e.target.value;clearAnswer();save();render()}};
$('#actor-model').onchange=e=>{if(persona){if(e.target.value)config.actors[actorKey()]=e.target.value;else delete config.actors[actorKey()];clearAnswer();save();render()}};
$('#model-connect').onclick=async()=>{
 const button=$('#model-connect');button.disabled=true;connected=false;clearAnswer();$('#gateway-status').textContent='正在检查连接…';
 try{
  const u=new URL($('#model-gateway').value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error('请输入 HTTP(S) 服务地址');
  config.gateway=u.origin;save();
  const response=await fetch(config.gateway+'/api/models',{signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error('服务 HTTP '+response.status);
  const data=await response.json();if(!Array.isArray(data.models))throw Error('服务未返回模型列表');catalog=data.models;connected=true;
  $('#gateway-status').textContent='网关已连接 · '+catalog.length+' 个型号。实际型号可用性在提问时验证。';
 }catch(e){$('#gateway-status').textContent='尚未连接：'+e.message+'。请启动模型网关后重试。'}
 finally{render();button.disabled=false}
};
$('#model-ask').onclick=async()=>{
 if(!persona||asking)return;
 const model=assigned(),snapshot={...persona},currentRequest=++requestId;
 asking=true;$('#model-ask').disabled=true;$('#model-answer').textContent='正在生成…';
 try{
  if(model==='rules'){$('#model-answer').textContent='规则说明 · '+snapshot.quote;return}
  if(!connected)throw Error('尚未连接模型服务，请先完成第 2 步。');
  const meta=catalog.find(m=>m.id===model);if(!meta||meta.configured===false)throw Error('所选型号尚未在服务端配置，请检查型号与密钥。');
  const app=window.YanceApp;
  const response=await fetch(config.gateway+'/api/agent-response',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,persona:snapshot,question:$('#model-question').value,strategy:app.compute().selected.name,context:app.getInterface().modules[app.getModule().id]?.context||''}),signal:AbortSignal.timeout(35000)});
  const data=await response.json();if(!response.ok)throw Error(data.error||'模型调用失败');
  if(requestId===currentRequest)$('#model-answer').textContent=data.model+' · '+(data.elapsedMs/1000).toFixed(1)+' s\n'+data.answer;
 }catch(e){if(requestId===currentRequest)$('#model-answer').textContent=e.message}
 finally{if(requestId===currentRequest){asking=false;$('#model-ask').disabled=!persona}}
};
window.ZhiyanInference={
 showPersona(value){const identity=moduleId()+':'+(value?.id||'')+':'+(value?.segmentIndex??'');persona=value;if(identity!==personaIdentity){personaIdentity=identity;clearAnswer();if($('#models-dialog').open)render();else renderOverview()}},
 snapshot:()=>JSON.parse(JSON.stringify(config)),
 restore(value){if(value&&typeof value==='object'){config.groups=value.groups||{};config.actors=value.actors||{};clearAnswer();save();render()}}
};
render();
if(window.lucide)lucide.createIcons({attrs:{'stroke-width':1.65,'aria-hidden':'true',focusable:'false'}});
})();
