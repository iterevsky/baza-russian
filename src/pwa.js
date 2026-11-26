// Offline package lifecycle is separate from the progress database.
const panel=document.querySelector('#pwa-panel');
const status=document.querySelector('#pwa-status'),detail=document.querySelector('#pwa-detail');
const install=document.querySelector('#pwa-install'),check=document.querySelector('#pwa-check');
const sw=navigator.serviceWorker;
let registration,installEvent,installed=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,installFailure=false;
let checking=false,notice='';
function show(){
 panel.hidden=false;
 install.hidden=installed||!installEvent;
 check.hidden=!registration;check.disabled=checking||!navigator.onLine;
 const waiting=registration?.waiting,controller=sw?.controller;
 if(waiting&&controller){status.textContent='Обновление готово';detail.textContent='Завершите занятие, убедитесь, что прогресс сохранён, закройте все вкладки и окна БАЗА. Затем откройте приложение снова.';return}
 if(installFailure&&controller&&!navigator.onLine){status.textContent='Автономный режим';detail.textContent='Сервер недоступен. Используется сохранённый пакет.';return}
 if(installFailure){status.textContent=controller?'Сохранена прежняя версия':'Не удалось подготовить автономный пакет';detail.textContent='Проверьте запуск сервера и полноту файлов. '+notice;return}
 if(controller){status.textContent=navigator.onLine?'Автономная версия готова':'Автономный режим';detail.textContent=notice||(!installed&&!installEvent?'Установка доступна через меню браузера, если поддерживается.':'Материалы текущей версии доступны без подключения к серверу.');return}
 if(registration?.active){status.textContent='Пакет загружен';detail.textContent='Откройте приложение заново, чтобы включить автономный режим.';return}
 status.textContent=sw?'Подготовка автономного пакета':'Автономный режим недоступен';detail.textContent=notice||(!sw?'Используйте HTTPS или localhost в поддерживаемом браузере.':'Не закрывайте страницу до окончания загрузки.');
}
function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='redundant'){installFailure=true;notice='Обновление не применено.'}if(worker.state==='installed'||worker.state==='activated'){installFailure=false;notice=''}show()})}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;show()});
window.addEventListener('appinstalled',()=>{installed=true;installEvent=null;show()});
install.addEventListener('click',async()=>{const event=installEvent;if(!event)return;installEvent=null;show();try{await event.prompt();await event.userChoice}catch{notice='Установка не выполнена. Попробуйте меню браузера.'}show()});
window.addEventListener('online',()=>{show();void update()});window.addEventListener('offline',show);
async function update(){if(!registration||checking||!navigator.onLine)return;checking=true;notice='';installFailure=false;show();try{await registration.update();notice=registration.installing?'Загружается обновление.':registration.waiting?'':'Проверка завершена.'}catch{notice='Сервер обновлений недоступен. Текущая версия не изменена.'}finally{checking=false;show()}}
check.addEventListener('click',update);
if(sw){sw.addEventListener('controllerchange',show);try{registration=await sw.getRegistration();if(!registration||navigator.onLine)registration=await sw.register(new URL('../sw.js',import.meta.url),{updateViaCache:'none'});registration.addEventListener('updatefound',()=>{installFailure=false;watch(registration.installing);show()});watch(registration.installing);show()}catch{installFailure=true;notice='Не удалось зарегистрировать автономный пакет.';show()}}else show();
