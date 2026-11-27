import {fetch037} from './historical-content.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCourse,loadCourseIndex} from '../src/core/content.js';
import {gradeExam,examSkeleton,norm} from '../src/core/assessment.js';
import {gradePractice,answerKey} from '../src/core/practice.js';
import {variants} from '../src/core/exams.js';
import {normalize,parseImport} from '../src/core/progress.js';
import {beginModule,finishModule} from '../src/core/modules.js';
const fetcher=async u=>({ok:true,json:async()=>JSON.parse(await readFile(u,'utf8'))});
const c=await loadCourse(fetch037),oldIds=new Set(c.catalog.lessonOrder.slice(0,49)),prior={...c,lessons:c.lessons.filter(l=>oldIds.has(l.id)),modules:c.modules.filter(m=>m.lessonIds.every(id=>oldIds.has(id)))},added=c.lessons.slice(49,55),mods=c.modules.filter(m=>m.lessonIds.every(id=>added.some(l=>l.id===id)));
const canon=s=>norm(s.replace(/\[знак\]/g,'').replace(/[\[\],:;—]/g,'')).toLowerCase();
const rawPractice=q=>q.parts?q.parts.join(' '):q.prompt?.split('. Назовите знак')[0]?.split('. Назовите традиционный')[0];
test('v0.26 six new lessons and three independent banks; punctuation keys and prompt uniqueness',()=>{
 assert.equal(added.length,6);assert.deepEqual([...new Set(added.map(l=>l.moduleNumber))],['07.09','07.10','07.11']);assert.equal(mods.length,3);
 const seen=new Set(prior.lessons.flatMap(l=>variants(l).flatMap(v=>v.questions.map(q=>canon(q.raw)))));for(const m of prior.modules)for(const v of m.variants)for(const q of v.questions)seen.add(canon(q.raw));for(const l of prior.lessons)for(const q of l.practice)if(q.parts)seen.add(canon(q.parts.join(' ')));
 const unique=s=>{assert.ok(!seen.has(canon(s)),s);seen.add(canon(s))};
 const check=q=>{unique(q.raw);assert.deepEqual(gradeExam([q],[q.answer]),[true]);assert.deepEqual(gradeExam([q],['']),[false]);if(q.type==='exact-text')assert.equal(examSkeleton(q,q.answer),norm(q.raw));else assert.ok(q.instruction.includes(q.answer));};
 for(const l of added){assert.equal(l.practice.length,6);assert.equal(l.cards.length,3);assert.equal(l.editorialCases.length,1);assert.equal(l.status,'draft');for(const q of l.practice){unique(rawPractice(q));assert.ok(gradePractice(q,q.expected));assert.ok(answerKey(q));}for(const v of variants(l)){assert.equal(v.questions.length,6);for(const q of v.questions)check(q);}}
 for(const m of mods){assert.equal(m.variants.length,2);for(const v of m.variants){assert.equal(v.questions.length,4);for(const q of v.questions)check(q);for(const id of m.lessonIds)assert.equal(v.questions.filter(q=>q.lessonId===id).length,2)}}
 assert.equal(added.flatMap(l=>l.practice).filter(q=>q.type==='comma-positions').length,24);
});
test('v0.26 import retains v0.25 notes and finished and unfinished module exams',async()=>{
 assert.equal(prior.lessons.length,49);assert.equal(prior.modules.length,20);const old=normalize(null,prior);for(const l of prior.lessons){old.byLesson[l.id].note='Конспект '+l.id;old.byLesson[l.id].read=true;}
 const m=prior.modules.find(x=>x.moduleNumber==='07.07'),d=old.byModule[m.id];beginModule(m,d,85);d.draft.answers=m.variants[0].questions.map(q=>q.answer);finishModule(m,d);beginModule(m,d,95);d.draft.answers[0]=m.variants[1].questions[0].answer;
 const indexed=await loadCourseIndex(fetcher),now=parseImport(JSON.stringify(old),indexed);for(const l of prior.lessons)assert.deepEqual(now.byLesson[l.id],old.byLesson[l.id]);for(const m of prior.modules)assert.deepEqual(now.byModule[m.id],old.byModule[m.id]);for(const l of added)assert.equal(now.byLesson[l.id].read,false);for(const m of mods)assert.deepEqual(now.byModule[m.id],{exams:[],draft:null});
});
