// Reproducible triage, not independent linguistic review. Include archived exams in the inventory only.
import {readFile,writeFile} from 'node:fs/promises';
import {loadCourse} from '../src/core/content.js';
import {currentVariants} from '../src/core/exams.js';
import {currentModuleVariants} from '../src/core/modules.js';
const c=await loadCourse(async u=>({ok:true,json:async()=>JSON.parse(await readFile(u,'utf8'))}));
const binary=s=>/^(да|нет)$/iu.test(s.trim());
const rows=c.lessons.map(l=>{
 const qs=l.practice,cards=l.cards,cs=l.editorialCases??[],exam=currentVariants(l).flatMap(v=>v.questions),module=c.modules.find(m=>m.id===l.moduleId),modQs=currentModuleVariants(module).flatMap(v=>v.questions).filter(q=>q.lessonId===l.id);
 const flags=[];if(l.status==='draft')flags.push('claim-by-claim review and blind solving pending');if(qs.length<=5)flags.push('limited practice quantity; inspect transfer');if(!l.prerequisites.length)flags.push('no prerequisites; assess if intentional');if(!l.tipIds.length)flags.push('no tip; assess if useful');if(cards.some(q=>q.front.includes(' / ')))flags.push('card with explicit alternatives; inspect recall strength');if(cs.some(e=>e.criteria.length<=2))flags.push('short open-case rubric; inspect sufficiency');if([...exam,...modQs].some(q=>binary(q.answer)))flags.push('binary active exam answer; inspect difficulty');if(l.theory.some(b=>/Для полного модуля|требуется расширение/u.test(b.text??'')))flags.push('stated coverage gap in theory');
 return {id:l.id,module:l.moduleNumber,status:l.status,practice:qs.length,cardCount:cards.length,cases:cs.length,activeLessonExamItems:exam.length,activeModuleItems:modQs.length,binaryActiveExamIds:[...exam,...modQs].filter(q=>binary(q.answer)).map(q=>q.id),cardsWithAlternatives:cards.filter(q=>q.front.includes(' / ')).map(q=>q.id),shortRubrics:cs.filter(e=>e.criteria.length<=2).map(e=>e.id),sources:[l.source,...(l.sourceLinks??[])],flags};
});
const count=fn=>rows.reduce((n,r)=>n+fn(r),0);const report={scope:'139 lessons and 107 modules; structural triage only, flags are not verified defects',lessons:rows.length,modules:c.modules.length,activeModuleVariants:c.modules.flatMap(currentModuleVariants).length,minimumModuleVariant:Math.min(...c.modules.flatMap(currentModuleVariants).map(v=>v.questions.length)),binaryActiveItems:count(r=>r.binaryActiveExamIds.length),cardsWithAlternatives:count(r=>r.cardsWithAlternatives.length),shortRubrics:count(r=>r.shortRubrics.length),lessonsWithLimitedPractice:rows.filter(r=>r.practice<=5).length,lessonsWithCoverageGap:rows.filter(r=>r.flags.includes('stated coverage gap in theory')).length,rows};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');else console.log(JSON.stringify(report,null,2));
