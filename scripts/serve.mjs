import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {gzip} from 'node:zlib';
import {promisify} from 'node:util';
const gzipAsync=promisify(gzip);
const rootDefault=fileURLToPath(new URL('../',import.meta.url));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.ico':'image/x-icon','.jpg':'image/jpeg'};
export function assetPath(raw){
 const pathname=raw.split('?')[0];let path;
 try{path=decodeURIComponent(pathname)}catch{return null}
 if(path==='/'||path==='/index.html')return 'index.html';
 if(!path.startsWith('/')||path.includes('\\')||path.includes('\0')||path.split('/').some(x=>x==='.'||x==='..'))return null;
 const file=path.slice(1);
 return /^(?:sw\.js|manifest\.webmanifest|src\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:js|css)|content\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:json|js)|icons\/[a-z0-9-]+\.(?:png|ico)|icons\/pushkin-1827\.jpg)$/.test(file)?file:null;
}
export function acceptsGzip(value=''){
 return value.split(',').some(part=>{const [coding,...params]=part.trim().split(';');if(coding.toLowerCase()!=='gzip')return false;const q=params.find(x=>/^\s*q\s*=/i.test(x));return !q||Number(q.split('=')[1])>0});
}
export async function createAppServer(root=rootDefault){
 const base=await realpath(root);
 return createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const finish=(code,msg)=>{res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8'});res.end(req.method==='HEAD'?undefined:msg)};
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return finish(405,'Method not allowed')}
  const path=assetPath(req.url??'');if(!path)return finish(404,'Not found');
  try{
   const file=await realpath(resolve(base,path)),rel=relative(base,file);
   if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel)||!(await stat(file)).isFile())return finish(404,'Not found');
   let bytes=await readFile(file);
   const type=MIME[extname(path)];res.setHeader('Content-Type',type);
   if(bytes.length>=1024&&/^(text\/|application\/)/.test(type)){res.setHeader('Vary','Accept-Encoding');if(acceptsGzip(req.headers['accept-encoding'])){bytes=await gzipAsync(bytes);res.setHeader('Content-Encoding','gzip')}}
   res.setHeader('Content-Length',bytes.length);res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
  }catch(e){if(!res.headersSent)finish(['ENOENT','ENOTDIR'].includes(e.code)?404:500,'Unable to read resource');else res.destroy()}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const server=await createAppServer();
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port 8001 already in use. Check http://localhost:8001/ or stop the previous server manually.':e.message);process.exitCode=1});
 server.listen(8001,'127.0.0.1',()=>console.log('BAZA Russian: http://localhost:8001/ (local, no npm downloads)'));
}
