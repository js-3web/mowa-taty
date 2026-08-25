/* make-family-pack.js — buduje paczkę importową z pliku .docx ze zdjęciami rodziny.
 *
 * Uruchomienie:
 *   node app/scripts/make-family-pack.js "Zdjęcia rodziny/razem.docx"
 *
 * Wynik (w katalogu głównym projektu, NIE w app/):
 *   mowa-taty-rodzina.json          ← wczytujesz w aplikacji: Opiekun → Wczytaj kopię
 *   Zdjęcia rodziny/wyodrębnione/   ← te same zdjęcia jako pliki, na wszelki wypadek
 *
 * UWAGA RODO: plik JSON zawiera zdjęcia rodziny. Nie wrzucaj go do repozytorium
 * ani do chmury — przenieś na telefon kablem albo prywatną wiadomością.
 *
 * .docx to zwykły ZIP, więc czytamy go bez żadnych bibliotek.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ---------- minimalny czytnik ZIP ---------- */

function readZip(buf) {
  // Szukamy End of Central Directory od końca pliku.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) { throw new Error('To nie jest poprawny plik ZIP/DOCX'); }

  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const files = {};

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) { break; }
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);

    // Nagłówek lokalny ma własne długości pól — trzeba je przeczytać osobno.
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.slice(dataStart, dataStart + compSize);

    files[name] = method === 0 ? raw : zlib.inflateRawSync(raw);
    off += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

/* ---------- odczyt podpisów ---------- */

function parseDocx(files) {
  const xml = files['word/document.xml'].toString('utf8');
  const relsXml = files['word/_rels/document.xml.rels'].toString('utf8');

  const rels = {};
  relsXml.replace(/Id="([^"]+)"[^>]*Target="([^"]+)"/g, (m, id, target) => {
    rels[id] = target.replace(/^\/?/, '');
    return m;
  });

  // Idziemy paragraf po paragrafie: zbieramy obrazki, potem podpisy.
  const paras = xml.split('<w:p ').slice(1);
  const images = [];   // ścieżki w kolejności dokumentu
  const captions = []; // podpisy w kolejności dokumentu

  paras.forEach((p) => {
    (p.match(/r:embed="([^"]+)"/g) || []).forEach((m) => {
      const id = m.match(/"([^"]+)"/)[1];
      if (rels[id]) { images.push('word/' + rels[id].replace(/^word\//, '')); }
    });
    const txt = (p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
      .map((s) => s.replace(/<[^>]+>/g, ''))
      .join('')
      .trim();
    if (txt) {
      // Jeden paragraf potrafi zawierać dwa podpisy sklejone: „Wnuk – A""Wnuk – B".
      splitCaptions(txt).forEach((c) => captions.push(c));
    }
  });

  return { images, captions };
}

/** Rozdziela sklejone podpisy typu „Wnuk – Tymek SarafinWnuk – Franek Sarafin". */
function splitCaptions(text) {
  const ROLES = ['Ja', 'Syn', 'Synowa', 'Córka', 'Zięć', 'Wnuk', 'Wnuczka',
                 'Żona', 'Mąż', 'Brat', 'Siostra', 'Przyjaciel', 'Przyjaciółka'];
  const re = new RegExp('(' + ROLES.join('|') + ')\\s*[–-]\\s*', 'g');
  const marks = [];
  let m;
  while ((m = re.exec(text)) !== null) { marks.push(m.index); }
  if (marks.length <= 1) { return [text.trim()]; }
  return marks.map((start, i) => {
    const end = i + 1 < marks.length ? marks[i + 1] : text.length;
    return text.slice(start, end).trim();
  });
}

/** „Wnuk – Tymek Sarafin" → { role: 'Wnuk', name: 'Tymek', full: 'Tymek Sarafin' } */
function parseCaption(caption) {
  const parts = caption.split(/\s*[–-]\s*/);
  const role = (parts[0] || '').trim();
  const full = (parts.slice(1).join(' ') || '').trim();
  return { role: role, full: full, name: full.split(/\s+/)[0] || full };
}

/* ---------- wymiary i obrót zdjęcia (bez bibliotek) ---------- */

/** Wymiary JPEG z nagłówka SOF. */
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xC0 && marker <= 0xCF &&
        marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    if (i + 4 > buf.length) { break; }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

/** Orientacja EXIF (1–8). 5–8 oznaczają obrót o 90°, czyli zamianę boków. */
function exifOrientation(buf) {
  const app1 = buf.indexOf(Buffer.from('Exif\0\0'));
  if (app1 < 0) { return 1; }
  const tiff = app1 + 6;
  if (tiff + 8 > buf.length) { return 1; }

  const little = buf.toString('ascii', tiff, tiff + 2) === 'II';
  const u16 = (o) => little ? buf.readUInt16LE(o) : buf.readUInt16BE(o);
  const u32 = (o) => little ? buf.readUInt32LE(o) : buf.readUInt32BE(o);

  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > buf.length) { return 1; }
  const count = u16(ifd);

  for (let n = 0; n < count; n++) {
    const entry = ifd + 2 + n * 12;
    if (entry + 12 > buf.length) { break; }
    if (u16(entry) === 0x0112) { return u16(entry + 8) || 1; }
  }
  return 1;
}

