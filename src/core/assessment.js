export const norm=s=>String(s??'').normalize('NFC').trim().replace(/\s+/g,' ').replace(/\s*,\s*/g,', ').trim();
export const checkPositions=(selected,expected)=>Array.isArray(selected)&&Array.isArray(expected)&&selected.length===expected.length&&new Set(selected).size===selected.length&&expected.every(i=>selected.includes(i));
export const extendedMarks=q=>q?.marks==='comma-colon-dash';
// Accept an ordinary spaced keyboard hyphen or short dash as a dash input, never change intraword hyphens.
export const parenthesesMarks=q=>q?.marks==='comma-parentheses';
export const grammarAnswer=q=>q?.type==='grammar-answer';
export const writtenAnswer=q=>q?.type==='written-answer';
export const writtenNorm=s=>String(s??'').normalize('NFC').trim();
const grammarNorm=s=>String(s??'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru');
export const semanticNorm=s=>String(s??'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru');
export const examNorm=(q,s)=>q.answerPolicy==='semantic-v1'?semanticNorm(s):writtenAnswer(q)?writtenNorm(s):grammarAnswer(q)?grammarNorm(s):parenthesesMarks(q)?norm(s).replace(/\(\s+/g,'(').replace(/\s+\)/g,')'):extendedMarks(q)?norm(s).replace(/\s*:\s*/g,': ').replace(/\s+[–—-]\s+/g,' — '):norm(s);
export const examSkeleton=(q,s)=>norm(parenthesesMarks(q)?examNorm(q,s).replace(/[(),]/g,''):extendedMarks(q)?examNorm(q,s).replace(/[:,]/g,'').replace(/ — /g,' '):String(s).replaceAll(',',''));
export const validExamMarks=q=>q.marks===undefined||parenthesesMarks(q)&&examSkeleton(q,q.answer)===examSkeleton(q,q.raw)&&!/[(),]/.test(q.raw)&&q.answer.includes('(')&&/^([^()]|\([^()]+\))*$/.test(q.answer)||extendedMarks(q)&&examSkeleton(q,q.answer)===examSkeleton(q,q.raw)&&!/[,:]| [–—-] /.test(q.raw);
export const validAnswerPolicy=q=>q.answerPolicy===undefined&&q.accepted===undefined||q.answerPolicy==='semantic-v1'&&q.type==='grammar-answer'&&Array.isArray(q.accepted)&&q.accepted.length>0&&q.accepted.every(x=>typeof x==='string'&&x.trim())&&new Set([q.answer,...q.accepted].map(semanticNorm)).size===q.accepted.length+1;
export const validExamQuestion=q=>!!q&&validAnswerPolicy(q)&&[q.raw,q.answer,q.ex].every(x=>typeof x==='string'&&x.trim())&&((grammarAnswer(q)||writtenAnswer(q))?q.marks===undefined&&typeof q.instruction==='string'&&!!q.instruction.trim():q.type==='exact-text'&&validExamMarks(q));
export function gradeExam(questions,answers){return questions.map((q,i)=>[q.answer,...(q.answerPolicy==='semantic-v1'?q.accepted:[])].some(a=>examNorm(q,answers[i])===examNorm(q,a)))}

// Revisit only questions whose latest recorded response is incorrect.
export function errorIndices(questions,attempts){const latest=new Map();for(const a of attempts){const i=a.questionId?questions.findIndex(q=>q.id===a.questionId):a.q;if(Number.isInteger(i)&&questions[i])latest.set(i,a.correct)}return questions.map((_,i)=>i).filter(i=>latest.get(i)===false)}
