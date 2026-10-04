const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH}),page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
 const base=process.env.ZHIYAN_URL||'http://127.0.0.1:61321/';
 await page.goto(base);await page.waitForFunction(()=>window.ZhiyanInference&&window.yanceTown);await page.evaluate(()=>document.fonts.ready);
 for(const width of [1440,1024,768,390]){
  await page.setViewportSize({width,height:960});await page.locator('#models-open').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width);
  assert.equal(await page.locator('#models-dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'model dialog overflow '+width);
  assert.equal(await page.locator('#model-groups select').count(),4);
  await page.locator('#models-dialog [data-close]').click();
 }
 await page.setViewportSize({width:1440,height:960});
 for(const id of ['public','growth','merchant']){
  await page.locator('[data-module="'+id+'"]').click();
  await page.locator('.scene-display').evaluate(e=>e.open=true);
  await page.locator('#scene-agent-profile').selectOption('stress');await page.locator('#scene-model').selectOption('price');
  await page.locator('.scene-display').evaluate(e=>e.open=false);
  await page.locator('[data-action="save"]').click();await page.locator('#study-name').fill('模型恢复 '+id);await page.locator('#save-form button[type=submit]').click();
  await page.locator('.scene-display').evaluate(e=>e.open=true);await page.locator('#scene-model').selectOption('balanced');await page.locator('.scene-display').evaluate(e=>e.open=false);
  await page.locator('[data-action="library"]').first().click();await page.locator('[data-load-study]').first().click();
  assert.equal(await page.evaluate(()=>yanceTown.options.model),'price');
  await page.locator('#tab-comparison').click();assert.ok(await page.locator('#stats svg').count()>0);
 }
 await page.locator('#tab-world').click();await page.locator('#visitor-select').selectOption('1');await page.locator('#models-open').click();
 const group=page.locator('#model-groups select').first();
 assert.equal(await group.locator('option').count(),31);
 await page.locator('#model-search').fill('DeepSeek');assert.equal(await group.locator('option').count(),4);
 await group.selectOption('deepseek-chat');
 await page.locator('#model-search').fill('Claude');assert.equal(await group.inputValue(),'deepseek-chat','filter must preserve assignment');
 await page.locator('#actor-model').selectOption('claude-sonnet');
 await page.locator('#model-search').fill('');await page.locator('#model-source').selectOption('local');
 assert.equal(await group.locator('option[value="qwen-local"]').count(),1);
 assert.equal(await group.locator('option[value="gemini-flash"]').count(),0);
 assert.equal(await group.inputValue(),'deepseek-chat');
 await page.locator('#model-source').selectOption('');await page.locator('#model-vendor').selectOption('Qwen');
 assert.equal(await group.locator('option').count(),6,'rules, four Qwen entries, retained DeepSeek');
 await page.locator('#model-vendor').selectOption('');
 await page.locator('#model-search').fill('nonexistent-model');
 assert.equal(await group.locator('option').count(),2);assert.equal(await page.locator('#actor-model').inputValue(),'claude-sonnet');
 await page.locator('#model-search').fill('');
 await page.route('**/api/models',route=>route.fulfill({json:{models:[{id:'private-research',label:'Private research model',vendor:'Internal lab',provider:'openai-compatible',model:'research-v7',source:'local',configured:true,status:'unverified'}]}}));
 await page.locator('#model-gateway').fill(new URL(base).origin);await page.locator('#model-connect').click();
 await page.waitForFunction(()=>document.querySelector('#gateway-status').textContent.includes('网关已连接'));
 assert.equal(await page.locator('#model-vendor option[value="Internal lab"]').count(),1,'custom registry family appears without frontend changes');
 assert.equal(await group.locator('option[value="private-research"]').count(),1);
 assert.equal(await group.inputValue(),'deepseek-chat','missing registry model must not silently change an assignment');
 assert.equal(await page.locator('#actor-model').inputValue(),'claude-sonnet');

 await page.reload();await page.waitForFunction(()=>window.ZhiyanInference);
 const stored=await page.evaluate(()=>ZhiyanInference.snapshot());assert.equal(stored.groups['merchant:0'],'deepseek-chat');assert.equal(stored.actors['merchant:1'],'claude-sonnet');
 for(const filename of ['brand.html','demo.html']){
  await page.goto(base+filename);await page.evaluate(()=>document.fonts.ready);
  for(const width of [1440,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,filename+' '+width)}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 console.log(JSON.stringify({status:'PASS',widths:4,products:3,modelRestore:true,routingPersistence:true,catalogFiltering:true,aboutAndDemo:true,errors,bad}));await browser.close()
})().catch(e=>{console.error(e);process.exit(1)});
