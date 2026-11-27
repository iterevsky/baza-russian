// A presentation permutation, never an alteration of the stored answer key.
export function choiceOrder(size,random=Math.random){
 const order=Array.from({length:size},(_,i)=>i);
 for(let i=size-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
 return order;
}
export function createChoiceSession(random=Math.random){
 const orders=new Map();
 return {order(q){if(!orders.has(q.id))orders.set(q.id,choiceOrder(q.options.length,random));return orders.get(q.id)},reset(){orders.clear()}};
}
