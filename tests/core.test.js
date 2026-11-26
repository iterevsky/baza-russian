import test from 'node:test';
import assert from 'node:assert/strict';
import {norm,checkPositions,gradeExam} from '../src/core/assessment.js';
import {load,persist,exportProgress,defaults} from '../src/core/storage.js';
import {buildPrompt} from '../src/core/prompt.js';
import {readFile} from 'node:fs/promises';
import {validateCatalog,validateLesson,validateTips,loadCourse} from '../src/core/content.js';
const course=await loadCourse(async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))}));
const material=course.lessons[0], {tips}=course, qs=material.practice,examQs=material.exam.questions,cards=material.cards,groups=course.catalog.sections.map(s=>[s.title,s.moduleCount,s.description]);
test('catalog: 12 sections, 107 modules',()=>{assert.equal(groups.length,12);assert.equal(groups.reduce((a,b)=>a+b[1],0),107)});
test('punctuation: all exact positions, no extra commas',()=>{for(const q of qs){assert.equal(checkPositions(q.expected,q.expected),true);assert.equal(checkPositions([...q.expected,99],q.expected),false)}assert.equal(checkPositions([1,0],[0,1]),true);assert.equal(checkPositions([0,0],[0,1]),false)});
test('exam: exact words, punctuation, case, Ё; only whitespace normalized',()=>{assert.equal(norm('  Слово , другое. '),'Слово, другое.');assert.notEqual(norm('Ёлка.'),norm('Елка.'));assert.notEqual(norm('Слово.'),norm('слово.'));assert.deepEqual(gradeExam(examQs,examQs.map(q=>q.answer)),Array(6).fill(true));assert.equal(gradeExam(examQs,Array(6).fill('')).filter(Boolean).length,0)});
test('storage: valid round trip, corruption, blocked access',()=>{let s;const fake={getItem:()=>s,setItem:(_,v)=>s=v};let d=defaults();d.note='проверка';assert.equal(persist(fake,d),true);assert.equal(load(fake).note,d.note);assert.equal(JSON.parse(exportProgress(d)).schema,1);s='{';assert.deepEqual(load(fake),defaults());assert.equal(persist(undefined,d),false);assert.deepEqual(load(undefined),defaults())});
test('AI opt-in privacy: notes and errors excluded by default',()=>{const d=defaults();d.note='SECRET_NOTE';d.attempts=[{q:0,correct:false,selected:[]}];const s={goals:[1],context:true,errors:false,note:false,question:''};assert.ok(!buildPrompt(s,d,material).includes('SECRET_NOTE'));assert.ok(!buildPrompt(s,d,material).includes('Мои ошибки:'));assert.ok(buildPrompt({...s,note:true,errors:true},d,material).includes('SECRET_NOTE'));assert.ok(buildPrompt({...s,errors:true},d,material).includes('Мои ошибки:'))});
test('content: unique tip ids and separate exam questions',()=>{assert.equal(new Set(tips.map(x=>x.id)).size,tips.length);assert.ok(cards.length);assert.ok(examQs.every(q=>!qs.some(x=>x.parts.join(' ')===q.raw)))});

test('content validator rejects duplicate IDs, bad positions, unknown blocks and missing tip links',()=>{for(const mutate of [l=>l.cards[0].id=l.practice[0].id,l=>l.practice[0].expected=[99],l=>l.theory[0].type='script',l=>l.tipIds=['unknown']]){const l=structuredClone(material);mutate(l);assert.throws(()=>validateLesson(l,course.catalog,tips))}});
test('catalog rejects duplicate section IDs and unsafe paths',()=>{for(const mutate of [c=>c.sections[1].id=c.sections[0].id,c=>c.sections[6].lessons[0].file='../index.html']){const c=structuredClone(course.catalog);mutate(c);assert.throws(()=>validateCatalog(c))}});
test('loader checks response status',async()=>{await assert.rejects(loadCourse(async()=>({ok:false,status:404})),/404/)});
