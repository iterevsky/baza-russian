import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,readdir} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
const root=new URL('../',import.meta.url),source=await readFile(new URL('sw.js',root),'utf8');
const pkg=JSON.parse(await readFile(new URL('package.json',root)));
const scope='https://example.test/baza/',assets=JSON.parse(source.match(/const ASSETS=(\[[\s\S]*?\n\]);/)[1]);
const prefix='baza-russian-offline:'+scope+':';
const cacheName=prefix+pkg.version+'-'+source.match(/const DIGEST="([a-f0-9]+)"/)[1];
const body=new Map(await Promise.all(assets.map(async([p])=>[new URL(p,scope).href,await readFile(new URL(p,root))])));
function mock({code=source,network=new Map(body),db=new Map()}={}){
 const events={};let requests=0;
 const caches={keys:async()=>[...db.keys()],delete:async k=>db.delete(k),open:async name=>{if(!db.has(name))db.set(name,new Map());const cache=db.get(name);return{put:async(k,v)=>cache.set(k,v.clone()),match:async k=>cache.get(k)?.clone()}}};
 const self={registration:{scope},addEventListener:(k,f)=>events[k]=f};
 vm.runInNewContext(code,{self,caches,crypto:webcrypto,URL,Response,Uint8Array,fetch:async url=>{requests++;if(!network.has(url))return new Response('missing',{status:404});return new Response(network.get(url))}});
 return {db,network,get requests(){return requests},event(type){let promise;events[type]({waitUntil:p=>promise=p});return promise},fetch(url,method='GET'){let promise;events.fetch({request:{url,method},respondWith:p=>promise=p});return promise}};
}
async function files(dir){let result=[];for(const e of await readdir(new URL(dir+'/',root),{withFileTypes:true})){const p=dir+'/'+e.name;result.push(...e.isDirectory()?await files(p):[p])}return result}
test('PWA manifest, generated hashes and complete assets match the release',async()=>{
 const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root)));assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.display,'standalone');assert.equal(pkg.version,'0.12.0');
 assert.deepEqual(assets.map(x=>x[0]),['index.html','manifest.webmanifest',...await files('src'),...await files('content'),...await files('icons')].sort());
 for(const [path,hash] of assets)assert.equal(createHash('sha256').update(body.get(new URL(path,scope).href)).digest('hex'),hash,path);
 for(const icon of manifest.icons){const data=body.get(new URL(icon.src,scope).href);const [w,h]=icon.sizes.split('x').map(Number);assert.equal(data.readUInt32BE(16),w);assert.equal(data.readUInt32BE(20),h)}
 assert.match(source,/const RELEASE="0\.12\.0"/);
});
test('install verifies all assets; offline root, JS, lessons and icons use same release',async()=>{const m=mock();await m.event('install');assert.equal(m.db.get(cacheName).size,assets.length);await m.event('activate');m.network.clear();const count=m.requests;assert.equal(await (await m.fetch(scope+'?from=app')).text(),body.get(scope+'index.html').toString());for(const [path] of assets)assert.deepEqual(Buffer.from(await (await m.fetch(scope+path)).arrayBuffer()),body.get(scope+path));assert.equal(m.requests,count)});
test('missing or modified resource aborts install without deleting previous release',async()=>{for(const changed of [false,true]){const old=new Map([['old','old']]);const db=new Map([[prefix+'old',old],['foreign-cache',new Map()]]),m=mock({db});const path=scope+'content/catalog.json';if(changed)m.network.set(path,Buffer.from('{}'));else m.network.delete(path);await assert.rejects(m.event('install'),/Missing asset|integrity mismatch/);assert.equal(db.has(cacheName),false);assert.equal(db.get(prefix+'old'),old);assert.ok(db.has('foreign-cache'))}});
test('activation only removes older caches from this scope; install does not activate or claim',async()=>{const old=prefix+'old',foreign='other-app',otherScope='baza-russian-offline:https://example.test/other/:old';const m=mock({db:new Map([[old,new Map()],[foreign,new Map()],[otherScope,new Map()]])});await m.event('install');assert.ok(m.db.has(old));await m.event('activate');assert.deepEqual([...m.db.keys()].sort(),[cacheName,foreign,otherScope].sort())});
test('unknown or cross-origin resources and non-GET requests are not intercepted',()=>{const m=mock();assert.equal(m.fetch('https://external.test/data'),undefined);assert.equal(m.fetch(scope+'missing.json'),undefined);assert.equal(m.fetch(scope+'index.html','POST'),undefined);assert.equal(m.fetch(scope+'sw.js'),undefined)});
test('evicted assets are repaired only with identical verified bytes',async()=>{const m=mock();await m.event('install');const path=scope+'content/catalog.json';m.db.get(cacheName).delete(path);m.network.set(path,Buffer.from('{}'));assert.equal((await m.fetch(path)).status,503);assert.equal(m.db.get(cacheName).has(path),false);m.network.set(path,body.get(path));assert.equal((await m.fetch(path)).status,200);assert.ok(m.db.get(cacheName).has(path));m.network.clear();assert.equal((await m.fetch(path)).status,200)});
