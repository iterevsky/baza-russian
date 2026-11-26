import {KEY} from './storage.js';
import {normalize,parseImport} from './progress.js';
export const DB_NAME='baza-russian';
const STORE='progress', RECORD='current', MARKER=KEY+'-indexeddb';
function openDB(factory){return new Promise((resolve,reject)=>{let req,done=false;const fail=e=>{if(!done){done=true;reject(e)}};try{req=factory.open(DB_NAME,1)}catch(e){fail(e);return}req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};req.onerror=()=>fail(req.error||Error('Не удалось открыть IndexedDB'));req.onblocked=()=>fail(Error('Закройте другие вкладки приложения и обновите страницу.'));req.onsuccess=()=>{if(done){req.result.close();return}done=true;resolve(req.result)}})}
function read(db){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(RECORD);tx.oncomplete=()=>resolve(req.result);tx.onabort=tx.onerror=()=>reject(tx.error||Error('Ошибка чтения IndexedDB'));})}
// Compare-and-swap in a single transaction: another tab cannot silently overwrite progress.
function write(db,snapshot,expected){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),req=store.get(RECORD);let conflict=false;const revision=expected+1;req.onsuccess=()=>{if((req.result?.revision??0)!==expected){conflict=true;tx.abort();return}store.put({revision,state:snapshot},RECORD)};tx.oncomplete=()=>resolve(revision);tx.onabort=tx.onerror=()=>reject(Error(conflict?'Прогресс изменён в другой вкладке. Экспортируйте текущие данные и обновите страницу.':tx.error?.message||'Не удалось записать прогресс в IndexedDB'));})}
function legacyRead(storage,course){const value=storage?.getItem(KEY);if(value==null)return normalize(null,course);const raw=JSON.parse(value);if(raw&&typeof raw==='object'&&!Array.isArray(raw)&&raw.schema==null)raw.schema=1;return parseImport(JSON.stringify(raw),course)}
const LOCK=KEY+'-write';
export async function createProgressStore(options){
 const {locks}=options;
 return locks?.request?locks.request(LOCK,()=>openProgressStore(options)):openProgressStore(options);
}
async function openProgressStore({factory,storage,course,locks}){
 let db,initial,revision=0,mode='indexeddb',warning='';
 let marker=false;try{marker=storage?.getItem(MARKER)==='1'}catch{}
 try{if(!factory)throw Error('IndexedDB недоступна');db=await openDB(factory)}catch(e){if(marker)throw Error('Основное хранилище недоступно. Старый резерв не будет использован вместо новых данных. '+e.message);mode='local';warning='IndexedDB недоступна: используется localStorage. '+e.message;initial=legacyRead(storage,course);if(!locks?.request)warning+=' Запись заблокирована: нет Web Locks. Экспортируйте изменения перед выходом.'}
 if(db){try{const record=await read(db);if(record){if(!Number.isSafeInteger(record.revision)||record.revision<1)throw Error('Повреждена версия записи.');initial=parseImport(JSON.stringify(record.state),course);revision=record.revision}else{if(marker)throw Error('Основная запись отсутствует. Восстановите данные из экспорта после проверки хранилища.');initial=legacyRead(storage,course);try{revision=await write(db,initial,0)}catch(e){const current=await read(db);if(!current)throw e;initial=parseImport(JSON.stringify(current.state),course);revision=current.revision}}try{storage?.setItem(MARKER,'1')}catch{} }catch(e){db.close();throw e}}
 let localExpected=mode==='local'?storage?.getItem(KEY):null;
 let tail=Promise.resolve(),pending=0,error=null;
 const api={mode,warning,initial,get pending(){return pending},get error(){return error},save(data){const snapshot=structuredClone(data);pending++;const task=tail.then(async()=>{if(mode==='indexeddb')revision=await write(db,snapshot,revision);else{if(!storage||!locks?.request)throw Error('Без Web Locks резервная запись небезопасна. Экспортируйте изменения.');await locks.request(LOCK,()=>{if(storage.getItem(MARKER)==='1'||storage.getItem(KEY)!==localExpected)throw Error('Прогресс изменён в другой вкладке. Экспортируйте изменения и обновите страницу.');const next=JSON.stringify(snapshot);storage.setItem(KEY,next);localExpected=next})}error=null}).catch(e=>{error=e;throw e}).finally(()=>pending--);tail=task.catch(()=>{});return task},flush(){return tail},close(){db?.close()}};
 if(db)db.onversionchange=()=>db.close();return api;
}