/** Im wyższe zdjęcie, tym wyżej twarz — ta sama reguła co w aplikacji. */
function suggestFocusY(w, h) {
  if (!w || !h || h <= w) { return 0.5; }
  return Math.max(0.2, Math.min(0.5, Math.round((0.5 / (h / w)) * 100) / 100));
}

function imageMeta(bytes) {
  const size = jpegSize(bytes);
  if (!size) { return {}; }
  const rotated = exifOrientation(bytes) >= 5;
  const w = rotated ? size.h : size.w;
  const h = rotated ? size.w : size.h;
  return { width: w, height: h, focusY: suggestFocusY(w, h) };
}

/* ---------- polski biernik dla „Chcę zobaczyć…" ---------- */

function accusative(name) {
  const wyjatki = {
    'Jarosław': 'Jarka', 'Krzysztof': 'Krzyśka', 'Jerzy': 'Jerzego',
    'Tymek': 'Tymka', 'Franek': 'Franka', 'Kuba': 'Kubę',
    'Anna': 'Anię', 'Hania': 'Hanię', 'Marika': 'Marikę'
  };
  if (wyjatki[name]) { return wyjatki[name]; }
  if (/a$/.test(name)) { return name.slice(0, -1) + 'ę'; }   // Marta → Martę
  if (/[kgptbdfsz]$/i.test(name)) { return name + 'a'; }      // Piotr → Piotra
  return name;
}

/* ---------- wczytanie domyślnych tablic z data.js ---------- */

function loadDefaults() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');
  const sandbox = { window: {} };
  // data.js kończy się wywołaniem (window) — podstawiamy własny obiekt.
  new Function('window', src)(sandbox.window);
  return sandbox.window.DefaultData;
}

/* ---------- główna robota ---------- */

const docxPath = process.argv[2] || path.join('Zdjęcia rodziny', 'razem.docx');
if (!fs.existsSync(docxPath)) {
  console.error('Nie znaleziono pliku: ' + docxPath);
  process.exit(1);
}

const files = readZip(fs.readFileSync(docxPath));
const { images, captions } = parseDocx(files);

function wczytajJson(nazwa) {
  const p = path.join(path.dirname(docxPath), nazwa);
  if (!fs.existsSync(p)) { return {}; }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    // Świadomie przerywamy zamiast ostrzec i lecieć dalej: po cichu pominięty
    // plik konfiguracyjny oznacza paczkę bez numerów telefonów, a przyczynę
    // odkrywa się dopiero na telefonie chorego.
    console.error('\nBŁĄD: plik ' + nazwa + ' ma niepoprawny format JSON.');
    console.error(e.message);
    console.error('Najczęstsza przyczyna: cudzysłów " wewnątrz tekstu.');
    console.error('Popraw plik i uruchom skrypt ponownie — paczka NIE została zbudowana.');
    process.exit(1);
  }
}

