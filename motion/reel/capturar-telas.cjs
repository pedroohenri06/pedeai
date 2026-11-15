const {chromium}=require('playwright');const IDS=['maromba','tropical','old-school'];const O=process.argv[2];const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:790},deviceScaleFactor:3,isMobile:true,hasTouch:true,timezoneId:'America/Cuiaba'});await ctx.clock.setFixedTime(new Date('2026-11-14T20:30:00-04:00'));const p=await ctx.newPage();
const pos={};const box=async(sel,k)=>{const r=await p.locator(sel).first().boundingBox();pos[k]={x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height};};
const shot=async n=>{await p.waitForTimeout(600);await p.screenshot({path:O+'/'+n+'.png'});};
await p.goto('http://localhost:4174/');await p.waitForTimeout(2500);await shot('home');
await box('.card,[data-store],.store-card','firstCard').catch(()=>{});
await p.goto('http://localhost:4174/#/loja/dantes-barra-do-garcas');await p.waitForSelector('[data-add]');await p.waitForTimeout(1500);await shot('store_top');
// scroll até o duplo
const sc=await p.evaluate(()=>{const el=document.querySelector('[data-add="maromba"]').closest('.sp-item');const sp=document.getElementById('storeScroll');const r=el.getBoundingClientRect();sp.scrollTop+=r.top-170;return {y:sp.scrollTop};});
await p.waitForTimeout(800);pos.scroll=sc;await shot('store_menu');
for(const id of IDS) await box('[data-add="'+id+'"]','add_'+id);
// cartões isolados (sem a barra fixa de busca por cima), para saírem da tela no filme
await p.evaluate(()=>{window.__fx=[...document.querySelectorAll('#storeScroll *')].filter(e=>['sticky','fixed'].includes(getComputedStyle(e).position));window.__fx.forEach(e=>e.style.visibility='hidden');});
for(const id of IDS){const h=await p.evaluateHandle(i=>document.querySelector('[data-add="'+i+'"]').closest('.sp-item'),id);await h.asElement().screenshot({path:O+'/card_'+id+'.png'});}
await p.evaluate(()=>window.__fx.forEach(e=>e.style.visibility=''));
for(const id of IDS){const r=await p.evaluate(i=>{const e=document.querySelector('[data-add="'+i+'"]').closest('.sp-item').getBoundingClientRect();return {x:e.x,y:e.y,w:e.width,h:e.height}},id);pos['card_'+id]=r;}
{const r=await p.evaluate(()=>{const e=document.getElementById('cartBar');return null});}
for(const id of IDS){await p.click('[data-add="'+id+'"]');await p.waitForTimeout(450);if(await p.locator('#spSheet.open').count()){console.log('abriu folha',id);await p.keyboard.press('Escape');}await shot('store_menu_'+id);const y=await p.evaluate(()=>document.getElementById('storeScroll').scrollTop);console.log(id,'scroll',y);}
await box('#cartBar','cartBar');
await p.click('#cartBar');await shot('step1');for(const [sel,k] of [['#ckSteps','steps'],['#cartLines','lines'],['.ck-foot-row','foot']]){const r=await p.locator(sel).first().boundingBox();pos[k]={x:r.x,y:r.y,w:r.width,h:r.height};}await box('#cartSend','send');
await p.click('#cartSend');await p.fill('#cartName','');await p.fill('#cartStreet','');await p.fill('#cartDistrict','');await p.fill('#cartRef','');await shot('step2_empty');
for(const k of ['cartName','cartStreet','cartDistrict','cartRef'])await box('#'+k,k);
await p.fill('#cartName','Maria');await p.fill('#cartStreet','Rua das Flores, 120');await p.fill('#cartDistrict','Centro');await p.fill('#cartRef','Casa azul');await shot('step2_filled');
await p.click('#cartSend');await shot('step3_empty');await box('#cartPay label:has(input[value="Pix"])','pix');
await p.click('#cartPay label:has(input[value="Pix"])');await shot('step3_pix');
await p.evaluate(()=>{window.open=u=>{window.__o=u}});await p.click('#cartSend');
fs.writeFileSync(O+'/msg.txt',decodeURIComponent((await p.evaluate(()=>window.__o)).split('text=')[1]));
fs.writeFileSync(O+'/pos.json',JSON.stringify(pos,null,1));await b.close()})();
