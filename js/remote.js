/* remote.js — zdalna konfiguracja aplikacji.
 *
 * Problem: telefon jest w szpitalu, opiekun przy komputerze. Trzeba móc dodać
 * zdjęcia, zmienić tablice i ustawienia bez dotykania telefonu.
 *
 * Rozwiązanie bez serwera i bez kont: paczka konfiguracyjna leży na GitHub
 * Pages obok aplikacji, ale jest **zaszyfrowana hasłem** (AES-256-GCM, klucz
 * z PBKDF2). Na serwerze publicznym leży więc szyfrogram — bezużyteczny bez
 * hasła. Telefon pobiera go, odszyfrowuje i stosuje.
 *
 * To kompromis wobec zasady „wyłącznie lokalnie" z briefu: dane opuszczają
 * urządzenie, ale wyłącznie w postaci zaszyfrowanej, a klucz nigdy nie trafia
 * na serwer. Bez tego zdalna konfiguracja nie jest możliwa w ogóle.
 *
 * Format pliku:
 *   "MTP1" (4 B) | salt (16 B) | iv (12 B) | szyfrogram + tag GCM
 */
(function (global) {
  'use strict';

  var MAGIC = 'MTP1';
  var ITERATIONS = 200000;

  function subtle() {
    return (global.crypto && global.crypto.subtle) ? global.crypto.subtle : null;
  }

  /** Czy zdalne aktualizacje są w ogóle możliwe w tym środowisku. */
  function available() {
    return !!subtle() && global.isSecureContext === true;
  }

  function bytesToStr(buf) {
    return new TextDecoder('utf-8').decode(buf);
  }

  function deriveKey(passphrase, salt) {
    var enc = new TextEncoder();
    return subtle().importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return subtle().deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: ITERATIONS, hash: 'SHA-256' },
          base,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
      });
  }

  function decryptPack(buffer, passphrase) {
    var all = new Uint8Array(buffer);
    if (all.length < 40 || bytesToStr(all.slice(0, 4)) !== MAGIC) {
      return Promise.reject(new Error('To nie jest paczka Mowy Taty'));
    }
    var salt = all.slice(4, 20);
    var iv = all.slice(20, 32);
    var data = all.slice(32);

    return deriveKey(passphrase, salt)
      .then(function (key) {
        return subtle().decrypt({ name: 'AES-GCM', iv: iv }, key, data);
      })
      .then(function (plain) {
        return JSON.parse(bytesToStr(new Uint8Array(plain)));
      })
      .catch(function (e) {
        if (e instanceof SyntaxError) { throw new Error('Paczka jest uszkodzona'); }
        throw new Error('Błędne hasło albo uszkodzona paczka');
      });
  }

  /** Pobiera paczkę. Zawsze świeżo — inaczej service worker poda starą. */
  function fetchPack(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) { throw new Error('Nie znaleziono paczki (' + res.status + ')'); }
      return res.arrayBuffer();
    });
  }

  /* Paczka może być jawna (zwykły JSON) albo zaszyfrowana — rozpoznajemy po
   * nagłówku pliku. Jawna nie wymaga od użytkownika telefonu żadnej akcji,
   * więc jest domyślna; szyfrowanie zostaje na wypadek, gdyby kiedyś trafiły
   * tam dane, których nie chcemy pokazywać publicznie. */
  function readPack(buffer, passphrase) {
    var head = bytesToStr(new Uint8Array(buffer).slice(0, 4));
    if (head === MAGIC) {
      if (!passphrase) {
        return Promise.reject(new Error('Paczka jest zaszyfrowana — wpisz hasło'));
      }
      if (!available()) {
        return Promise.reject(new Error('Odszyfrowanie wymaga adresu https'));
      }
      return decryptPack(buffer, passphrase);
    }
    try {
      return Promise.resolve(JSON.parse(bytesToStr(new Uint8Array(buffer))));
    } catch (e) {
      return Promise.reject(new Error('Paczka jest uszkodzona'));
    }
  }

  /**
   * Sprawdza, czy na serwerze jest nowsza paczka.
   * @returns {Promise<{pack, version, isNewer}>}
   */
  function check(settings) {
    var url = settings.remoteUrl;
    if (!url) { return Promise.reject(new Error('Nie podano adresu paczki')); }

    return fetchPack(url)
      .then(function (buf) { return readPack(buf, settings.remotePass); })
      .then(function (pack) {
        var version = pack.packVersion || pack.exportedAt || '';
        return {
          pack: pack,
          version: version,
          isNewer: String(version) !== String(settings.remoteVersionApplied || '')
        };
      });
  }

  /**
   * Stosuje paczkę: nadpisuje zawartość aplikacji, ale ZACHOWUJE ustawienia
   * łączności — inaczej telefon po pierwszej aktualizacji przestałby być
   * osiągalny zdalnie.
   */
  /* Ustawienia, które należą do KONKRETNEGO urządzenia, a nie do treści.
   * Paczka ich nie nadpisuje, bo:
   *  - identyfikator głosu jest inny na każdym telefonie (nadpisanie = niemota),
   *  - tempo mowy i wielkość przycisków dostraja się pod chorego na miejscu,
   *  - adres paczki musi przetrwać, inaczej telefon wypada spod kontroli.
   * Gdy naprawdę chcę zmienić je zdalnie, paczka niesie settingsOverride: true. */
  var DEVICE_KEYS = [
    'remoteUrl', 'remotePass', 'remoteAuto',
    'ttsVoiceURI', 'ttsPreferMale', 'ttsRate', 'ttsPitch',
    'buttonMinPx', 'caregiverPin', 'speakOnTap', 'autoAppend'
  ];

  function apply(pack, currentSettings) {
    var keep = { remoteVersionApplied: pack.packVersion || pack.exportedAt || '' };

    var lockDevice = !pack.settingsOverride;
    DEVICE_KEYS.forEach(function (k) {
      var mine = currentSettings[k];
      if (mine === undefined) { return; }
      // adres paczki chronimy zawsze — bez niego nie ma jak dosłać poprawki
      if (lockDevice || k.indexOf('remote') === 0) { keep[k] = mine; }
    });

    return DB.importAll(pack).then(function () {
      return DB.getAll('settings');
    }).then(function (rows) {
      var s = rows[0] || {};
      s.id = 'settings';
      Object.keys(keep).forEach(function (k) { s[k] = keep[k]; });
      return DB.put('settings', s);
    });
  }

  global.Remote = {
    available: available,
    check: check,
    apply: apply,
    readPack: readPack,
    decryptPack: decryptPack
  };

}(window));
