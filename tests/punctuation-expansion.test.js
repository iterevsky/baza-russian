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
const c=await loadCourse(fetcher),ids=new Set(c.catalog.lessonOrder.slice(0,37)),prior={...c,lessons:c.lessons.filter(l=>ids.has(l.id)),modules:c.modules.filter(m=>m.lessonIds.every(id=>ids.has(id)))},added=c.lessons.slice(37,43),mods=c.modules.filter(m=>m.lessonIds.every(id=>added.some(l=>l.id===id)));
test('v0.24 adds six punctuation lessons, distinct exam prompts, and comma-position exercises',()=>{
 assert.equal(added.length,6);assert.deepEqual([...new Set(added.map(l=>l.moduleNumber))],['07.01','07.02','07.04']);assert.equal(mods.length,3);
 const seen=new Set(prior.lessons.flatMap(l=>variants(l).flatMap(v=>v.questions.map(q=>norm(q.raw)))));for(const m of prior.modules)for(const v of m.variants)for(const q of v.questions)seen.add(norm(q.raw));
 const unique=s=>{assert.ok(!seen.has(norm(s)),s);seen.add(norm(s))};
 for(const l of added){assert.equal(l.practice.length,6);assert.equal(l.cards.length,3);assert.equal(l.status,'draft');for(const q of l.practice){assert.ok(gradePractice(q,q.expected));if(q.type==='comma-positions')unique(q.parts.join(' '));else unique(q.prompt.slice(0,q.prompt.lastIndexOf(' '+(l.exam.questions[0].instruction))))}for(const v of variants(l))for(const q of v.questions){unique(q.raw);assert.deepEqual(gradeExam([q],[q.answer]),[true]);assert.deepEqual(gradeExam([q],['']),[false]);}}
 for(const m of mods){assert.equal(m.variants.length,2);for(const v of m.variants){assert.equal(v.questions.length,4);for(const id of m.lessonIds)assert.equal(v.questions.filter(q=>q.lessonId===id).length,2);for(const q of v.questions)unique(q.raw);}}
 assert.equal(added.flatMap(l=>l.practice).filter(q=>q.type==='comma-positions').length,6);
});
test('v0.24 import retains previous lesson progress and completed and unfinished module exams',async()=>{
 assert.equal(prior.lessons.length,37);assert.equal(prior.modules.length,14);const old=normalize(null,prior);for(const l of prior.lessons){old.byLesson[l.id].note='Конспект '+l.id;old.byLesson[l.id].read=true;}
 const m=prior.modules.find(x=>x.moduleNumber==='05.12'),d=old.byModule[m.id];beginModule(m,d,85);d.draft.answers=m.variants[0].questions.map(q=>q.answer);finishModule(m,d);beginModule(m,d,95);d.draft.answers[0]=m.variants[1].questions[0].answer;
 const indexed=await loadCourseIndex(fetcher),now=parseImport(JSON.stringify(old),indexed);for(const l of prior.lessons)assert.deepEqual(now.byLesson[l.id],old.byLesson[l.id]);for(const m of prior.modules)assert.deepEqual(now.byModule[m.id],old.byModule[m.id]);for(const l of added)assert.equal(now.byLesson[l.id].read,false);for(const m of mods)assert.deepEqual(now.byModule[m.id],{exams:[],draft:null});
});
