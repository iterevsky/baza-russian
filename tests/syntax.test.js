import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCourse,loadCourseIndex,validateCatalog,validateLesson} from '../src/core/content.js';
import {gradeExam,validExamQuestion,norm} from '../src/core/assessment.js';
import {gradePractice} from '../src/core/practice.js';
import {normalize,parseImport} from '../src/core/progress.js';
import {beginModule,finishModule,moduleReport,validateModules} from '../src/core/modules.js';
import {moduleView} from '../src/core/module-view.js';
import {variants} from '../src/core/exams.js';
const fetcher=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
// Recreate the v0.36 syntax banks for these historical assertions; current migration is separately tested.
const live=await loadCourse(fetcher);
const c=await loadCourse(async url=>({ok:true,json:async()=>{const p=String(url).split('/content/').at(-1);if(/^(lessons|modules)\//.test(p)){try{return JSON.parse(await readFile(new URL('./fixtures/v036/content/'+p,import.meta.url),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}}return JSON.parse(await readFile(url,'utf8'));}})),fresh=c.lessons.filter(l=>l.sectionId==='ru.syntax'),mods=c.modules.filter(m=>m.id.startsWith('ru.syntax.'));
test('syntax has twenty-four lessons in twelve modules, distinct practice/control examples, and balanced variants',()=>{
 assert.equal(fresh.length,24);assert.equal(mods.length,12);const seen=new Set(c.lessons.filter(l=>l.sectionId!=='ru.syntax').flatMap(l=>variants(l).flatMap(v=>v.questions.map(q=>norm(q.raw)))));for(const m of c.modules.filter(m=>!mods.includes(m)))for(const q of m.variants.flatMap(v=>v.questions))seen.add(norm(q.raw));
 const unique=raw=>{assert.ok(!seen.has(norm(raw)),raw);seen.add(norm(raw))};
 for(const l of fresh){assert.equal(l.status,'draft');assert.equal(l.practice.length,6);for(const p of l.practice){assert.ok(gradePractice(p,p.expected));assert.ok(!gradePractice(p,[]));unique(p.prompt.slice(0,p.prompt.lastIndexOf('. ')+1))}for(const q of variants(l).flatMap(v=>v.questions)){unique(q.raw);assert.ok(validExamQuestion(q));assert.ok(gradeExam([q],[q.answer])[0])}}
 for(const m of mods){assert.equal(m.lessonIds.length,2);assert.equal(m.variants.length,2);for(const v of m.variants){assert.equal(v.questions.length,4);for(const q of v.questions)unique(q.raw);for(const id of m.lessonIds)assert.equal(v.questions.filter(q=>q.lessonId===id).length,2)}}
});
test('grammar answers ignore case and whitespace but preserve ё, word order and content; punctuation scoring unchanged',()=>{
 const q=fresh[0].exam.questions[0];assert.deepEqual(gradeExam([q],[`  ${q.answer.toUpperCase().replaceAll(' ','   ')}  `]),[true]);assert.deepEqual(gradeExam([q],[q.answer.split(' ').reverse().join(' ')]),[false]);assert.deepEqual(gradeExam([{...q,answer:'отчёт'}],['отчет']),[false]);assert.deepEqual(gradeExam([q],['']),[false]);const old=c.lessons[0].exam.questions[0];assert.deepEqual(gradeExam([old],[old.answer.toLowerCase()]),[false]);assert.ok(!validExamQuestion({...q,instruction:''}));assert.ok(!validExamQuestion({...q,marks:'comma-colon-dash'}));const l=structuredClone(fresh[0]);delete l.exam.questions[0].instruction;assert.throws(()=>validateLesson(l,c.catalog,c.tips));const m=structuredClone(mods[0]);delete m.variants[0].questions[0].instruction;assert.throws(()=>validateModules([m],c.lessons));
});
test('legacy lesson order stays stable and new modules do not overwrite old notes, exams or drafts',async()=>{
 const indexed=await loadCourseIndex(fetcher);assert.deepEqual(indexed.lessons.map(l=>l.id),c.lessons.map(l=>l.id));assert.equal(c.lessons[0].id,'ru.punctuation.introductory-words');const order=structuredClone(c.catalog);order.lessonOrder[0]=order.lessonOrder[1];assert.throws(()=>validateCatalog(order));
 const prior={...c,lessons:c.lessons.filter(l=>!fresh.includes(l)),modules:c.modules.filter(m=>!mods.includes(m))};const old=normalize(null,prior);old.byLesson[prior.lessons[0].id].note='Старый конспект';const m=prior.modules[0];beginModule(m,old.byModule[m.id],90).answers=m.variants[2].questions.map(q=>q.answer);finishModule(m,old.byModule[m.id]);beginModule(m,old.byModule[m.id],85).answers[0]=m.variants[3].questions[0].answer;const now=parseImport(JSON.stringify(old),indexed);for(const l of prior.lessons)assert.deepEqual(now.byLesson[l.id],old.byLesson[l.id]);for(const m of prior.modules)assert.deepEqual(now.byModule[m.id],old.byModule[m.id]);for(const l of fresh)assert.equal(now.byLesson[l.id].read,false);for(const m of mods)assert.deepEqual(now.byModule[m.id],{exams:[],draft:null});
});
test('syntax module control uses explicit grammar instructions, persists answers and reports weak topics',()=>{
 const s=normalize(null,c);for(const m of mods){const d=s.byModule[m.id],v=m.variants[0];beginModule(m,d,100);const html=moduleView({m,course:c,state:s,esc:String,mode:'exam'});assert.match(html,/индивидуальным инструкциям/);assert.ok(html.includes(v.questions[0].instruction));assert.doesNotMatch(html,/Перепишите каждое предложение/);d.draft.answers=v.questions.map(q=>q.answer);d.draft.answers[0]='ошибка';const r=finishModule(m,d);assert.equal(r.score,3);assert.equal(moduleReport(m,c,s,r).find(x=>x.lessonId===v.questions[0].lessonId).correct,1);assert.match(moduleView({m,course:c,state:s,esc:String,mode:'result'}),/Стоит повторить тему/);beginModule(m,d,100);d.draft.answers=m.variants[1].questions.map(q=>q.answer);assert.equal(finishModule(m,d).score,4);assert.equal(beginModule(m,d,100),null)}assert.deepEqual(parseImport(JSON.stringify(s),c),s);
});
test('v0.21 appends six stable lesson IDs and preserves v0.20 progress, including module draft',()=>{
 const added=new Set(['ru.syntax.phrase-structure','ru.syntax.phrase-links','ru.syntax.one-part-types','ru.syntax.incomplete','ru.syntax.homogeneity-syntax','ru.syntax.complication-types']);
 const historical=new Set(c.catalog.lessonOrder.slice(0,19));const prior={...c,lessons:c.lessons.filter(l=>historical.has(l.id)),modules:c.modules.filter(m=>m.lessonIds.every(id=>historical.has(id)))};
 assert.equal(prior.lessons.length,19);assert.equal(prior.modules.length,5);assert.deepEqual(c.catalog.lessonOrder.slice(0,19),prior.lessons.map(l=>l.id));
 const old=normalize(null,prior);for(const l of prior.lessons){old.byLesson[l.id].note='Конспект '+l.id;old.byLesson[l.id].read=true;}
 const m=prior.modules.find(x=>x.id==='ru.syntax.main-members');const d=old.byModule[m.id];beginModule(m,d,85);d.draft.answers=m.variants[0].questions.map(q=>q.answer);finishModule(m,d);beginModule(m,d,95);d.draft.answers[0]=m.variants[1].questions[0].answer;
 const now=parseImport(JSON.stringify(old),live);for(const l of prior.lessons)assert.deepEqual(now.byLesson[l.id],old.byLesson[l.id]);for(const m of prior.modules)assert.deepEqual(now.byModule[m.id],old.byModule[m.id]);for(const id of added)assert.equal(now.byLesson[id].read,false);
});

test('v0.22 preserves v0.21 records and stable lesson IDs, including an in-progress module exam',()=>{
 const ids=new Set(c.catalog.lessonOrder.slice(0,25));const prior={...c,lessons:c.lessons.filter(l=>ids.has(l.id)),modules:c.modules.filter(m=>m.lessonIds.every(id=>ids.has(id)))};
 assert.equal(prior.lessons.length,25);assert.equal(prior.modules.length,8);assert.deepEqual(c.catalog.lessonOrder.slice(0,25),prior.lessons.map(l=>l.id));
 const old=normalize(null,prior);for(const l of prior.lessons){old.byLesson[l.id].note='Конспект '+l.id;old.byLesson[l.id].read=true;}
 const m=prior.modules.find(x=>x.id==='ru.syntax.simple-complications');const d=old.byModule[m.id];beginModule(m,d,85);d.draft.answers=m.variants[0].questions.map(q=>q.answer);finishModule(m,d);beginModule(m,d,95);d.draft.answers[0]=m.variants[1].questions[0].answer;
 const now=parseImport(JSON.stringify(old),live);for(const l of prior.lessons)assert.deepEqual(now.byLesson[l.id],old.byLesson[l.id]);for(const m of prior.modules)assert.deepEqual(now.byModule[m.id],old.byModule[m.id]);for(const l of c.lessons.filter(l=>!ids.has(l.id)))assert.equal(now.byLesson[l.id].read,false);
});

test('v0.23 appends six IDs, keeps all v0.22 history, and covers every syntax module',()=>{
 const ids=new Set(c.catalog.lessonOrder.slice(0,31));const prior={...c,lessons:c.lessons.filter(l=>ids.has(l.id)),modules:c.modules.filter(m=>m.lessonIds.every(id=>ids.has(id)))};
 assert.equal(prior.lessons.length,31);assert.equal(prior.modules.length,11);assert.deepEqual(c.catalog.lessonOrder.slice(0,31),prior.lessons.map(l=>l.id));
 const added=c.lessons.slice(31,37);assert.equal(added.length,6);assert.equal(new Set(fresh.map(l=>l.moduleNumber)).size,12);
 const old=normalize(null,prior);for(const l of prior.lessons){old.byLesson[l.id].note='Конспект '+l.id;old.byLesson[l.id].read=true;}
 const m=prior.modules.find(x=>x.id==='ru.syntax.subordinate');const d=old.byModule[m.id];beginModule(m,d,85);d.draft.answers=m.variants[0].questions.map(q=>q.answer);finishModule(m,d);beginModule(m,d,95);d.draft.answers[0]=m.variants[1].questions[0].answer;
 const now=parseImport(JSON.stringify(old),live);for(const l of prior.lessons)assert.deepEqual(now.byLesson[l.id],old.byLesson[l.id]);for(const m of prior.modules)assert.deepEqual(now.byModule[m.id],old.byModule[m.id]);for(const l of added)assert.equal(now.byLesson[l.id].read,false);
 const info=added.find(l=>l.id.endsWith('information-structure'));for(const q of [...info.practice,...variants(info).flatMap(v=>v.questions)])assert.match(q.raw??q.prompt,/^(Кто|Что|Когда) .*\? /);
});
