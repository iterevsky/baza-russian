import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadCourse,loadCourseIndex} from '../src/core/content.js';
import {currentModuleVariants,beginModule,finishModule,nextModuleVariant} from '../src/core/modules.js';
import {normalize,parseImport} from '../src/core/progress.js';
import {gradeExam,validExamQuestion} from '../src/core/assessment.js';
import {gradePractice} from '../src/core/practice.js';
import {moduleView} from '../src/core/module-view.js';
import {fetch037,content037} from './historical-content.mjs';
const fetcher=async u=>({ok:true,json:async()=>JSON.parse(await readFile(u,'utf8'))});
const c=await loadCourse(fetcher),old=await loadCourse(fetch037),index=await loadCourseIndex(fetcher);
const revised=c.modules.filter(m=>m.variants.some(v=>v.id.includes('.module-exam.r38-')));
const oldL=new Map(old.lessons.map(l=>[l.id,l])),oldM=new Map(old.modules.map(m=>[m.id,m]));
const norm=s=>s.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru');
test('r38 all 11 remaining punctuation modules: 196 new distinct marked answers, 31 practice questions, full balanced coverage without reducing current exam size',()=>{
 assert.deepEqual(revised.map(m=>m.moduleNumber).sort(),Array.from({length:11},(_,i)=>'07.'+String(i+1).padStart(2,'0')));
 const seen=new Set([...old.lessons.flatMap(l=>[...l.practice,...[l.exam,...(l.examVariants??[])].flatMap(v=>v.questions)]),...old.modules.flatMap(m=>m.variants.flatMap(v=>v.questions))].map(q=>q.raw??q.parts?.join(' ')??q.prompt).filter(Boolean).map(norm));
 const record=q=>{assert.equal(q.raw.split('□').length,2,q.id);assert.ok(!seen.has(norm(q.raw)),q.raw);seen.add(norm(q.raw));};let exam=0,practice=0;
 for(const m of revised){const vs=currentModuleVariants(m),prior=oldM.get(m.id);assert.equal(vs.length,2);assert.ok(m.variants.slice(0,prior.variants.length).every(v=>v.archived));assert.ok(vs.every(v=>v.questions.length>=Math.max(8,...currentModuleVariants(prior).map(v=>v.questions.length))));for(const v of vs){assert.ok(v.id.includes('.module-exam.r38-'));for(const id of m.lessonIds)assert.equal(v.questions.filter(q=>q.lessonId===id).length,v.questionsPerLesson);for(const q of v.questions){record(q);assert.ok(validExamQuestion(q));assert.deepEqual(gradeExam([q],[q.answer]),[true]);assert.deepEqual(gradeExam([q],['']),[false]);assert.deepEqual(gradeExam([q],['неверный ответ!']),[false]);exam++}}
 for(const id of m.lessonIds){const l=c.lessons.find(l=>l.id===id);assert.equal(l.goals.length,3);assert.ok(l.theory.some(b=>b.id==='revision-038'));const q=l.practice.find(q=>q.id.includes('.practice.r38.'));record(q);assert.ok(gradePractice(q,[],q.accepted[0]));assert.ok(!gradePractice(q,[],'неверный ответ!'));practice++}}
 assert.equal(exam,196);assert.equal(practice,31);
});
test('r37 snapshot matches all 246 recorded hashes and existing graded content is unchanged in r38',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/audits/v0.37.0-content-sha256.json',import.meta.url),'utf8'));assert.equal(Object.keys(manifest.files).length,246);for(const [p,h] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(await content037(p)).digest('hex'),h,p);assert.deepEqual(c.catalog.lessonOrder,manifest.lessonOrder);
 for(const l of c.lessons){const before=oldL.get(l.id);assert.equal(l.version,before.version);assert.deepEqual(l.practice.slice(0,before.practice.length),before.practice);for(const k of ['exam','examVariants','cards','editorialCases','deepDive'])assert.deepEqual(l[k],before[k],l.id+' '+k);assert.deepEqual(l.theory.slice(0,before.theory.length),before.theory)}
 for(const m of c.modules){const before=oldM.get(m.id);assert.deepEqual(m.lessonIds,before.lessonIds);assert.deepEqual(m.variants.slice(0,before.variants.length),revised.includes(m)?before.variants.map(v=>({...v,archived:true})):before.variants)}
});
test('each of 11 revised modules imports completed old attempts and drafts, preserves notes and practice, then allows two new independent attempts',()=>{
 const state=normalize(null,old);
 for(const m of revised){const before=oldM.get(m.id),d=state.byModule[m.id],vs=currentModuleVariants(before);beginModule(before,d,90).answers=vs[0].questions.map(q=>q.answer);finishModule(before,d);beginModule(before,d,80).answers[0]=vs[1].questions[0].answer;for(const id of m.lessonIds){const l=oldL.get(id),q=l.practice[0];state.byLesson[id].note='Исторический конспект';state.byLesson[id].attempts.push({questionId:q.id,selected:q.expected??[],answerText:q.accepted?.[0]??'',correct:true,contentVersion:l.version,lessonId:id,q:0})}}
 const next=parseImport(JSON.stringify(state),index);for(const m of revised){const d=next.byModule[m.id],prior=state.byModule[m.id];assert.deepEqual(d,prior);for(const id of m.lessonIds)assert.deepEqual(next.byLesson[id],state.byLesson[id]);assert.match(moduleView({m,course:c,state:next,esc:String,mode:'result'}),/не подтверждает освоение по новым требованиям/);assert.equal(beginModule(m,d,100).examId,prior.draft.examId);d.draft.answers=m.variants.find(v=>v.id===prior.draft.examId).questions.map(q=>q.answer);finishModule(m,d);for(const v of currentModuleVariants(m)){assert.equal(nextModuleVariant(m,d).id,v.id);beginModule(m,d,100).answers=v.questions.map(q=>q.answer);assert.equal(finishModule(m,d).score,v.questions.length)}assert.equal(nextModuleVariant(m,d),undefined)}assert.deepEqual(parseImport(JSON.stringify(next),c),next);
});
