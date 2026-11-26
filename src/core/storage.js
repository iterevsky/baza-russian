export const KEY = 'baza-russian-design-01';
export const defaults = () => ({theme:'light',attempts:[],cards:[],note:'',read:false,favorites:[],exams:[]});
export function sanitize(raw) {
 const d=defaults(); if(!raw || typeof raw!=='object') return d;
 d.theme=raw.theme==='dark'?'dark':'light'; d.note=typeof raw.note==='string'?raw.note:''; d.read=raw.read===true;
 d.attempts=Array.isArray(raw.attempts)?raw.attempts.filter(x=>x && Number.isInteger(x.q) && typeof x.correct==='boolean' && Array.isArray(x.selected)):[];
 d.cards=Array.isArray(raw.cards)?raw.cards.filter(x=>x && Number.isInteger(x.card) && ['again','known'].includes(x.rating)):[];
 d.favorites=Array.isArray(raw.favorites)?[...new Set(raw.favorites.filter(x=>typeof x==='string'))]:[];
 d.exams=Array.isArray(raw.exams)?raw.exams.filter(x=>x && Number.isInteger(x.score) && x.score>=0 && x.score<=6 && Array.isArray(x.answers) && x.answers.length===6 && x.answers.every(a=>typeof a==='string')):[];
 return d;
}
export function load(storage){try{return sanitize(JSON.parse(storage.getItem(KEY)||'null'))}catch{return defaults()}}
export function persist(storage,data){try{storage.setItem(KEY,JSON.stringify(data));return true}catch{return false}}
export function exportProgress(data){return JSON.stringify({schema:1,...sanitize(data)},null,2)}
