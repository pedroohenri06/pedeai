const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:4800},deviceScaleFactor:3,isMobile:true,hasTouch:true,timezoneId:'America/Cuiaba'});await ctx.clock.setFixedTime(new Date('2026-11-14T20:30:00-04:00'));const p=await ctx.newPage();
await p.goto('http://localhost:4174/#/loja/dantes-barra-do-garcas');await p.waitForSelector('[data-add]');
await p.evaluate(async()=>{const s=document.getElementById('storeScroll');for(let y=0;y<5000;y+=400){s.scrollTop=y;await new Promise(r=>setTimeout(r,120));}s.scrollTop=0;});
await p.waitForTimeout(2500);await p.screenshot({path:process.argv[2]+'/store_tall.jpg',type:'jpeg',quality:90});await b.close()})();
