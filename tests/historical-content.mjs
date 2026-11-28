import {readFile} from 'node:fs/promises';
async function snapshot(path,versions){
 if(!/^content\/(lessons|modules)\/[a-z0-9-]+\.json$/.test(path))throw Error('Unexpected historical path '+path);
 for(const v of versions){try{return await readFile(new URL('./fixtures/'+v+'/'+path,import.meta.url))}catch(e){if(e.code!=='ENOENT')throw e;}}
 return readFile(new URL('../'+path,import.meta.url));
}
export const historicalContent=path=>snapshot(path,['v035','v036','v037','v038','v039','v040','v041','v042','v043','v045','v047','v049','v11']);
export const content037=path=>snapshot(path,['v037','v038','v039','v040','v041','v042','v043','v045','v047','v049','v11']);
export async function fetch037(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content037('content/'+p):await readFile(url,'utf8'))}}

export const content038=path=>snapshot(path,['v038','v039','v040','v041','v042','v043','v045','v047','v049','v11']);
export async function fetch038(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content038('content/'+p):await readFile(url,'utf8'))}}

export const content039=path=>snapshot(path,['v039','v040','v041','v042','v043','v045','v047','v049','v11']);
export async function fetch039(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content039('content/'+p):await readFile(url,'utf8'))}}

export const content040=path=>snapshot(path,['v040','v041','v042','v043','v045','v047','v049','v11']);
export async function fetch040(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content040('content/'+p):await readFile(url,'utf8'))}}

export const content041=path=>snapshot(path,['v041','v042','v043','v045','v047','v049','v11']);
export async function fetch041(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content041('content/'+p):await readFile(url,'utf8'))}}

export const content042=path=>snapshot(path,['v042','v043','v045','v047','v049','v11']);
export async function fetch042(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content042('content/'+p):await readFile(url,'utf8'))}}
export const content043=path=>snapshot(path,['v043','v045','v047','v049','v11']);
export async function fetch043(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content043('content/'+p):await readFile(url,'utf8'))}}

export const content045=path=>snapshot(path,['v045','v047','v049','v11']);
export async function fetch045(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content045('content/'+p):await readFile(url,'utf8'))}}

export const content047=path=>snapshot(path,['v047','v049','v11']);
export async function fetch047(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content047('content/'+p):await readFile(url,'utf8'))}}

export const content049=path=>snapshot(path,['v049','v11']);
export async function fetch049(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content049('content/'+p):await readFile(url,'utf8'))}}

export const content11=path=>snapshot(path,['v11']);
export async function fetch11(url){const p=String(url).split('/content/').at(-1);return {ok:true,json:async()=>JSON.parse(/^(lessons|modules)\//.test(p)?await content11('content/'+p):await readFile(url,'utf8'))}}