// Ręczne poprawki kadru i obrotu — patrz „Zdjęcia rodziny/kadr.json".
const overrides = wczytajJson('kadr.json');

// Numery telefonów — patrz „Zdjęcia rodziny/bliscy.json".
const kontakty = wczytajJson('bliscy.json');

if (images.length !== captions.length) {
  console.warn('Uwaga: ' + images.length + ' zdjęć i ' + captions.length +
               ' podpisów — sprawdź wynik ręcznie.');
}

const defaults = loadDefaults();
const outDirPhotos = path.join(path.dirname(docxPath), 'wyodrębnione');
if (!fs.existsSync(outDirPhotos)) { fs.mkdirSync(outDirPhotos, { recursive: true }); }

const people = [];
const imagesOut = [];
const extraButtons = [];
const bezNumeru = [];

images.forEach((imgPath, i) => {
  const bytes = files[imgPath];
  if (!bytes) { console.warn('Brak danych obrazka: ' + imgPath); return; }

  const cap = parseCaption(captions[i] || ('Osoba ' + (i + 1)));
  const slug = cap.name.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/[żź]/g, 'z')
    .replace(/[^a-z0-9]/g, '') || ('osoba' + i);

  // kopia pliku dla użytkownika
  const ext = path.extname(imgPath) || '.jpeg';
  fs.writeFileSync(path.join(outDirPhotos, cap.role + ' - ' + cap.full + ext), bytes);

  const imageId = 'img-' + slug;
  const mime = /\.png$/i.test(imgPath) ? 'image/png' : 'image/jpeg';
  const meta = imageMeta(bytes);
  const fix = overrides[slug] || {};
  if (fix.rotate) {
    meta.rotate = fix.rotate;
    // Po obrocie o 90° boki się zamieniają — kadr policz dla nowych proporcji.
    if (fix.rotate % 180 !== 0 && meta.width) {
      const w = meta.height, h = meta.width;
      meta.width = w; meta.height = h;
      meta.focusY = suggestFocusY(w, h);
    }
  }
  if (fix.focusY !== undefined) { meta.focusY = fix.focusY; }

  imagesOut.push(Object.assign({
    id: imageId,
    dataUrl: 'data:' + mime + ';base64,' + bytes.toString('base64'),
    caption: cap.full
  }, meta));

  if (meta.width) {
    console.log('  ' + cap.full + ': ' + meta.width + 'x' + meta.height +
                ', kadr ' + Math.round(meta.focusY * 100) + '%' +
                (meta.rotate ? ', obrót ' + meta.rotate + '°' : '') +
                (fix.focusY !== undefined ? ' (ręcznie)' : '') +
                (meta.height / meta.width > 1.6 ? '  ← bardzo wysokie, lepszy byłby portret' : ''));
  }

  if (cap.role.toLowerCase() === 'ja') {
    // Zdjęcie samego użytkownika — nie trafia do „Bliskich", tylko na tablicę
    // „Do personelu" jako wizytówka.
    extraButtons.push({
      id: 'ja-wizytowka',
      label: 'To ja',
      speak: 'Nazywam się ' + cap.full + '.',
      type: 'phrase',
      icon: 'ludzie',
      imageId: imageId,
      color: '#1565c0'
    });
    return;
  }

  const kontakt = kontakty[slug] || {};
  const telefon = (kontakt.telefon || '').trim();

  people.push({
    id: 'p-' + slug,
    name: cap.name,
    fullName: cap.full,
    role: cap.role,
    vocative: (kontakt.wolacz || '').trim() || accusative(cap.name),
    phone: telefon,
    imageId: imageId,
    order: people.length
  });

  if (!telefon) { bezNumeru.push(cap.name); }
});

// wizytówka na tablicę „Do personelu"
const boards = JSON.parse(JSON.stringify(defaults.boards));
const buttons = defaults.buttons.concat(extraButtons);
if (extraButtons.length) {
  const personel = boards.filter((b) => b.id === 'personel')[0];
  if (personel) { personel.buttonIds = ['ja-wizytowka'].concat(personel.buttonIds); }
}

