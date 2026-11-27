from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,base64
root=Path.cwd()
imports={}
for file in [*root.glob('src/core/*.js'),root/'src/app.js',root/'content/ai-goals.js']:
 rel=file.relative_to(root).as_posix();code=file.read_text()
 code=re.sub(r"(from\s+['\"])(\.[^'\"]+)(['\"])",lambda m:m[1]+'baza:'+ (file.parent/m[2]).resolve().relative_to(root).as_posix()+m[3],code)
 if rel=='src/core/content.js':code=code.replace('import.meta.url','"https://test.invalid/src/core/content.js"')
 if rel=='src/core/database.js':code="import {normalize} from 'baza:src/core/progress.js';export async function createProgressStore({course}){return {initial:normalize(window.saved??null,course),mode:'memory-test',warning:'',pending:0,error:null,async save(s){window.saved=structuredClone(s)}}}"
 imports['baza:'+rel]='data:text/javascript;base64,'+base64.b64encode(code.encode()).decode()
html=(root/'index.html').read_text();html=re.sub(r'<link[^>]*stylesheet[^>]*>','',html);html=re.sub(r'<script[^>]*>[\s\S]*?</script>','',html)
css=(root/'src/styles/main.css').read_text()+(root/'src/styles/home.css').read_text()
files={'/content/'+f.relative_to(root/'content').as_posix():json.loads(f.read_text()) for f in (root/'content').rglob('*.json')}
html=html.replace('</head>','<style>'+css+'</style><script type="importmap">'+json.dumps({'imports':imports})+'</script><script>const files='+json.dumps(files,ensure_ascii=False).replace('</','<\\/')+';window.fetch=async u=>({ok:!!files[new URL(u).pathname],status:200,json:async()=>structuredClone(files[new URL(u).pathname])});</script></head>').replace('</body>','<script type="module">import "baza:src/app.js";</script></body>')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844}); errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 try:
  page.set_content(html,timeout=25000);page.wait_for_selector('.edition-home',timeout=10000);print('home ok');page.locator('#start').click();page.wait_for_selector('.lesson-layout');print('lesson ok');page.locator('.header [data-go=home]').click();page.wait_for_selector('.edition-home');assert page.locator('#startText').inner_text()=='Продолжить обучение';print('resume ok');page.locator('#mobile-menu-toggle').click();page.locator('#mobile-nav [data-go=settings]').click();page.locator('#launch-mode').select_option('lesson');print('settings ok');page.locator('#mobile-menu-toggle').click();page.locator('#mobile-nav [data-go=progress]').click();page.locator('[data-reset-progress]').click();page.wait_for_selector('#reset-status');page.wait_for_function("document.querySelector('#reset-status').textContent.includes('сброшены')");assert page.evaluate('saved.launch')=='lesson';print('reset ok');page.locator('.header [data-go=home]').click();page.locator('#diagnosisButton').click();page.wait_for_selector('h1');print('diagnosis heading',page.locator('h1').inner_text());print('errors',errors)
 except Exception as e:print('FAIL',str(e),errors);raise
 finally:b.close()
