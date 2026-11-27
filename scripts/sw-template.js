// Generated release metadata is prepended by scripts/build-pwa.mjs.
const SCOPE=new URL(self.registration.scope);
const PREFIX='baza-russian-offline:'+SCOPE.href+':';
const CACHE=PREFIX+RELEASE+'-'+DIGEST;
const urls=new Map(ASSETS.map(([path,hash])=>[new URL(path,SCOPE).href,hash]));
const INDEX=new URL('index.html',SCOPE).href;
const hex=buffer=>Array.from(new Uint8Array(buffer),x=>x.toString(16).padStart(2,'0')).join('');
async function verified(url,hash){
 const response=await fetch(url,{cache:'no-store',credentials:'same-origin',redirect:'error'});
 if(!response.ok||response.type==='opaque')throw Error('Missing asset: '+url);
 const actual=hex(await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer()));
 if(actual!==hash)throw Error('Asset integrity mismatch: '+url);
 return response;
}
async function notifyProgress(done,total){try{const clients=await self.clients?.matchAll({type:"window",includeUncontrolled:true});for(const client of clients??[]){if(client.url.startsWith(SCOPE.href))client.postMessage({type:"baza-package-progress",done,total,release:RELEASE});}}catch{}}
async function prepare(){
  // A partial deployment must never become the active version.
  const existed=(await caches.keys()).includes(CACHE);
  try{
    const cache=await caches.open(CACHE),entries=[...urls];
    await notifyProgress(0,entries.length);
    // Limit simultaneous downloads and verified response buffers; wait for a whole batch before rollback.
    for(let i=0;i<entries.length;i+=6){
      const batch=await Promise.allSettled(entries.slice(i,i+6).map(async([url,hash])=>[url,await verified(url,hash)]));
      const failure=batch.find(x=>x.status==='rejected');if(failure)throw failure.reason;
      for(const item of batch){const [url,response]=item.value;await cache.put(url,response)}
      await notifyProgress(Math.min(i+batch.length,entries.length),entries.length);
    }
  }catch(error){if(!existed)await caches.delete(CACHE);throw error}
}
self.addEventListener('install',event=>event.waitUntil(prepare()));
// Do not skipWaiting or claim existing pages: let the old release finish naturally.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==SCOPE.origin)return;
 url.hash='';url.search='';
 const key=url.href===SCOPE.href?INDEX:url.href;
 if(!urls.has(key))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),response=await cache.match(key);
  // Never substitute a file from a different release, even online.
  if(response)return response;
  try{const recovered=await verified(key,urls.get(key));await cache.put(key,recovered.clone());return recovered}catch{}
  return new Response('Автономный пакет повреждён. Не очищайте данные сайта: сохраните прогресс и восстановите пакет.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 })());
});

// Readiness means that every required cache entry is present, not just that a worker exists.
async function packageStatus(){
 const cache=await caches.open(CACHE);let present=0;const keys=[...urls.keys()];
 for(let i=0;i<keys.length;i+=12){const batch=await Promise.all(keys.slice(i,i+12).map(key=>cache.match(key)));present+=batch.filter(r=>r?.ok).length}
 return {type:'baza-package-status',release:RELEASE,present,total:keys.length};
}
async function repairPackage(){
 const cache=await caches.open(CACHE);let failed=0;
 for(const [key,hash] of urls){const existing=await cache.match(key);if(existing?.ok)continue;try{await cache.put(key,await verified(key,hash))}catch{failed++}}
 return {...await packageStatus(),failed};
}
self.addEventListener('message',event=>{const type=event.data?.type;if(!['baza-package-status','baza-package-repair'].includes(type)||!event.ports?.[0])return;const port=event.ports[0];event.waitUntil((type==='baza-package-repair'?repairPackage():packageStatus()).then(result=>port.postMessage(result)).catch(()=>port.postMessage({type:'baza-package-status',release:RELEASE,error:true})));});
