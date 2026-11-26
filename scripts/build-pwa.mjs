import {loadCourse,courseIndex} from '../src/core/content.js';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFile(new URL(path,root));
async function files(dir){const result=[];for(const entry of await readdir(new URL(dir+'/',root),{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())result.push(...await files(path));else if(entry.isFile())result.push(path)}return result}
const pkg=JSON.parse(await read('package.json'));
const course=await loadCourse(async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))}));
await writeFile(new URL('content/runtime-index.json',root),JSON.stringify(courseIndex(course)));
const paths=['index.html','manifest.webmanifest',...await files('src'),...await files('content'),...await files('icons')].sort();
const assets=await Promise.all(paths.map(async path=>[path,sha(await read(path))]));
const template=await read('scripts/sw-template.js');
const digest=sha(JSON.stringify(assets)+template.toString()).slice(0,24);
const output=`// Generated: npm.cmd run pwa:build (do not edit manually).\nconst RELEASE=${JSON.stringify(pkg.version)};\nconst DIGEST=${JSON.stringify(digest)};\nconst ASSETS=${JSON.stringify(assets,null,2)};\n${template}`;
await writeFile(new URL('sw.js',root),output);console.log(`PWA ${pkg.version}: ${assets.length} assets, ${digest}`);
