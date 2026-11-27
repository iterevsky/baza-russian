import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCourse,loadCourseIndex} from '../src/core/content.js';
import {currentModuleVariants,beginModule,finishModule,nextModuleVariant} from '../src/core/modules.js';
import {normalize,parseImport} from '../src/core/progress.js';
import {gradeExam,validExamQuestion} from '../src/core/assessment.js';
import {gradePractice} from '../src/core/practice.js';
import {moduleView} from '../src/core/module-view.js';
import {portMessage,probePort} from '../scripts/check-port.mjs';
import {createServer} from 'node:net';
import {historicalContent} from './historical-content.mjs';
const fetcher=async u=>({ok:true,json:async()=>JSON.parse(await readFile(u,'utf8'))});
const c=await loadCourse(fetcher),index=await loadCourseIndex(fetcher);
const ortho=c.modules.filter(m=>m.moduleNumber.startsWith('06.'));
const oldLessons=new Map(),oldModules=new Map();
for(const m of ortho){const mr=c.catalog.modules.find(r=>r.id===m.id);oldModules.set(m.id,JSON.parse(await historicalContent('content/'+mr.file)));for(const id of m.lessonIds){const lr=c.catalog.sections.flatMap(s=>s.lessons).find(r=>r.id===id);oldLessons.set(id,JSON.parse(await historicalContent('content/'+lr.file)))}}
const old={...c,lessons:c.lessons.map(l=>oldLessons.get(l.id)??l),modules:c.modules.map(m=>oldModules.get(m.id)??m)};
test('all 14 revised orthography modules have two independent eight-question variants and two added practice items',()=>{
 assert.equal(ortho.length,14);let exams=0,practice=0;const seen=new Set();
 for(const m of ortho){const vs=currentModuleVariants(m);assert.equal(vs.length,2);assert.equal(m.variants.filter(v=>v.archived).length,2);for(const v of vs){assert.equal(v.questions.length,8);for(const q of v.questions){assert.ok(!seen.has(q.raw),q.raw);seen.add(q.raw);assert.ok(validExamQuestion(q));assert.deepEqual(gradeExam([q],[q.answer]),[true]);assert.deepEqual(gradeExam([q],[q.answer+'!']),[false]);exams++}}
 const l=c.lessons.find(l=>l.id===m.lessonIds[0]);assert.ok(l.theory.some(b=>b.id==='revision-036'));assert.equal(l.goals.length,3);for(const p of l.practice.filter(p=>p.id.includes('.practice.r36.'))){assert.ok(!seen.has(p.raw),p.raw);seen.add(p.raw);assert.ok(gradePractice(p,[],p.accepted[0]));assert.ok(!gradePractice(p,[],p.accepted[0]+'!'));practice++}}
 assert.equal(exams,224);assert.equal(practice,28);
});
test('old graded content, identifiers and version remain exactly unchanged; archive flag only on old module variants',()=>{
 for(const [id,before] of oldLessons){const now=c.lessons.find(l=>l.id===id);assert.equal(now.version,before.version);assert.deepEqual(now.practice.slice(0,before.practice.length),before.practice);for(const key of ['exam','examVariants','cards','editorialCases','deepDive'])assert.deepEqual(now[key],before[key],id+' '+key);assert.deepEqual(now.theory.slice(0,before.theory.length),before.theory)}
 for(const [id,before] of oldModules){const now=c.modules.find(m=>m.id===id);assert.deepEqual(now.variants.slice(0,before.variants.length),before.variants.map(v=>({...v,archived:true})));assert.deepEqual(now.lessonIds,before.lessonIds)}
});
test('all 14 historical completed module results and drafts import intact; new attempts start only new banks',()=>{
 const state=normalize(null,old);for(const m of oldModules.values()){const d=state.byModule[m.id];beginModule(m,d,90).answers=m.variants[0].questions.map(q=>q.answer);finishModule(m,d);beginModule(m,d,80).answers[0]=m.variants[1].questions[0].answer;const l=oldLessons.get(m.lessonIds[0]);const q=l.practice[0];state.byLesson[l.id].attempts.push({questionId:q.id,selected:[],answerText:q.accepted[0],correct:true,contentVersion:l.version,lessonId:l.id,q:0});}
 const updated=parseImport(JSON.stringify(state),index);for(const m of ortho){const d=updated.byModule[m.id],before=state.byModule[m.id];assert.deepEqual(d,before);assert.deepEqual(updated.byLesson[m.lessonIds[0]],state.byLesson[m.lessonIds[0]]);assert.match(moduleView({m,course:c,state:updated,esc:String,mode:'result'}),/не подтверждает освоение по новым требованиям/);assert.equal(beginModule(m,d,100).examId,before.draft.examId);d.draft.answers=m.variants[1].questions.map(q=>q.answer);finishModule(m,d);for(const v of currentModuleVariants(m)){assert.equal(nextModuleVariant(m,d).id,v.id);beginModule(m,d,100).answers=v.questions.map(q=>q.answer);assert.equal(finishModule(m,d).score,8)}assert.equal(nextModuleVariant(m,d),undefined)}assert.deepEqual(parseImport(JSON.stringify(updated),c),updated);
});
test('port preflight gives actionable messages without changing port or terminating a process',()=>{const msg=portMessage({ok:false,code:'EADDRINUSE'});assert.match(msg,/8001/);assert.match(msg,/OwningProcess/);assert.match(msg,/No process was stopped/);assert.equal(portMessage({ok:true}),'');assert.match(portMessage({ok:false,code:'EACCES'}),/permissions/)});
test('port probe detects an existing listener and permits a free port on a live socket',async()=>{const server=createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});const port=server.address().port;try{assert.deepEqual(await probePort(port),{ok:false,code:'EADDRINUSE'})}finally{await new Promise(resolve=>server.close(resolve))}assert.deepEqual(await probePort(port),{ok:true})});
