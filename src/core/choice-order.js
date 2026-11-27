// A presentation permutation, never an alteration of the stored answer key.
export function choiceOrder(size,random=Math.random){
 const order=Array.from({length:size},(_,i)=>i);
 for(let i=size-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
 return order;
}
export function createChoiceSession(random=Math.random){
 const orders=new Map();
 return {plan(questions){
  // Stratify the visible position of single-choice keys within each option-count group.
  // Canonical option indices remain unchanged, so older recorded answers remain readable.
  const groups=new Map();
  for(const q of questions)if(q.type==='single-choice'){const n=q.options.length;if(!groups.has(n))groups.set(n,[]);groups.get(n).push(q)}
  for(const [n,qs] of groups){const slots=Array.from({length:qs.length},(_,i)=>i%n);const offsetOrder=choiceOrder(n,random);const shuffled=choiceOrder(slots.length,random).map(i=>offsetOrder[slots[i]]);for(let i=0;i<qs.length;i++){
   const q=qs[i],key=q.expected[0],order=choiceOrder(n,random),target=shuffled[i],from=order.indexOf(key);
   [order[target],order[from]]=[order[from],order[target]];orders.set(q.id,order);
  }}
 },order(q){if(!orders.has(q.id))orders.set(q.id,choiceOrder(q.options.length,random));return orders.get(q.id)},reset(){orders.clear()}};
}
