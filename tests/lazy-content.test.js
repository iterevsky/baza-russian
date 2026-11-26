import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCourse,loadCourseIndex,courseIndex} from '../src/core/content.js';
import {normalize,parseImport,courseReview,cardSchedules,schedule} from '../src/core/progress.js';
const disk=async url=>JSON.parse(await readFile(url,'utf8'));
const fetcher=async url=>({ok:true,json:()=>disk(url)});
const full=await loadCourse(fetcher);
const ids=full.lessons.map(l=>l.id);
test('generated index is identical to full grading data; startup reads three files, no full lessons',async()=>{
 const calls=[];const c=await loadCourseIndex(async url=>{calls.push(url.pathname);return fetcher(url)});
 assert.equal(calls.length,3);assert.ok(calls.every(p=>!p.includes('/lessons/')&&!p.includes('/modules/')));
 assert.deepEqual(courseIndex(full),{schemaVersion:1,lessons:c.lessons,modules:c.modules});
 const d=normalize(null,full);d.byLesson[ids[0]].note='Сохранить';assert.deepEqual(parseImport(JSON.stringify(d),c),d);assert.deepEqual(courseReview(c,d),courseReview(full,d));
});
test('load only requested lesson, deduplicate pending requests and evict least recently used',async()=>{
 let count=0;const c=await loadCourseIndex(async url=>{if(url.pathname.includes('/lessons/'))count++;return fetcher(url)},{cacheSize:2});
 const a=c.loadLesson(ids[0]),b=c.loadLesson(ids[0]);assert.equal(a,b);assert.deepEqual(await a,full.lessons[0]);assert.equal(count,1);
 await c.loadLesson(ids[1]);await c.loadLesson(ids[0]);await c.loadLesson(ids[2]);assert.equal(c.peekLesson(ids[1]),undefined);assert.ok(c.peekLesson(ids[0]));await c.loadLesson(ids[1]);assert.equal(count,4);
});
test('missing or mismatched full lesson is rejected, retry works',async()=>{
 let mode='missing';const c=await loadCourseIndex(async url=>{if(!url.pathname.includes('/lessons/'))return fetcher(url);if(mode==='missing')return {ok:false,status:404};return {ok:true,json:async()=>{const l=await disk(url);if(mode==='mismatch')l.title+=' изменён';return l}}});
 await assert.rejects(c.loadLesson(ids[0]),/404/);assert.equal(c.peekLesson(ids[0]),undefined);mode='mismatch';await assert.rejects(c.loadLesson(ids[0]),/не соответствует индексу/);mode='ok';assert.deepEqual(await c.loadLesson(ids[0]),full.lessons[0]);
});
test('grouped review histories produce identical schedules for mixed and invalid records',()=>{
 const l=full.lessons[0],t=Date.UTC(2026,10,26),d={cards:[]};for(let i=0;i<30;i++)d.cards.push({cardId:l.cards[i%l.cards.length].id,at:new Date(t+i*86400000).toISOString(),rating:i%5?'known':'again'});d.cards.push({cardId:l.cards[0].id,at:'invalid',rating:'known'});assert.deepEqual(cardSchedules(l,d,t),l.cards.map((c,i)=>({i,...schedule(d.cards,c.id,t)})));
});
