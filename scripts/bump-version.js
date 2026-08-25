/* bump-version.js — podbija numer wersji aplikacji w trzech miejscach naraz.
 *
 * Uruchomienie:
 *   node app/scripts/bump-version.js          → v5 na v6
 *   node app/scripts/bump-version.js v9       → ustawia konkretną
 *
 * Zmienia:
 *   app/sw.js        CACHE_VERSION  — czyści starą pamięć podręczną
 *   app/version.json version        — telefon po tym poznaje, że jest nowa wersja
 *   app/js/app.js    APP_VERSION    — wersja wbudowana w kod
 *
 * Rozjazd między nimi oznaczałby, że telefon nie zauważy aktualizacji, dlatego
 * pilnuje ich jeden skrypt, a nie pamięć człowieka.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..');
const SW = path.join(APP, 'sw.js');
const VER = path.join(APP, 'version.json');
const APPJS = path.join(APP, 'js', 'app.js');

function read(f) { return fs.readFileSync(f, 'utf8'); }

const swSrc = read(SW);
const current = (swSrc.match(/CACHE_VERSION\s*=\s*'mowa-taty-(v\d+)'/) || [])[1];
if (!current) {
  console.error('Nie znalazłem CACHE_VERSION w sw.js — przerywam.');
  process.exit(1);
}

let next = process.argv[2];
if (!next) {
  next = 'v' + (parseInt(current.slice(1), 10) + 1);
} else if (!/^v\d+$/.test(next)) {
  console.error('Wersja musi mieć postać v6, v7…');
  process.exit(1);
}

fs.writeFileSync(SW, swSrc.replace(
  /CACHE_VERSION\s*=\s*'mowa-taty-v\d+'/,
  "CACHE_VERSION = 'mowa-taty-" + next + "'"));

fs.writeFileSync(VER, JSON.stringify({ version: next }) + '\n');

const appSrc = read(APPJS);
const appNew = appSrc.replace(/APP_VERSION\s*=\s*'v\d+'/, "APP_VERSION = '" + next + "'");
if (appNew === appSrc) {
  console.error('Nie znalazłem APP_VERSION w js/app.js — sprawdź plik.');
  process.exit(1);
}
fs.writeFileSync(APPJS, appNew);

console.log('Wersja ' + current + ' → ' + next);
console.log('Zmienione: sw.js, version.json, js/app.js');
console.log('Wgraj te trzy pliki na GitHub — telefon zaktualizuje się sam.');
