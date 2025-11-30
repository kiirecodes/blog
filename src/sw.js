const CACHE_NAME = '0xkiire-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/rss.xml'
];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(clients.claim());
});

self.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url);
  // Network-first for API/index.json
  if(url.pathname.startsWith('/blogs/index.json') || url.pathname.endsWith('.xml')){
    evt.respondWith(
      fetch(evt.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
        return res;
      }).catch(()=> caches.match(evt.request))
    );
    return;
  }

  // For blog posts and assets: cache-first with network update
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      const network = fetch(evt.request).then(res => {
        // update cache
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, res.clone()));
        return res;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});
