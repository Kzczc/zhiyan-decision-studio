(function(){
'use strict';
const $=s=>document.querySelector(s);
let persona=null,connected=false,catalog=[];
let config={gateway:location.hostname==='127.0.0.1'||location.hostname==='localhost'?location.origin:'http://127.0.0.1:61321',groups:{},actors:{}};
try{const raw=JSON.parse(localStorage.getItem('zhiyan-models-v1')||'null');if(raw&&typeof raw==='object'){config.gateway=typeof raw.gateway==='string'?raw.gateway:config.gateway;config.groups=raw.groups||{};config.actors=raw.actors||{}}}catch{}
const examples=[{id:'gemini-flash',label:'Gemini · Flash',model:'gemini-2.5-flash',source:'cloud'},{id:'claude-sonnet',label:'Claude · Sonnet',model:'claude-sonnet-4-5',source:'cloud'},{id:'llama-local',label:'Llama · Ollama',model:'llama3.2:3b',source:'local'},{id:'qwen-local',label:'Qwen · Ollama',model:'qwen3:8b',source:'local'}];
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=()=>{try{localStorage.setItem('zhiyan-models-v1',JSON.stringify(config))}catch{}};
function options(value){return '<option value="rules">本地规则 · 无模型调用</option>'+ (connected?catalog:examples).map(m=>'<option value="'+safe(m.id)+'" '+(m.id===value?'selected':'')+'>'+safe(m.label+' / '+m.model+(m.configured===false?' · 未配置密钥':!connected?' · 待连接':''))+'</option>').join('')}
function actorKey(){return window.YanceApp.getModule().id+':'+persona?.id}
function assigned(){const module=window.YanceApp.getModule().id;return config.actors[actorKey()]||config.groups[module+':'+persona?.segmentIndex]||'rules'}
function render(){
 const module=window.YanceApp.getModule();
 $('#model-groups').innerHTML=module.segments4.map((g,i)=>'<label><span>'+safe(g.name)+'</span><select data-group="'+module.id+':'+i+'">'+options(config.groups[module.id+':'+i]||'rules')+'</select></label>').join('');
 $('#model-persona').textContent=persona?persona.name+' · '+persona.segment:'先在地图下方选择一位人物';
 $('#actor-model').innerHTML='<option value="">跟随所在人群</option>'+options(config.actors[actorKey()]||'rules');
 $('#actor-model').value=config.actors[actorKey()]||'';
 $('#actor-model').disabled=!persona;$('#model-ask').disabled=!persona;
}
document.body.insertAdjacentHTML('beforeend','<dialog id="models-dialog" aria-labelledby="models-title"><header class="dialog-header"><div><span class="small-label">MODEL ROUTING</span><h2 id="models-title">模型与人物分配</h2></div><button class="icon-button" data-close aria-label="关闭模型设置">×</button></header><div class="dialog-body"><p class="model-explainer">Gemini、Claude、Llama 可分别分配给人群或具体人物。行为假设控制画面样本；推理模型用于生成当前人物的解释。</p><label class="field"><span>本机网关地址</span><input id="model-gateway" type="url" autocomplete="off"></label><button id="model-connect" class="button">检查连接 / Connect</button><p id="gateway-status" role="status">未连接模型服务。本地规则可直接使用。</p><div id="model-groups" class="model-grid"></div><hr><h3 id="model-persona"></h3><label class="field"><span>此人物的模型覆盖</span><select id="actor-model"></select></label><label class="field"><span>询问当前人物</span><textarea id="model-question" maxlength="1200" rows="2">这个方案会怎样影响你的选择？</textarea></label><button id="model-ask" class="button primary">生成解释 / Explain</button><div id="model-answer" role="status"></div><p class="caption">模型返回值不会直接改写业务指标。API 密钥仅配置在服务端；静态网站不接收密钥。</p></div></dialog>');
$('.header-actions').insertAdjacentHTML('afterbegin','<button id="models-open" class="button quiet"><span>模型与接入</span></button>');
$('#model-gateway').value=config.gateway;
$('#models-open').onclick=()=>{render();$('#models-dialog').showModal();window.yanceTown?.setPlaying(false)};
$('#models-dialog').addEventListener('close',()=>{if(window.YanceApp)window.YanceApp.setView(window.YanceApp.getInterface().currentView)});
$('#model-groups').onchange=e=>{if(e.target.dataset.group){config.groups[e.target.dataset.group]=e.target.value;save()}};
$('#actor-model').onchange=e=>{if(persona){if(e.target.value)config.actors[actorKey()]=e.target.value;else delete config.actors[actorKey()];save()}};
$('#model-connect').onclick=async()=>{
 const button=$('#model-connect');button.disabled=true;connected=false;
 try{const u=new URL($('#model-gateway').value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error('请输入 HTTP(S) 网关地址');
 config.gateway=u.origin;save();const response=await fetch(config.gateway+'/api/models',{signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error('网关 HTTP '+response.status);
 const data=await response.json();if(!Array.isArray(data.models))throw Error('网关未返回模型列表');catalog=data.models;connected=true;
 $('#gateway-status').textContent='网关已连接 · '+catalog.length+' 个型号。提供商连通性将在调用时验证。';
 }catch(e){$('#gateway-status').textContent='尚未连接：'+e.message+'。在本机运行 node server.cjs 后重试。'}finally{render();button.disabled=false}
};
$('#model-ask').onclick=async()=>{
 if(!persona)return;const button=$('#model-ask'),model=assigned(),snapshot={...persona};button.disabled=true;$('#model-answer').textContent='正在生成…';
 try{
 if(model==='rules'){$('#model-answer').textContent='本地规则说明 · '+snapshot.quote;return}
 if(!connected)throw Error('请先连接本机网关');
 const meta=catalog.find(m=>m.id===model);if(!meta||meta.configured===false)throw Error('所选型号尚未在服务端配置');
 const app=window.YanceApp;const response=await fetch(config.gateway+'/api/agent-response',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,persona:snapshot,question:$('#model-question').value,strategy:app.compute().selected.name,context:app.getInterface().modules[app.getModule().id]?.context||''}),signal:AbortSignal.timeout(35000)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'模型调用失败');
 $('#model-answer').textContent=data.model+' · '+(data.elapsedMs/1000).toFixed(1)+' s\n'+data.answer;
 }catch(e){$('#model-answer').textContent=e.message}finally{button.disabled=false}
};
window.ZhiyanInference={showPersona(value){if(persona?.id!==value?.id)$('#model-answer').textContent='';persona=value;if($('#models-dialog').open)render()},snapshot:()=>JSON.parse(JSON.stringify(config)),restore(value){if(value&&typeof value==='object'){config.groups=value.groups||{};config.actors=value.actors||{};save()}}};
})();
