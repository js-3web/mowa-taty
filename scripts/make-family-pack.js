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
  imagesOut.push({
    id: imageId,
    dataUrl: 'data:' + mime + ';base64,' + bytes.toString('base64'),
    caption: cap.full
  });

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

  people.push({
    id: 'p-' + slug,
    name: cap.name,
    fullName: cap.full,
    role: cap.role,
    vocative: accusative(cap.name),
    phone: '',
    imageId: imageId,
    order: people.length
  });
});

// wizytówka na tablicę „Do personelu"
const boards = JSON.parse(JSON.stringify(defaults.boards));
const buttons = defaults.buttons.concat(extraButtons);
if (extraButtons.length) {
  const personel = boards.filter((b) => b.id === 'personel')[0];
  if (personel) { personel.buttonIds = ['ja-wizytowka'].concat(personel.buttonIds); }
}

const pack = {
  exportedAt: new Date().toISOString(),
  meta: [Object.assign({}, defaults.meta, { id: 'meta' })],
  settings: [Object.assign({}, defaults.settings, { id: 'settings' })],
  boards: boards,
  buttons: buttons,
  people: people,
  images: imagesOut,
  usageLog: []
};

const outFile = 'mowa-taty-rodzina.json';
fs.writeFileSync(outFile, JSON.stringify(pack));

console.log('Zdjęcia: ' + images.length + ', bliscy: ' + people.length +
            (extraButtons.length ? ' + wizytówka użytkownika' : ''));
people.forEach((p) => console.log('  ' + p.role + ': ' + p.fullName +
                                  '  → „Chcę zobaczyć ' + p.vocative + '"'));
console.log('Zapisano ' + outFile + '  (' +
            Math.round(fs.statSync(outFile).size / 1024) + ' kB)');
console.log('Pliki zdjęć: ' + outDirPhotos);
