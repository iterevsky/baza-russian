export const norm=s=>String(s??'').normalize('NFC').trim().replace(/\s+/g,' ').replace(/\s*,\s*/g,', ').trim();
export const checkPositions=(selected,expected)=>selected.length===expected.length&&expected.every(i=>selected.includes(i));
export function gradeExam(questions,answers){return questions.map((q,i)=>norm(answers[i])===norm(q.answer))}
