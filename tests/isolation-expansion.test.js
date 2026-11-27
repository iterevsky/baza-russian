import {fetch037} from './historical-content.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCourse,loadCourseIndex} from '../src/core/content.js';
import {gradeExam,norm} from '../src/core/assessment.js';
import {gradePractice} from '../src/core/practice.js';
import {variants} from '../src/core/exams.js';
import {normalize,parseImport} from '../src/core/progress.js';
import {beginModule,finishModule} from '../src/core/modules.js';
const fetcher=async u=>({ok:true,json:async()=>JSON.parse(await readFile(u,'utf8'))});
const c=await loadCourse(fetch037),ids=new Set(c.catalog.lessonOrder.slice(0,43)),prior={...c,lessons:c.lessons.filter(l=>ids.has(l.id)),modules:c.modules.filter(m=>m.lessonIds.every(id=>ids.has(id)))},added=c.lessons.slice(43,49),mods=c.modules.filter(m=>m.lessonIds.every(id=>added.some(l=>l.id===id)));
const canon=s=>norm(s.replace(/[\[\],]/g,''));
test('v0.25 adds six marked-construction lessons with distinct control prompts',()=>{
 assert.equal(added.length,6);assert.deepEqual([...new Set(added.map(l=>l.moduleNumber))],['07.05','07.06','07.07']);assert.equal(mods.length,3);
 const seen=new Set(prior.lessons.flatMap(l=>variants(l).flatMap(v=>v.questions.map(q=>canon(q.raw)))));for(const m of prior.modules)for(const v of m.variants)for(const q of v.questions)seen.add(canon(q.raw));
 const unique=s=>{assert.ok(!seen.has(canon(s)),s);seen.add(canon(s))};
 for(const l of added){assert.equal(l.practice.length,6);assert.equal(l.cards.length,3);assert.equal(l.editorialCases.length,1);assert.equal(l.status,'draft');for(const q of l.practice){assert.ok(gradePractice(q,q.expected));if(q.type==='comma-positions')unique(q.parts.join(' '));else unique(q.prompt.slice(0,q.prompt.indexOf('. ')+1))}for(const v of variants(l)){assert.equal(v.questions.length,6);assert.equal(new Set(v.questions.map(q=>q.answer)).size,2);for(const q of v.questions){unique(q.raw);assert.match(q.raw,/\[[^\]]+\]/);assert.ok(q.instruction.includes(q.answer));assert.deepEqual(gradeExam([q],[q.answer]),[true]);assert.deepEqual(gradeExam([q],['']),[false]);}}}
 for(const m of mods){assert.equal(m.variants.length,2);for(const v of m.variants){assert.equal(v.questions.length,4);for(const id of m.lessonIds){const qq=v.questions.filter(q=>q.lessonId===id);assert.equal(qq.length,2);assert.equal(new Set(qq.map(q=>q.answer)).size,2)}for(const q of v.questions)unique(q.raw);}}
 assert.equal(added.flatMap(l=>l.practice).filter(q=>q.type==='comma-positions').length,15);
});
test('v0.25 import retains v0.24 notes, completed and unfinished module exams',async()=>{
 assert.equal(prior.lessons.length,43);assert.equal(prior.modules.length,17);const old=normalize(null,prior);for(const l of prior.lessons){old.byLesson[l.id].note='Конспект '+l.id;old.byLesson[l.id].read=true;}
 const m=prior.modules.find(x=>x.moduleNumber==='07.04'),d=old.byModule[m.id];beginModule(m,d,85);d.draft.answers=m.variants[0].questions.map(q=>q.answer);finishModule(m,d);beginModule(m,d,95);d.draft.answers[0]=m.variants[1].questions[0].answer;
 const indexed=await loadCourseIndex(fetcher),now=parseImport(JSON.stringify(old),indexed);for(const l of prior.lessons)assert.deepEqual(now.byLesson[l.id],old.byLesson[l.id]);for(const m of prior.modules)assert.deepEqual(now.byModule[m.id],old.byModule[m.id]);for(const l of added)assert.equal(now.byLesson[l.id].read,false);for(const m of mods)assert.deepEqual(now.byModule[m.id],{exams:[],draft:null});
});