/* Domyślnie paczka NIE rusza ustawień urządzenia (głos, tempo mowy, wielkość
 * przycisków, PIN) — te dostraja się przy chorym i szkoda je kasować przy
 * każdej zmianie treści. Flaga --ustawienia wymusza nadpisanie także ich. */
const nadpiszUstawienia = process.argv.indexOf('--ustawienia') !== -1;

const pack = {
  exportedAt: new Date().toISOString(),
  packVersion: new Date().toISOString(),
  settingsOverride: nadpiszUstawienia,
  meta: [Object.assign({}, defaults.meta, { id: 'meta' })],
  settings: [Object.assign({}, defaults.settings, { id: 'settings' })],
  boards: boards,
  buttons: buttons,
  people: people,
  images: imagesOut,
  usageLog: []
};

// Paczka zdalna — ląduje od razu w app/, żeby poszła na GitHub razem z apką.
// Telefon pobiera ją sam przy uruchomieniu; nikt nic nie wpisuje.
const remoteFile = path.join(__dirname, '..', 'paczka.json');
fs.writeFileSync(remoteFile, JSON.stringify(pack));

// Ta sama treść w katalogu głównym — do ręcznego wczytania („Wczytaj kopię").
const outFile = 'mowa-taty-rodzina.json';
fs.writeFileSync(outFile, JSON.stringify(pack));

console.log('Zdjęcia: ' + images.length + ', bliscy: ' + people.length +
            (extraButtons.length ? ' + wizytówka użytkownika' : ''));
people.forEach((p) => console.log('  ' + p.role + ': ' + p.fullName +
                                  '  → „Chcę zobaczyć ' + p.vocative + '"' +
                                  (p.phone ? '  ☎ ' + p.phone : '  (bez numeru)')));
if (bezNumeru.length) {
  console.log('\nBez numeru telefonu (nie będzie „Zadzwoń" ani „SMS"): ' +
              bezNumeru.join(', '));
  console.log('Numery dopisz w „Zdjęcia rodziny/bliscy.json".');
}
console.log('Zapisano app/paczka.json  (' +
            Math.round(fs.statSync(remoteFile).size / 1024) + ' kB)  ← WRZUĆ NA GITHUB');
console.log('Zapisano ' + outFile + '  (kopia do ręcznego wczytania)');
console.log('Pliki zdjęć: ' + outDirPhotos);
console.log('Wersja paczki: ' + pack.packVersion);
console.log(nadpiszUstawienia
  ? 'Ustawienia urządzenia ZOSTANĄ nadpisane (głos, tempo, wielkość przycisków, PIN).'
  : 'Ustawienia urządzenia zostaną nietknięte. Aby wysłać także je: --ustawienia');

/* ---------- wersja zaszyfrowana, do wrzucenia na serwer ---------- */

const passIdx = process.argv.indexOf('--haslo');
if (passIdx !== -1) {
  const pass = process.argv[passIdx + 1];
  if (!pass || pass.length < 6) {
    console.error('\nHasło musi mieć co najmniej 6 znaków: --haslo "twojehaslo"');
    process.exit(1);
  }

  const crypto = require('crypto');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(pass, salt, 200000, 32, 'sha256');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(pack), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const encFile = path.join(__dirname, '..', 'paczka.enc');
  fs.writeFileSync(encFile, Buffer.concat([Buffer.from('MTP1'), salt, iv, ct, tag]));

  console.log('\nZaszyfrowano: app/paczka.enc  (' +
              Math.round(fs.statSync(encFile).size / 1024) + ' kB)');
  console.log('Wrzuć TEN plik na GitHub razem z aplikacją.');
  console.log('Wersja paczki: ' + pack.packVersion);
} else {
  console.log('\nPaczka jest jawna. Gdybyś kiedyś chciał ją zaszyfrować: --haslo "twojehaslo"');
}
