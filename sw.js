/* sw.js — service worker: aplikacja ma działać bez internetu, ale też
 * natychmiast podchwytywać nową wersję.
 *
 * Poprzednia wersja trzymała wszystko „cache-first" i to był błąd: telefon
 * uparcie pokazywał starą aplikację, a kod odpowiedzialny za aktualizację
 * siedział w starym index.html, więc nigdy się nie uruchamiał.
 *
 * Teraz: powłoka aplikacji (HTML/CSS/JS) idzie **network-first** — przy
 * internecie zawsze świeża, bez internetu z pamięci. Obrazki i ikony zostają
 * cache-first, bo się nie zmieniają. Pliki są małe (~150 kB), więc nic to
 * nie kosztuje, a wersja zawsze się zgadza.
 */
var CACHE_VERSION = 'mowa-taty-v8';

var SHELL = [
  './',
  './index.html',
  './diag.html',
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
  './version.json',
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

/** Czy to plik powłoki aplikacji — ten, który musi być zawsze aktualny. */
function isShell(url) {
  return /\.(html|js|css|json)$/i.test(url.pathname) || url.pathname.endsWith('/');
}

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }

  var url = new URL(e.request.url);

  // Paczka konfiguracyjna: nigdy przez service workera, zawsze prosto z sieci.
  if (/paczka\.(json|enc)/.test(url.pathname)) { return; }

  // Obcy origin — nie mieszamy się.
  if (url.origin !== self.location.origin) { return; }

  if (isShell(url) || e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request));
    return;
  }

  e.respondWith(cacheFirst(e.request));
});

function networkFirst(request) {
  return fetch(request).then(function (res) {
    if (res && res.status === 200 && res.type === 'basic') {
      var copy = res.clone();
      caches.open(CACHE_VERSION).then(function (c) { c.put(request, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(request).then(function (hit) {
      if (hit) { return hit; }
      if (request.mode === 'navigate') { return caches.match('./index.html'); }
      return new Response('', { status: 504, statusText: 'offline' });
    });
  });
}

function cacheFirst(request) {
  return caches.match(request).then(function (hit) {
    if (hit) { return hit; }
    return fetch(request).then(function (res) {
      if (res && res.status === 200 && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (c) { c.put(request, copy); });
      }
      return res;
    }).catch(function () {
      return new Response('', { status: 504, statusText: 'offline' });
    });
  });
}
