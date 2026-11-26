export const variants=l=>[l.exam,...(l.examVariants??[])];
export const variantById=(l,id)=>variants(l).find(v=>v.id===id);
export const nextVariant=(l,d)=>variants(l).find(v=>!d.exams.some(a=>a.examId===v.id));
export const isMastered=(l,d)=>d.exams.some(a=>{const v=variantById(l,a.examId);return v&&a.score===v.questions.length});
