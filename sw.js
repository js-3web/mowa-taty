/* sw.js — service worker: aplikacja ma działać bez internetu.
 *
 * Strategia: cache-first dla powłoki aplikacji. Nic nie jest wysyłane na zewnątrz,
 * nie ma żadnych zapytań do obcych serwerów — jest co cache'ować i to wszystko.
 *
 * Po zmianie plików PODNIEŚ CACHE_VERSION, inaczej telefon zostanie przy starej wersji.
 */
var CACHE_VERSION = 'mowa-taty-v4';

var SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/icons.js',
  './js/db.js',
  './js/data.js',
  './js/tts.js',
  './js/share.js',
  './js/remote.js',
  './js/app.js',
  './js/caregiver.js',
  './manifest.json',
  './img/icon-192.png',
  './img/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE_VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }

  // Paczka konfiguracyjna musi być zawsze świeża — nigdy z pamięci podręcznej,
  // inaczej zdalna aktualizacja nigdy by nie dotarła.
  if (/paczka\.(json|enc)/.test(e.request.url)) { return; }

  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) { return hit; }
      return fetch(e.request).then(function (res) {
        // Dokładaj do cache tylko własne pliki.
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        // Offline i brak w cache — dla nawigacji pokaż powłokę.
        if (e.request.mode === 'navigate') { return caches.match('./index.html'); }
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
