import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCourse,loadCourseIndex} from '../src/core/content.js';
import {ready,gradePractice,validAttempt} from '../src/core/practice.js';
import {gradeExam} from '../src/core/assessment.js';
import {variants} from '../src/core/exams.js';
import {normalize,parseImport} from '../src/core/progress.js';
import {createChoiceSession} from '../src/core/choice-order.js';
const fetcher=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
const c=await loadCourse(fetcher);
test('all 3767 assessment keys are executable; blank/invalid selections and contradictory records rejected',()=>{
 let count=0;
 for(const l of c.lessons){for(const q of l.practice){const sel=q.expected??[],txt=q.accepted?.[0]??'';assert.ok(gradePractice(q,sel,txt),q.id);assert.ok(validAttempt(q,{selected:sel,answerText:txt,correct:true}),q.id);assert.ok(!validAttempt(q,{selected:sel,answerText:txt,correct:false}),q.id);if(q.type!=='comma-positions')assert.ok(!ready(q,[],''),q.id);if(q.expected)assert.ok(!ready(q,[99999]),q.id);count++}}
 for(const v of [...c.lessons.flatMap(variants),...c.modules.flatMap(m=>m.variants)]){for(const q of v.questions){assert.deepEqual(gradeExam([q],[q.answer]),[true],q.id);assert.deepEqual(gradeExam([q],['']),[false],q.id);count++}}
 assert.equal(count,3767);
});
test('every full lesson equals its lazy index and all 107 planned module numbers exist',async()=>{const index=await loadCourseIndex(fetcher);for(const l of c.lessons)assert.deepEqual(await index.loadLesson(l.id),l);assert.deepEqual(c.catalog.sections.flatMap(s=>s.plan.map(p=>p.number)).sort(),c.modules.map(m=>m.moduleNumber).sort())});
test('balanced display per full block keeps canonical answer indices and is stable within a session',()=>{let seed=42;const random=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);for(const l of c.lessons){const s=createChoiceSession(random);s.plan(l.practice);const groups=new Map();for(const q of l.practice.filter(q=>q.type==='single-choice')){const order=s.order(q);assert.deepEqual([...order].sort((a,b)=>a-b),q.options.map((_,i)=>i));assert.deepEqual(s.order(q),order);const n=order.length;if(!groups.has(n))groups.set(n,[]);groups.get(n).push(order.indexOf(q.expected[0]));assert.ok(gradePractice(q,[order[order.indexOf(q.expected[0])]]));}for(const [n,positions] of groups){const counts=Array(n).fill(0);for(const i of positions)counts[i]++;assert.ok(Math.max(...counts)-Math.min(...counts)<=1,l.id)}}});
test('forged or malformed history cannot replace valid progress; original valid records still round-trip',()=>{const d=normalize(null,c);const l=c.lessons.find(l=>l.practice.some(q=>q.type==='single-choice')),q=l.practice.find(q=>q.type==='single-choice');d.byLesson[l.id].attempts.push({questionId:q.id,selected:q.expected,correct:true});d.byLesson[l.id].note='Сохранить';assert.equal(parseImport(JSON.stringify(d),c).byLesson[l.id].note,'Сохранить');for(const mutate of [x=>x.byLesson[l.id].attempts[0].correct=false,x=>x.byLesson[l.id].attempts[0].selected=[0,0],x=>x.byLesson[l.id].note={},x=>x.byLesson[l.id]=null]){const corrupt=structuredClone(d);mutate(corrupt);assert.throws(()=>parseImport(JSON.stringify(corrupt),c));}assert.equal(d.byLesson[l.id].note,'Сохранить')});
import {lesson as lessonView} from '../src/core/lesson-view.js';
test('all 139 lessons expose their advanced theory through a single usable disclosure',()=>{let formerlyHidden=0;for(const l of c.lessons){if(!l.theory.some(b=>b.type==='deep'))formerlyHidden++;const args={material:l,tipCard:()=>'',tips:c.tips,esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')};const closed=lessonView({...args,deep:false}),open=lessonView({...args,deep:true});assert.equal((closed.match(/data-deep aria-expanded="false"/g)??[]).length,1,l.id);assert.equal((open.match(/class="deep-topic"/g)??[]).length,l.deepDive.length,l.id)}assert.equal(formerlyHidden,49)});
