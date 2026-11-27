import {readFile} from 'node:fs/promises';
async function snapshot(path,versions){
 if(!/^content\/(lessons|modules)\/[a-z0-9-]+\.json$/.test(path))throw Error('Unexpected historical path '+path);
 for(const v of versions){try{return await readFile(new URL('./fixtures/'+v+'/'+path,import.meta.url))}catch(e){if(e.code!=='ENOENT')throw e;}}
 return readFile(new URL('../'+path,import.meta.url));
}
export const historicalContent=path=>snapshot(path,['v035','v036','v037','v038']);
export const content037=path=>snapshot(path,['v037','v038']);
export async function fetch037(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content037('content/'+p):await readFile(url,'utf8'))}}

export const content038=path=>snapshot(path,['v038']);
export async function fetch038(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content038('content/'+p):await readFile(url,'utf8'))}}
