// Render replaces the view. Keep keyboard focus on an equivalent control when possible.
const identity=el=>el?.id?['id',el.id]:el?.dataset?Object.entries(el.dataset).sort():[];
export function rememberFocus(doc,root){const el=doc.activeElement;if(!el||el===root||!root?.contains?.(el))return null;const keys=identity(el);return keys.length?{tag:el.tagName,keys}: {tag:null,keys:[]};}
export function restoreFocus(root,previous){if(!previous)return;const match=Array.from(root.querySelectorAll?.('button,input,select,textarea,a,summary')??[]).find(el=>el.tagName===previous.tag&&!el.disabled&&JSON.stringify(identity(el))===JSON.stringify(previous.keys));(match??root).focus?.({preventScroll:true});}
