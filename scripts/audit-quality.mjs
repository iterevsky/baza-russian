import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(path.join(root,p),'utf8'));
const collection=p=>readdirSync(path.join(root,p)).filter(x=>x.endsWith('.json')).sort().map(x=>read(p+'/'+x));
const count=(xs,key)=>Object.fromEntries([...new Set(xs.map(key))].sort().map(k=>[k,xs.filter(x=>key(x)===k).length]));
const lessons=collection('content/lessons'),modules=collection('content/modules'),catalog=read('content/catalog.json'),tips=read('content/tips.json');
const practice=lessons.flatMap(l=>l.practice),exams=[...lessons.flatMap(l=>[l.exam,...(l.examVariants??[])]),...modules.flatMap(m=>m.variants)].flatMap(v=>v.questions);
const skew=lessons.flatMap(l=>{const items=l.practice.filter(q=>q.type==='single-choice'); const indices=new Set(items.map(q=>q.expected[0]));return items.length>=4&&indices.size===1?[{id:l.id,count:items.length,correctIndex:items[0].expected[0]}]:[]});
const result={release:read('package.json').version,plannedModules:catalog.sections.reduce((n,s)=>n+s.moduleCount,0),populatedModules:new Set(lessons.map(l=>l.moduleId)).size,lessons:lessons.length,lessonStatuses:count(lessons,l=>l.status),moduleStatuses:count(modules,m=>m.status),practice:practice.length,practiceTypes:count(practice,q=>q.type),examQuestions:exams.length,examTypes:count(exams,q=>q.type),cards:lessons.reduce((n,l)=>n+l.cards.length,0),editorialCases:lessons.reduce((n,l)=>n+(l.editorialCases??[]).length,0),deepDiveCounts:count(lessons,l=>(l.deepDive??[]).length),tips:tips.length,lessonsLinkedToTips:lessons.filter(l=>l.tipIds?.length).length,lessonsWithPrerequisites:lessons.filter(l=>l.prerequisites?.length).length,lessonsWithRelated:lessons.filter(l=>l.related?.length).length,indexBytes:statSync(path.join(root,'content/runtime-index.json')).size,singleChoiceSamePosition:skew,limitations:['Counts and answer-position signals only; not linguistic, pedagogical, accessibility or real-browser certification.','A fixed position can be mitigated by verified shuffling, but authored banks should also be balanced; check UI and history compatibility before changing.']};
console.log(JSON.stringify(result,null,2));
if(process.argv.includes('--strict')&&skew.length){console.error('Quality gate: investigate predictable answer positions.');process.exitCode=1;}
