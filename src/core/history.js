// Route history is UI-only. Never writes to or deletes stored learning results.
export function createNavigation(host,namespace,initial,onRestore,standalone=false){
 const h=host.history;if(!h?.pushState||!h?.replaceState)return null;
 const tag=namespace,wrap=(route,guard=false,depth=0)=>({baza:tag,route,guard,depth});
 const current=()=>h.state?.baza===tag?h.state:null;
 // Preserve browser history on ordinary websites. A standalone app gets one root guard.
 if(!current()&&standalone){h.replaceState(wrap(initial,true),'');h.pushState(wrap(initial),'')}
 else if(!current())h.replaceState(wrap(initial),'');
 else if(current().guard)h.pushState(wrap(initial),'');
 // Existing routes survive reload; caller decides how to restore their data.
 const commit=(route,replace=false)=>{(replace?h.replaceState:h.pushState).call(h,wrap(route,false,(current()?.depth??0)+(replace?0:1)),'')};
 host.addEventListener('popstate',e=>{const entry=e.state;if(entry?.baza!==tag)return;if(entry.guard){h.pushState(wrap(initial),'');onRestore(initial);return}onRestore(entry.route)});
 return {canBack:()=> (current()?.depth??0)>0,current:()=>current()?.route,commit,back:()=>h.back(),replace:route=>commit(route,true)};
}
