import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadCourse,loadCourseIndex} from '../src/core/content.js';
import {currentModuleVariants,beginModule,finishModule,nextModuleVariant} from '../src/core/modules.js';
import {normalize,parseImport} from '../src/core/progress.js';
import {gradeExam,validExamQuestion} from '../src/core/assessment.js';
import {gradePractice} from '../src/core/practice.js';
import {variants} from '../src/core/exams.js';
import {fetch039,content039} from './historical-content.mjs';
const fetcher=async u=>({ok:true,json:async()=>JSON.parse(await readFile(u,'utf8'))});
const c=await loadCourse(fetcher),old=await loadCourse(fetch039),index=await loadCourseIndex(fetcher);
const revised=c.modules.filter(m=>m.variants.some(v=>v.id.includes('.module-exam.r40-')));
const oldL=new Map(old.lessons.map(l=>[l.id,l])),oldM=new Map(old.modules.map(m=>[m.id,m]));
const norm=s=>s.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru');
test('r40 10 modules, 160 distinct new exam prompts, 10 practice questions, 8 questions per variant',()=>{
 assert.deepEqual(revised.map(m=>m.moduleNumber).sort(),Array.from({length:10},(_,i)=>'04.'+String(i+1).padStart(2,'0')));
 const seen=new Set([...old.lessons.flatMap(l=>[...l.practice,...variants(l).flatMap(v=>v.questions)]),...old.modules.flatMap(m=>m.variants.flatMap(v=>v.questions))].map(q=>q.raw??q.parts?.join(' ')??q.prompt).filter(Boolean).map(norm));let exams=0,practice=0;
 const record=q=>{assert.ok(!seen.has(norm(q.raw)),q.raw);seen.add(norm(q.raw));};
 for(const m of revised){const vs=currentModuleVariants(m),prior=oldM.get(m.id);assert.equal(vs.length,2);assert.ok(m.variants.slice(0,prior.variants.length).every(v=>v.archived));for(const v of vs){assert.equal(v.questions.length,8);for(const q of v.questions){record(q);assert.ok(validExamQuestion(q));assert.equal(q.lessonId,m.lessonIds[0]);assert.deepEqual(gradeExam([q],[q.answer]),[true]);for(const a of q.accepted??[])assert.deepEqual(gradeExam([q],[a]),[true],q.id);assert.deepEqual(gradeExam([q],['']),[false]);assert.deepEqual(gradeExam([q],['неверный ответ!']),[false]);exams++}}const l=c.lessons.find(x=>x.id===m.lessonIds[0]);assert.equal(l.goals.length,3);assert.ok(l.theory.some(b=>b.id==='revision-040'));const q=l.practice.find(q=>q.id.includes('.practice.r40.'));record(q);assert.ok(gradePractice(q,[],q.accepted[0]));assert.ok(!gradePractice(q,[],'неверный ответ!'));practice++}
 assert.equal(exams,160);assert.equal(practice,10);
});
test('r39 snapshot matches 246 hashes; every old graded item retained unchanged in r40',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/audits/v0.39.0-content-sha256.json',import.meta.url),'utf8'));assert.equal(Object.keys(manifest.files).length,246);for(const [p,h] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(await content039(p)).digest('hex'),h,p);assert.deepEqual(c.catalog.lessonOrder,manifest.lessonOrder);
 for(const l of c.lessons){const before=oldL.get(l.id);assert.equal(l.version,before.version);assert.deepEqual(l.practice.slice(0,before.practice.length),before.practice);for(const k of ['exam','examVariants','cards','editorialCases','deepDive'])assert.deepEqual(l[k],before[k],l.id+' '+k);assert.deepEqual(l.theory.slice(0,before.theory.length),before.theory)}
 for(const m of c.modules){const before=oldM.get(m.id);assert.deepEqual(m.lessonIds,before.lessonIds);assert.deepEqual(m.variants.slice(0,before.variants.length),revised.includes(m)?before.variants.map(v=>({...v,archived:true})):before.variants)}
});
test('old results and drafts of all 10 revised modules import into current lazy index; both new attempts possible',()=>{
 const state=normalize(null,old);
 for(const m of revised){const before=oldM.get(m.id),d=state.byModule[m.id],vs=currentModuleVariants(before);beginModule(before,d,90).answers=vs[0].questions.map(q=>q.answer);finishModule(before,d);beginModule(before,d,80).answers[0]=vs[1].questions[0].answer;for(const id of m.lessonIds){const l=oldL.get(id),q=l.practice[0];state.byLesson[id].note='Исторический конспект';state.byLesson[id].attempts.push({questionId:q.id,selected:q.expected??[],answerText:q.accepted?.[0]??'',correct:true,contentVersion:l.version,lessonId:id,q:0})}}
 const next=parseImport(JSON.stringify(state),index);for(const m of revised){const d=next.byModule[m.id],prior=state.byModule[m.id];assert.deepEqual(d,prior);for(const id of m.lessonIds)assert.deepEqual(next.byLesson[id],state.byLesson[id]);assert.equal(beginModule(m,d,100).examId,prior.draft.examId);d.draft.answers=m.variants.find(v=>v.id===prior.draft.examId).questions.map(q=>q.answer);finishModule(m,d);for(const v of currentModuleVariants(m)){assert.equal(nextModuleVariant(m,d).id,v.id);beginModule(m,d,100).answers=v.questions.map(q=>q.answer);assert.equal(finishModule(m,d).score,v.questions.length)}assert.equal(nextModuleVariant(m,d),undefined)}assert.deepEqual(parseImport(JSON.stringify(next),c),next);
});
