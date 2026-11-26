// Generated: npm.cmd run pwa:build (do not edit manually).
const RELEASE="0.13.0";
const DIGEST="1ac1f5048bd33712aba00092";
const ASSETS=[
  [
    "content/ai-goals.js",
    "a45095f36a5fb3be7050076eea0397e9b5753333ee2a8e89bf4530ce9e583ae6"
  ],
  [
    "content/catalog.json",
    "9eca579edd25f6bf14affaf041a46cb5a0a747e8416e121b691ac3f7af9eda21"
  ],
  [
    "content/lessons/ambiguous-introductory.json",
    "2ee47d2f637dd87b9c47426a0b5e07006fb55f3f70f781fa0a0f84c00d0bc47f"
  ],
  [
    "content/lessons/introductory-boundaries.json",
    "fcd0fe9f9df41219ff07babe7109d0559131ebd7131d5b9a35e61eca6d099ce5"
  ],
  [
    "content/lessons/introductory-conjunctions.json",
    "b5292cd79000feb38fb8a44d6654d6f9adb16ac2f5a267a9098aadb31165babb"
  ],
  [
    "content/lessons/introductory-editing.json",
    "cc11d1db28b4a34c4967a72e31160a04cdb6be7310cdc8bf618563215ee98799"
  ],
  [
    "content/lessons/introductory-words.json",
    "850ab1c3b21079bb94d554f608de138f0c8024879bdfb50dca4fe330c88256b3"
  ],
  [
    "content/lessons/non-introductory-words.json",
    "f4716c58fc8aff9e0bf40060beedaef49484e6fac6cf124d5fc4e4192663fa56"
  ],
  [
    "content/modules/introductory.json",
    "a2c13e52d38e55eb8723eed17d65738f8cec6b9e4b93dc440e19db6ec03e70fc"
  ],
  [
    "content/tips.json",
    "61df14991c15da1da4f58f29d8a0769c9187b652435ad536e9f945041aa64a2f"
  ],
  [
    "icons/apple-touch-icon.png",
    "307e9e0e308784cf0ad6a3a94680ffd478971abba84e927870084d4bb1b7eff9"
  ],
  [
    "icons/favicon.ico",
    "5082af2ce42dd8b841cbd9c6875c09be846c1562e4083a966ab43ba6b1305716"
  ],
  [
    "icons/icon-192.png",
    "aaff37c445fb303a542bcde99c7e3ff21204b1e5eccbc9b855b441f548e5ebbc"
  ],
  [
    "icons/icon-512.png",
    "1b4c3c4bf1e3b9ec646a9b7011217481001c4fa0462dfa0345cf9a59ed9a44af"
  ],
  [
    "icons/maskable-512.png",
    "107b82f63c07d9d8862dcf45cc298ddba10ef92d0613b747a52fe59c4995be33"
  ],
  [
    "index.html",
    "0908e4e8b6f50bbceaddf2cc75a9d27aaafd13e4c70337a277ea5b25df31e1a9"
  ],
  [
    "manifest.webmanifest",
    "dac1221f2b3c112807e8f61abedea4a3c75b4d0c3cfe420929ba5f1387c21722"
  ],
  [
    "src/app.js",
    "d2e25d095ed15d3e472261fd0b1bb289f6561bdfd376962db14a51aaf9031286"
  ],
  [
    "src/core/assessment.js",
    "53a91556f5adb4698360878dae12cb533ee708b0087bc497763b556c3c879570"
  ],
  [
    "src/core/content.js",
    "41c7ca6a14200ecbe83d4ca1d5e6b1910b85f055b1a25a291b6e47ded90615a6"
  ],
  [
    "src/core/database.js",
    "e64fd0c41399a9ee6f2d5bce667807eb370cdd70798f37fa2b1c4f9648cfd5bb"
  ],
  [
    "src/core/exams.js",
    "077c879584a055a14a687990c52ff1808c16541e9410a105453cfeec6c994c04"
  ],
  [
    "src/core/lesson-view.js",
    "f5301e992188ddfac0c797d3449e2b8cdc9b83456d1ff68bdafb88f973dd0461"
  ],
  [
    "src/core/module-view.js",
    "f6dd41ad1e19121420e8afc696c604c4f1913646b89031128ac459b5eb4191e0"
  ],
  [
    "src/core/modules.js",
    "dacd6be4a624e017b0208ae91c6c87717438e0b4d8fc4868c6ac7ec906a75d27"
  ],
  [
    "src/core/practice.js",
    "39a7481e031e291d42917c89aec0257d03ce33998aa019e1dd673b2b9243805e"
  ],
  [
    "src/core/progress.js",
    "4902301fa09ea256d66b470e5eae38a5ffee10861d3bd185e0749b6da817bde8"
  ],
  [
    "src/core/prompt.js",
    "7a17b0d430d6157c831121d7263e1ba0827c2fea51fc2161d13e5313a621922c"
  ],
  [
    "src/core/storage.js",
    "7b5a4a4f268fa7f4da221082f3e572a1c3d3a1ecc9724762b11a2f6491690d21"
  ],
  [
    "src/pwa.js",
    "79e4f179527f952160fa7fe8b5584fb8b9784162004893b7a38c7e0d2ebe494b"
  ],
  [
    "src/styles/main.css",
    "3db7f8524c79eb4870601ee5c1bf581c76f36f6c0bd9c03c2472440db9da7b07"
  ]
];
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
async function prepare(){
  // A partial deployment must never become the active version.
  const existed=(await caches.keys()).includes(CACHE);
  try{
    const entries=await Promise.all([...urls].map(async([url,hash])=>[url,await verified(url,hash)]));
    const cache=await caches.open(CACHE);
    for(const [url,response] of entries)await cache.put(url,response);
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
