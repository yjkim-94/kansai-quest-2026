const CACHE='kansai-ko-v8';
const ASSETS=[...Array.from({length:30},(_,i)=>'./assets/food-photos/'+String(i).padStart(2,'0')+'.jpg'),'./','./index.html','./style.css','./app.js','./weather.js','./food-art.js','./food-photos.js','./manifest.json','./icon.svg','./assets/world.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('kansai-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 const response=fetch(event.request).then(result=>{if(result.ok&&!result.redirected&&result.type!=='opaque'){const copy=result.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}))}return result}).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate'){const shell=await caches.match('./index.html');if(shell)return shell}return new Response('오프라인에서 이 파일을 열 수 없습니다.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})});
 event.respondWith(response);
});
