const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH}),page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
 const base=process.env.ZHIYAN_URL||'http://127.0.0.1:61321/';
 await page.goto(base);await page.waitForFunction(()=>window.ZhiyanInference&&window.yanceTown);await page.evaluate(()=>document.fonts.ready);
 for(const width of [1440,1024,768,390]){
  await page.setViewportSize({width,height:960});await page.locator('#models-open').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width);
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
 await page.locator('#model-groups select').first().selectOption('gemini-flash');await page.locator('#actor-model').selectOption('claude-sonnet');
 await page.reload();await page.waitForFunction(()=>window.ZhiyanInference);
 const stored=await page.evaluate(()=>ZhiyanInference.snapshot());assert.equal(stored.groups['merchant:0'],'gemini-flash');assert.equal(stored.actors['merchant:1'],'claude-sonnet');
 for(const filename of ['brand.html','demo.html']){
  await page.goto(base+filename);await page.evaluate(()=>document.fonts.ready);
  for(const width of [1440,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,filename+' '+width)}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 console.log(JSON.stringify({status:'PASS',widths:4,products:3,modelRestore:true,routingPersistence:true,aboutAndDemo:true,errors,bad}));await browser.close()
})().catch(e=>{console.error(e);process.exit(1)});
