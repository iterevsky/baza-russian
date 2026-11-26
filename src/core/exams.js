import {gradeExam} from './assessment.js';
export function rehearsalQuestions(variant,result){
 if(!variant||!result||variant.id!==result.examId||variant.questions.length!==result.answers?.length)return [];
 const grades=gradeExam(variant.questions,result.answers),missed=variant.questions.filter((_,i)=>!grades[i]);
 return missed.length?missed:[...variant.questions];
}
export const variants=l=>[l.exam,...(l.examVariants??[])];
export const variantById=(l,id)=>variants(l).find(v=>v.id===id);
export const currentVariants=l=>variants(l).filter(v=>v.archived!==true);
export const nextVariant=(l,d)=>currentVariants(l).find(v=>!d.exams.some(a=>a.examId===v.id));
export const validThreshold=t=>Number.isInteger(t)&&t>=50&&t<=100&&t%5===0;
export const thresholdOrDefault=t=>validThreshold(t)?t:100;
export const requiredScore=(count,threshold=100)=>Math.ceil(count*thresholdOrDefault(threshold)/100);
export const passed=(score,count,threshold=100)=>score>=requiredScore(count,threshold);
export const isMastered=(l,d,threshold=100)=>d.exams.some(a=>{const v=variantById(l,a.examId);return v&&v.archived!==true&&passed(a.score,v.questions.length,threshold)});
