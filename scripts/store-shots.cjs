const {chromium,devices}=require('@playwright/test');
const fs=require('fs');
const path=require('path');
(async ()=>{
 const root='fastlane/metadata/android/pl-PL/images';
 const shotDir=path.join(root,'phoneScreenshots');
 fs.mkdirSync(shotDir,{recursive:true});
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:3,locale:'pl-PL',isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 const urls=[
  ['01-start','/'],
  ['02-zadania','/puzzles'],
  ['03-debiuty','/openings'],
  ['04-lekcje','/lessons'],
  ['05-analiza','/analysis'],
  ['06-import','/import']
 ];
 for(const [name,route] of urls){
  await page.goto('http://127.0.0.1:4173/#'+route,{waitUntil:'networkidle'});
  await page.locator('main').waitFor({state:'visible',timeout:15000});
  await page.waitForTimeout(300);
  const lang=await page.evaluate(()=>document.documentElement.lang);
  const h=await page.locator('main h1').first().textContent().catch(()=>null);
  await page.screenshot({path:path.join(shotDir,name+'.png'),animations:'disabled'});
  console.log(name,'LANG',lang,'TITLE',h||'no h1');
 }
 await context.close();
 const pg=await browser.newPage({viewport:{width:1024,height:500},deviceScaleFactor:1});
 const squares=Array.from({length:64},(_,i)=>{
   const row=Math.floor(i/8), col=i%8;
   const pieces={0:'♜',1:'♞',2:'♝',3:'♛',4:'♚',5:'♝',6:'♞',7:'♜',8:'♟',9:'♟',10:'♟',11:'♟',12:'♟',13:'♟',14:'♟',15:'♟',48:'♙',49:'♙',50:'♙',51:'♙',52:'♙',53:'♙',54:'♙',55:'♙',56:'♖',57:'♘',58:'♗',59:'♕',60:'♔',61:'♗',62:'♘',63:'♖'};
   const c=(row+col)%2 ? '#2e5a4b' : '#d2d3bc';
   return '<div style="background:'+c+';display:flex;align-items:center;justify-content:center;font-size:35px;color:'+(row<2?'#1b2524':'#fffae6')+'">'+(pieces[i]||'')+'</div>';
 }).join('');
 await pg.setContent('<!doctype html><html lang="pl"><head><style>*{box-sizing:border-box}body{margin:0;background:linear-gradient(120deg,#162c28,#2a5546);font-family:Arial,Helvetica,sans-serif;color:#fff}main{width:1024px;height:500px;display:flex;align-items:center;padding:70px;overflow:hidden}h1{font-size:86px;letter-spacing:-4px;margin:0 0 15px}p{font-size:29px;font-weight:500;line-height:1.32;max-width:480px;color:#ebf3df}small{display:block;font-size:20px;margin-top:35px;color:#d3e8d9}.board{display:grid;grid-template-columns:repeat(8,43px);grid-template-rows:repeat(8,43px);width:344px;height:344px;transform:rotate(6deg);box-shadow:0 30px 50px #071d19; margin-left:45px;flex-shrink:0}</style></head><body><main><section><h1>Szachy</h1><p>Graj. Analizuj partie. Ucz się na własnych błędach.</p><small>Darmowe • Open source • Stockfish</small></section><div class="board">'+squares+'</div></main></body></html>');
 await pg.screenshot({path:path.join(root,'featureGraphic.png'),animations:'disabled'});
 fs.copyFileSync('public/icon-512.png',path.join(root,'icon.png'));
 console.log('CREATED screenshots and marketing images');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
