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
const fetcher=async u=>({ok:true,json:async()=>JSON.parse(await readFile(u,'utf8'))});
const c=await loadCourse(fetcher),index=await loadCourseIndex(fetcher);
const revised=c.modules.filter(m=>m.variants.some(v=>v.id.includes('.module-exam.r37-')));
const oldLessons=new Map(),oldModules=new Map();
const oldBytes=async p=>{try{return await readFile(new URL('./fixtures/v036/'+p,import.meta.url))}catch(e){if(e.code!=='ENOENT')throw e;return readFile(new URL('../'+p,import.meta.url))}};
for(const m of revised){const mr=c.catalog.modules.find(r=>r.id===m.id);oldModules.set(m.id,JSON.parse(await oldBytes('content/'+mr.file)));for(const id of m.lessonIds){const lr=c.catalog.sections.flatMap(s=>s.lessons).find(r=>r.id===id);oldLessons.set(id,JSON.parse(await oldBytes('content/'+lr.file)))}}
const old={...c,lessons:c.lessons.map(l=>oldLessons.get(l.id)??l),modules:c.modules.map(m=>oldModules.get(m.id)??m)};
const norm=s=>s.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru');
test('15 revised modules contain two new independent eight-question variants, 27 written practice items and individualized theory',()=>{
 assert.equal(revised.length,15);assert.equal(oldLessons.size,27);assert.equal(revised.filter(m=>m.moduleNumber.startsWith('05.')).length,12);assert.deepEqual(revised.filter(m=>m.moduleNumber.startsWith('07.')).map(m=>m.moduleNumber).sort(),['07.12','07.13','07.14']);
 const seen=new Set([...old.lessons.flatMap(l=>[...l.practice,...[l.exam,...(l.examVariants??[])].flatMap(v=>v.questions)]),...old.modules.flatMap(m=>m.variants.flatMap(v=>v.questions))].map(q=>q.raw??q.parts?.join(' ')??q.prompt).filter(Boolean).map(norm));let exams=0,practice=0,aliases=0;
 const record=q=>{assert.ok(!seen.has(norm(q.raw)),q.raw);seen.add(norm(q.raw))};
 for(const m of revised){const vs=currentModuleVariants(m);assert.equal(vs.length,2);assert.equal(m.variants.filter(v=>v.archived).length,2);for(const v of vs){assert.equal(v.questions.length,8);for(const l of m.lessonIds)assert.equal(v.questions.filter(q=>q.lessonId===l).length,8/m.lessonIds.length);for(const q of v.questions){record(q);assert.ok(validExamQuestion(q));assert.deepEqual(gradeExam([q],[q.answer]),[true]);assert.deepEqual(gradeExam([q],['неверный ответ!']),[false]);for(const a of q.accepted??[]){assert.deepEqual(gradeExam([q],[a]),[true]);aliases++}exams++}}
  for(const id of m.lessonIds){const l=c.lessons.find(l=>l.id===id);assert.ok(l.theory.some(b=>b.id==='revision-037'));assert.equal(l.goals.length,3);for(const q of l.practice.filter(p=>p.id.includes('.practice.r37.'))){record(q);for(const a of q.accepted)assert.ok(gradePractice(q,[],a));assert.ok(!gradePractice(q,[],'неверный ответ!'));practice++}}}
 assert.equal(exams,240);assert.equal(practice,27);assert.ok(aliases>0);
});
test('v0.36 source hashes retained, old lesson keys and archived module banks preserved byte-for-byte as objects',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/audits/v0.36.0-content-sha256.json',import.meta.url),'utf8'));
 for(const [p,h] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(await oldBytes(p)).digest('hex'),h,p);
 assert.deepEqual(c.catalog.lessonOrder,manifest.lessonOrder);
 for(const [id,before] of oldLessons){const now=c.lessons.find(l=>l.id===id);assert.equal(now.version,before.version);assert.deepEqual(now.practice.slice(0,before.practice.length),before.practice);for(const k of ['exam','examVariants','cards','editorialCases','deepDive'])assert.deepEqual(now[k],before[k],id+' '+k);assert.deepEqual(now.theory.slice(0,before.theory.length),before.theory)}
 for(const [id,before] of oldModules){const now=c.modules.find(m=>m.id===id);assert.deepEqual(now.variants.slice(0,before.variants.length),before.variants.map(v=>({...v,archived:true})));assert.deepEqual(now.lessonIds,before.lessonIds)}
});
test('all 15 old completed exams and drafts import into runtime index; new attempts cover current banks and preserve old records',()=>{
 const s=normalize(null,old);for(const m of oldModules.values()){const d=s.byModule[m.id];beginModule(m,d,90).answers=m.variants[0].questions.map(q=>q.answer);finishModule(m,d);beginModule(m,d,80).answers[0]=m.variants[1].questions[0].answer;for(const id of m.lessonIds){const l=oldLessons.get(id),q=l.practice[0];s.byLesson[id].note='Исторический конспект';s.byLesson[id].attempts.push({questionId:q.id,selected:q.expected??[],answerText:q.accepted?.[0]??'',correct:true,contentVersion:l.version,lessonId:id,q:0})}}
 const updated=parseImport(JSON.stringify(s),index);for(const m of revised){const d=updated.byModule[m.id],before=s.byModule[m.id];assert.deepEqual(d,before);for(const id of m.lessonIds)assert.deepEqual(updated.byLesson[id],s.byLesson[id]);assert.match(moduleView({m,course:c,state:updated,esc:String,mode:'result'}),/не подтверждает освоение по новым требованиям/);assert.equal(beginModule(m,d,100).examId,before.draft.examId);d.draft.answers=m.variants[1].questions.map(q=>q.answer);finishModule(m,d);for(const v of currentModuleVariants(m)){assert.equal(nextModuleVariant(m,d).id,v.id);beginModule(m,d,100).answers=v.questions.map(q=>q.answer);assert.equal(finishModule(m,d).score,8)}assert.equal(nextModuleVariant(m,d),undefined)}assert.deepEqual(parseImport(JSON.stringify(updated),c),updated);
});
