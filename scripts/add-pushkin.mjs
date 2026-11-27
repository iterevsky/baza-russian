import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),file=p=>new URL(p,root);
const read=p=>readFile(file(p),'utf8');
const imagePath='icons/pushkin-1827.jpg';
const source='https://upload.wikimedia.org/wikipedia/commons/5/56/Kiprensky_Pushkin.jpg';
const pkg=JSON.parse(await read('package.json'));if(pkg.name!=='baza-russian'||!pkg.version.startsWith('1.0.0-rc.1'))throw Error('Ожидается baza-russian 1.0.0-rc.1.');
let home=await read('src/core/home.js'),serve=await read('scripts/serve.mjs');
const old='<div class=\\"portrait-placeholder\\">А. С.<small>ПУШКИН<br/>1799–1837</small></div>';
const replacement='<img src=\\"./icons/pushkin-1827.jpg\\" alt=\\"Александр Сергеевич Пушкин. Портрет работы Ореста Кипренского, 1827 год\\" width=\\"1759\\" height=\\"2048\\" decoding=\\"async\\"/>';
if(!home.includes(old)&&!home.includes(replacement))throw Error('Разметка портрета отличается от ожидаемой. Ничего не изменено.');
home=home.replace(old,replacement).replace('А. С. Пушкин. 1799–1837.</span>','О. А. Кипренский. Портрет А. С. Пушкина, 1827.</span>').replace('Портрет О. А. Кипренского, 1827 (внешний источник)','Источник: Wikimedia Commons · общественное достояние');
const oldMime="'.png':'image/png'";if(!serve.includes(oldMime))throw Error('Неизвестная таблица MIME.');
if(!serve.includes("'.jpg':'image/jpeg'"))serve=serve.replace(oldMime,oldMime+",'.jpg':'image/jpeg'");
const oldRule='icons\\/[a-z0-9-]+\\.(?:png|ico)';const newRule='icons\\/[a-z0-9-]+\\.(?:png|ico)|icons\\/pushkin-1827\\.jpg';
if(!serve.includes(newRule)){if(!serve.includes(oldRule))throw Error('Неизвестное правило локального сервера.');serve=serve.replace(oldRule,newRule)}
function validJPEG(b){return b.length>4096&&b.length<20*1024*1024&&b[0]===255&&b[1]===216&&b[2]===255&&b[b.length-2]===255&&b[b.length-1]===217;}
let bytes;try{bytes=await readFile(file(imagePath));if(!validJPEG(bytes))throw Error('Локальный файл не является допустимым JPEG. Замените его оригиналом.')}catch(e){if(e.code!=='ENOENT')throw e;console.log('Скачиваем портрет Кипренского с Wikimedia Commons...');const r=await fetch(source,{headers:{'User-Agent':'BAZA educational project/1.0 (https://github.com/iterevsky/baza-russian)'},signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Wikimedia HTTP '+r.status+'; скачайте оригинал вручную: '+source);bytes=Buffer.from(await r.arrayBuffer());if(!validJPEG(bytes))throw Error('Источник не вернул допустимый JPEG.');}
await mkdir(file('icons/'),{recursive:true});await writeFile(file(imagePath),bytes);await writeFile(file('src/core/home.js'),home);await writeFile(file('scripts/serve.mjs'),serve);
const note='О. А. Кипренский. Портрет А. С. Пушкина, 1827. Государственная Третьяковская галерея.\nИсточник: https://commons.wikimedia.org/wiki/File:Kiprensky_Pushkin.jpg\nWikimedia Commons: Public Domain Mark 1.0.\nЛокальная копия для автономного чтения.\n';await mkdir(file('docs/'),{recursive:true});await writeFile(file('docs/PORTRAIT_SOURCE.md'),note);
execFileSync(process.execPath,['scripts/build-pwa.mjs'],{cwd:fileURLToPath(root),stdio:'inherit'});
console.log('Портрет подключён, автономный пакет пересобран. Запустите npm.cmd test и строгий аудит перед коммитом.');
