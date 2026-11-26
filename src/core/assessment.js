export const norm=s=>String(s??'').normalize('NFC').trim().replace(/\s+/g,' ').replace(/\s*,\s*/g,', ').trim();
export const checkPositions=(selected,expected)=>selected.length===expected.length&&expected.every(i=>selected.includes(i));
export function gradeExam(questions,answers){return questions.map((q,i)=>norm(answers[i])===norm(q.answer))}

// Revisit only questions whose latest recorded response is incorrect.
export function errorIndices(questions,attempts){const latest=new Map();for(const a of attempts){const i=a.questionId?questions.findIndex(q=>q.id===a.questionId):a.q;if(Number.isInteger(i)&&questions[i])latest.set(i,a.correct)}return questions.map((_,i)=>i).filter(i=>latest.get(i)===false)}
