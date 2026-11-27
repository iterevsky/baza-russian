// Handle image failures without replacing the original or bypassing offline integrity.
function portraitResult(event,failed){const img=event.target;if(!(img instanceof HTMLImageElement)||!img.matches('.edition-home .portrait img'))return;const note=img.parentElement?.querySelector('.portrait-error');if(note){note.hidden=!failed;img.hidden=failed}}
document.addEventListener('error',event=>portraitResult(event,true),true);
document.addEventListener('load',event=>portraitResult(event,false),true);
