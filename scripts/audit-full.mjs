// Reproducible inventory and structural signals. This does not certify linguistic truth.
import {readFile,writeFile,stat} from 'node:fs/promises';
import {loadCourse} from '../src/core/content.js';
import {variants} from '../src/core/exams.js';
import {currentModuleVariants} from '../src/core/modules.js';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root));
const c=await loadCourse(async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))}));
const count=(xs,fn)=>Object.fromEntries([...new Set(xs.map(fn))].sort().map(k=>[k,xs.filter(x=>fn(x)===k).length]));
const qkey=q=>(q.raw??q.parts?.join(' ')??(q.rows?[q.prompt,...q.rows,...q.categories].join(' | '):q.prompt)??'').normalize('NFC').replace(/\s+/g,' ').trim().toLocaleLowerCase('ru');
const rows=[],prompts=new Map(),goalCounts=new Map(),sources=new Map();
function record(q,kind,l,m){const p=qkey(q);if(!prompts.has(p))prompts.set(p,[]);prompts.get(p).push({id:q.id,kind,lessonId:l,moduleId:m})}
for(const section of c.catalog.sections)for(const plan of section.plan){
 const m=c.modules.find(m=>m.moduleNumber===plan.number),ls=c.lessons.filter(l=>l.moduleId===m?.id);
 const row={section:section.title,number:plan.number,plannedTitle:plan.title,moduleId:m?.id??null,moduleStatus:m?.status??null,lessons:[],moduleVariants:[],reviewState:'inventory-only; no linguistic sign-off',flags:[]};
 for(const l of ls){const qs=l.practice;for(const q of qs)record(q,'practice',l.id,m.id);for(const v of variants(l))for(const q of v.questions)record(q,'lesson-exam',l.id,m.id);
  for(const g of l.goals){if(!goalCounts.has(g))goalCounts.set(g,[]);goalCounts.get(g).push(l.id)}
  if(!sources.has(l.source.url))sources.set(l.source.url,[]);sources.get(l.source.url).push(l.id);
  row.lessons.push({id:l.id,title:l.title,status:l.status,goals:l.goals,prerequisites:l.prerequisites,related:l.related,sources:[l.source,...(l.sourceLinks??[])],theoryBlocks:l.theory.map(b=>b.type),practiceTypes:count(qs,q=>q.type),practiceIds:qs.map(q=>q.id),examVariants:variants(l).map(v=>({id:v.id,questionIds:v.questions.map(q=>q.id)})),cardIds:l.cards.map(q=>q.id),caseIds:(l.editorialCases??[]).map(q=>q.id),deepDiveTitles:(l.deepDive??[]).map(q=>q.title),tipIds:l.tipIds??[],flagNoExplicitDeepBlock:!l.theory.some(b=>b.type==='deep')});
 }
 for(const v of m?.variants??[]){row.moduleVariants.push({id:v.id,questionIds:v.questions.map(q=>q.id),scope:v.lessonIds??m.lessonIds,archived:v.archived===true,current:currentModuleVariants(m).some(x=>x.id===v.id)});for(const q of v.questions)record(q,'module-exam',q.lessonId,m.id)}
 if(ls.length===1)row.flags.push('single-lesson module: review breadth against curriculum');
 if(row.moduleVariants.some(v=>v.current&&v.questionIds.length===2))row.flags.push('two-question module exam: insufficient evidence for mastery');
 if(ls.some(l=>l.status!=='reviewed'))row.flags.push('content draft: requires claim-level source and blind key review');
 if(ls.some(l=>l.practice.length<=4))row.flags.push('four or fewer practice tasks: review transfer and variation');
 if(ls.some(l=>!l.tipIds?.length))row.flags.push('no linked tip in at least one lesson: review if appropriate');
 if(ls.some(l=>!l.prerequisites?.length))row.flags.push('no prerequisite in at least one lesson: review if foundational');
 rows.push(row);
}
const overlaps=[...prompts].filter(([k,items])=>k&&items.length>1).map(([prompt,items])=>({prompt,items}));
const map=new Map(c.lessons.map(l=>[l.id,l])),visiting=new Set(),visited=new Set(),cycles=[];
function visit(id,trail){if(visiting.has(id)){cycles.push([...trail.slice(trail.indexOf(id)),id]);return}if(visited.has(id))return;visiting.add(id);for(const dep of map.get(id).prerequisites)visit(dep,[...trail,id]);visiting.delete(id);visited.add(id)}
for(const id of map.keys())visit(id,[]);
const result={release:JSON.parse(await read('package.json')).version,scope:'structural inventory; sources recorded, not independently checked',planned:rows.length,populated:rows.filter(r=>r.lessons.length).length,lessonCount:c.lessons.length,sections:count(rows,r=>r.section),singleLessonModules:rows.filter(r=>r.lessons.length===1).length,twoQuestionModules:rows.filter(r=>r.moduleVariants.some(v=>v.current&&v.questionIds.length===2)).length,moduleVariantSizes:count(rows.flatMap(r=>r.moduleVariants).filter(v=>v.current),v=>v.questionIds.length),allModuleVariantSizesIncludingArchive:count(rows.flatMap(r=>r.moduleVariants),v=>v.questionIds.length),fourOrFewerPractice:c.lessons.filter(l=>l.practice.length<=4).map(l=>l.id),noTip:c.lessons.filter(l=>!l.tipIds?.length).map(l=>l.id),noPrerequisites:c.lessons.filter(l=>!l.prerequisites?.length).map(l=>l.id),prerequisiteCycles:cycles,primarySources:[...sources].map(([url,lessonIds])=>({url,lessonIds})),reusedGoals:[...goalCounts].filter(([,ids])=>ids.length>=5).map(([goal,lessonIds])=>({goal,lessonIds})),exactPromptOverlap:overlaps,runtimeIndexBytes:(await stat(new URL('content/runtime-index.json',root))).size,rows};
const out=process.argv[2];if(out)await writeFile(new URL(out,root),JSON.stringify(result,null,2)+'\n');else console.log(JSON.stringify(result,null,2));
