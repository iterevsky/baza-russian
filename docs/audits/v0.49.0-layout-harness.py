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
results=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.set_content(html,timeout=25000);page.wait_for_selector('.edition-home',timeout=10000)
 def go(name):
  # Trigger the actual navigation controller; hidden desktop buttons are used only as test inputs.
  page.locator(f'#desktop-nav [data-go="{name}"]').evaluate('(e)=>e.click()')
  page.wait_for_timeout(30)
 def metrics():
  return page.evaluate('''()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('#content *,.header *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>document.documentElement.clientWidth+2}).slice(0,8).map(e=>[e.tagName,e.className?.baseVal??e.className,e.textContent.slice(0,45),Math.round(e.getBoundingClientRect().right)])})''')
 for width,height in [(320,568),(360,640),(375,667),(390,844),(414,736),(768,1024),(1024,768),(1440,900)]:
  page.set_viewport_size({'width':width,'height':height})
  for theme in ['light','dark']:
   if page.locator('html').get_attribute('data-theme')!=theme:page.locator('#theme').evaluate('(e)=>e.click()')
   for screen in ['home','catalog','practice','memory','tips','profile','progress','settings','diagnosis']:
    go(screen);r=metrics();results.append({'width':width,'height':height,'theme':theme,'screen':screen,**r})
   go('home');page.locator('#start').evaluate('(e)=>e.click()');page.wait_for_selector('.lesson-layout');r=metrics();results.append({'width':width,'height':height,'theme':theme,'screen':'lesson',**r})
   go('home');page.locator('#chapter-1').evaluate('(e)=>e.open=true');r=metrics();results.append({'width':width,'height':height,'theme':theme,'screen':'preface',**r});page.locator('#chapter-1').evaluate('(e)=>e.open=false')
   if width in (320,390,1440):page.screenshot(path=str(root/f'docs/audits/v0.49.0-{width}-{theme}.png'))
 b.close()
report={'states':len(results),'errors':errors,'overflow':[r for r in results if r['scroll']>r['width']+1 or r['offenders']],'results':results,'method':'Chromium set_content with memory store and mocked asset fetch; real controller, HTML/CSS; no service worker or persistent storage'}
(root/'docs/audits/v0.49.0-layout-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('states',len(results),'errors',errors,'overflow',len(report['overflow']))
for r in report['overflow'][:35]:print(r['width'],r['theme'],r['screen'],r['scroll'],r['offenders'][:3])
