/* db.js — magazyn lokalny.
 *
 * RODO (sekcja h briefu): dane zostają na urządzeniu. Zero sieci, zero kont,
 * zero telemetrii. Kopia zapasowa = plik JSON, który użytkownik sam zapisuje.
 *
 * IndexedDB jest magazynem głównym (Bloby zdjęć). Gdy jest niedostępny
 * (np. otwarcie z file:// w niektórych przeglądarkach) — schodzimy na
 * localStorage, a zdjęcia trzymamy jako data URL. Aplikacja ma działać zawsze.
 */
(function (global) {
  'use strict';

  var DB_NAME = 'mowa-taty';
  var DB_VERSION = 1;
  var STORES = ['meta', 'boards', 'buttons', 'people', 'images', 'settings', 'usageLog'];

  var db = null;
  var mode = 'idb';           // 'idb' | 'ls'
  var lsWritten = false;      // czy cokolwiek trafiło już do localStorage
  var LS_PREFIX = 'mowa-taty:';

  /* ---------- otwarcie ------------------------------------------------ */

  function open() {
    return new Promise(function (resolve) {
      if (!global.indexedDB) { mode = 'ls'; resolve('ls'); return; }

      var req;
      try {
        req = global.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        mode = 'ls'; resolve('ls'); return;
      }

      req.onupgradeneeded = function (e) {
        var d = e.target.result;
        // Migracje krokowe: przy schemaVersion 2 dodaj tu blok
        // if (e.oldVersion < 2) { ... }
        STORES.forEach(function (name) {
          if (!d.objectStoreNames.contains(name)) {
            d.createObjectStore(name, { keyPath: 'id' });
          }
        });
      };

      req.onsuccess = function (e) {
        db = e.target.result;
        // Gdyby otwarcie trwało długo i zdążyliśmy zejść na localStorage —
        // wracamy na IndexedDB tylko wtedy, gdy nic tam jeszcze nie zapisano.
        if (mode === 'idb' || !lsWritten) { mode = 'idb'; }
        resolve(mode);
      };
      req.onerror = function () { mode = 'ls'; resolve('ls'); };
      req.onblocked = function () { mode = 'ls'; resolve('ls'); };

      // Niektóre przeglądarki na file:// nie odpalają żadnego callbacku.
      // Czekamy długo, bo zejście na localStorage jest gorsze niż chwila zwłoki:
      // localStorage ma ~5 MB limitu i nie przechowa zdjęć jako Blobów.
      setTimeout(function () {
        if (!db && mode === 'idb') { mode = 'ls'; resolve('ls'); }
      }, 8000);
    });
  }

  /* ---------- operacje ------------------------------------------------ */

  function lsKey(store) { return LS_PREFIX + store; }

  function lsAll(store) {
    try { return JSON.parse(localStorage.getItem(lsKey(store)) || '[]'); }
    catch (e) { return []; }
  }

  /* JSON.stringify(Blob) daje "{}" — obrazek zniknąłby po cichu. W trybie
   * localStorage obrazki muszą być trzymane jako dataUrl (patrz putImage
   * i importAll), więc tutaj tylko pilnujemy, żeby Blob nigdy tu nie trafił. */
  function lsWrite(store, rows) {
    if (store === 'images') {
      rows = rows.filter(function (r) {
        if (r && r.blob instanceof Blob && !r.dataUrl) { return false; }
        return true;
      });
    }
    lsWritten = true;
    localStorage.setItem(lsKey(store), JSON.stringify(rows));
  }

  function getAll(store) {
    if (mode === 'ls') { return Promise.resolve(lsAll(store)); }
    return new Promise(function (resolve) {
      var r = db.transaction(store, 'readonly').objectStore(store).getAll();
      r.onsuccess = function () { resolve(r.result || []); };
      r.onerror = function () { resolve([]); };
    });
  }

  function put(store, obj) {
    if (mode === 'ls') {
      var rows = lsAll(store).filter(function (x) { return x.id !== obj.id; });
      rows.push(obj);
      lsWrite(store, rows);
      return Promise.resolve(obj);
    }
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(obj);
      tx.oncomplete = function () { resolve(obj); };
      tx.onerror = function () { reject(tx.error); };
    });
  }

  function putMany(store, rows) {
    if (mode === 'ls') {
      var byId = {};
      lsAll(store).concat(rows).forEach(function (x) { byId[x.id] = x; });
      lsWrite(store, Object.keys(byId).map(function (k) { return byId[k]; }));
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(store, 'readwrite');
      var os = tx.objectStore(store);
      rows.forEach(function (r) { os.put(r); });
      tx.oncomplete = resolve;
      tx.onerror = function () { reject(tx.error); };
    });
  }

  function remove(store, id) {
    if (mode === 'ls') {
      lsWrite(store, lsAll(store).filter(function (x) { return x.id !== id; }));
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      var tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  }

  function clear(store) {
    if (mode === 'ls') { lsWrite(store, []); return Promise.resolve(); }
    return new Promise(function (resolve) {
      var tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  }

  /* ---------- eksport / import ---------------------------------------- */

  /** Cały dokument jako obiekt JS. Bloby zamieniane na data URL. */
  function exportAll() {
    var out = { exportedAt: new Date().toISOString() };
    return Promise.all(STORES.map(function (s) {
      return getAll(s).then(function (rows) { out[s] = rows; });
    })).then(function () {
      return Promise.all((out.images || []).map(function (img) {
        if (img.blob instanceof Blob) { return blobToDataUrl(img.blob).then(function (d) { img.dataUrl = d; delete img.blob; }); }
        return null;
      }));
    }).then(function () { return out; });
  }

  /** Nadpisuje całą zawartość danymi z pliku JSON. */
  function importAll(data) {
    return Promise.all(STORES.map(function (s) { return clear(s); })).then(function () {
      return Promise.all(STORES.map(function (s) {
        var rows = data[s] || [];
        // Na IndexedDB trzymamy Bloby (mniej pamięci); na localStorage
        // musi zostać dataUrl, bo Blob się tam nie serializuje.
        if (s === 'images' && mode === 'idb') {
          rows = rows.map(function (img) {
            if (img.dataUrl) { img.blob = dataUrlToBlob(img.dataUrl); delete img.dataUrl; }
            return img;
          });
        }
        return rows.length ? putMany(s, rows) : null;
      }));
    });
  }

  /* ---------- pomocnicze ---------------------------------------------- */

  function blobToDataUrl(blob) {
    return new Promise(function (resolve) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { resolve(null); };
      fr.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(',');
    var mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) { arr[i] = bin.charCodeAt(i); }
    return new Blob([arr], { type: mime });
  }

  /** Zapis obrazka; w trybie localStorage od razu jako data URL. */
  function putImage(id, blob, caption) {
    if (mode === 'ls') {
      return blobToDataUrl(blob).then(function (d) {
        return put('images', { id: id, dataUrl: d, caption: caption || '' });
      });
    }
    return put('images', { id: id, blob: blob, caption: caption || '' });
  }

  /** Zwraca URL nadający się do <img src>. Pamiętaj o revoke przy podmianie. */
  function imageUrl(img) {
    if (!img) { return null; }
    if (img.dataUrl) { return img.dataUrl; }
    if (img.blob instanceof Blob) { return URL.createObjectURL(img.blob); }
    return null;
  }

  global.DB = {
    open: open,
    getAll: getAll,
    put: put,
    putMany: putMany,
    remove: remove,
    clear: clear,
    exportAll: exportAll,
    importAll: importAll,
    putImage: putImage,
    imageUrl: imageUrl,
    blobToDataUrl: blobToDataUrl,
    dataUrlToBlob: dataUrlToBlob,
    stores: STORES,
    getMode: function () { return mode; }
  };

}(window));
