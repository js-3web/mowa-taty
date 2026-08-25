/* data.js — domyślna zawartość tablic (sekcja d briefu).
 *
 * Zasady:
 *  - etykieta przycisku ≠ komunikat wypowiadany („Głowa" → „Boli mnie głowa"),
 *  - słownictwo dorosłe, szpitalne, bez zdrobnień,
 *  - 6–9 pozycji na ekranie, maks. 2–3 dotknięcia do komunikatu,
 *  - kolor = kategoria semantyczna, spójna między tablicami.
 *
 * Wszystko poniżej to tylko wartości STARTOWE. Opiekun zmienia je w aplikacji,
 * a neurologopeda ma ostatnie słowo w doborze słownictwa.
 */
(function (global) {
  'use strict';

  var KOLOR = {
    bol:      '#c62828',   // ból i sytuacje pilne
    potrzeby: '#ef6c00',   // fizjologia: picie, jedzenie, toaleta
    czucie:   '#6a1b9a',   // samopoczucie, emocje
    ludzie:   '#f9a825',   // bliscy
    personel: '#1565c0',   // komunikacja z personelem, informacje
    leki:     '#283593',
    dzien:    '#00695c',   // codzienność, rozrywka
    rozmowa:  '#00838f'    // rozbudowane drzewko zdań
  };

  function b(id, label, speak, icon, extra) {
    var o = { id: id, label: label, speak: speak, icon: icon, type: 'phrase' };
    if (extra) { Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); }
    return o;
  }

  function nav(id, label, target, icon, color) {
    return { id: id, label: label, type: 'navigate', targetBoard: target,
             icon: icon, color: color };
  }

  var BOARDS = [
    { id: 'home', title: 'Start', isRoot: true, color: '#37474f', cols: 3,
      buttonIds: ['n-bol', 'p-pomoc', 'n-picie', 'n-jedzenie', 'n-toaleta',
                  'n-czucie', 'n-ludzie', 'n-dzien', 'n-personel', 'n-rozmowa'] },

    { id: 'bol', title: 'Gdzie boli?', color: KOLOR.bol, cols: 3,
      buttonIds: ['bol-glowa', 'bol-gardlo', 'bol-zab', 'bol-klatka', 'bol-brzuch',
                  'bol-plecy', 'bol-reka', 'bol-noga', 'n-skala'] },

    { id: 'skala', title: 'Jak bardzo boli? 0–10', color: KOLOR.bol, cols: 4,
      buttonIds: ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'] },

    { id: 'picie', title: 'Picie', color: KOLOR.potrzeby, cols: 3,
      buttonIds: ['pic-chce', 'pic-woda', 'pic-herbata', 'pic-gorace', 'pic-zimne',
                  'pic-niechce'] },

    { id: 'jedzenie', title: 'Jedzenie', color: KOLOR.potrzeby, cols: 3,
      buttonIds: ['jed-glodny', 'jed-chce', 'jed-niechce', 'jed-gorace', 'jed-zimne',
                  'jed-dosc'] },

    { id: 'toaleta', title: 'Toaleta i higiena', color: KOLOR.potrzeby, cols: 3,
      buttonIds: ['toa-musze', 'toa-pomoc', 'toa-umyc', 'toa-polozyc', 'toa-wstac',
                  'toa-przebrac'] },

    { id: 'czucie', title: 'Samopoczucie', color: KOLOR.czucie, cols: 3,
      buttonIds: ['cz-zmeczony', 'cz-dobrze', 'cz-zle', 'cz-smutny', 'cz-zdenerwowany',
                  'cz-zimno', 'cz-goraco', 'cz-spac', 'cz-dziekuje'] },

    { id: 'ludzie', title: 'Bliscy', color: KOLOR.ludzie, cols: 3,
      buttonIds: [] },   // wypełniane dynamicznie z listy osób

    { id: 'personel', title: 'Do personelu', color: KOLOR.personel, cols: 3,
      buttonIds: ['per-rehab', 'per-lekarz', 'per-dom', 'per-nierozumiem',
                  'per-powtorz', 'per-poczekaj', 'n-leki', 'per-samotny', 'per-dobrze'] },

    { id: 'leki', title: 'Leki', color: KOLOR.leki, cols: 3,
      buttonIds: ['lek-chce', 'lek-bol', 'lek-kiedy'] },

    { id: 'dzien', title: 'Codzienne', color: KOLOR.dzien, cols: 3,
      buttonIds: ['dz-tv', 'dz-telefon', 'dz-cisza', 'dz-okno', 'dz-swiatlo-on',
                  'dz-swiatlo-off'] },

    /* ---------- drzewko rozbudowane ----------
     * Zamiast automatycznej fleksji (której świadomie nie robimy — sekcja b briefu)
     * używamy ram zdaniowych: „Chcę…", „Czy mogę…?", „Kiedy…?". Każdy kafelek ma
     * gotowe, poprawne gramatycznie zdanie, a kafelki dają się łączyć w pasku
     * u góry, np. „Kiedy będzie obiad?" + „Dzisiaj." */
    { id: 'rozmowa', title: 'Rozmowa', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['n-r-chce', 'n-r-niechce', 'n-r-czymoge', 'n-r-kiedy', 'n-r-czuje',
                  'n-r-pytania', 'n-r-czas', 'n-r-odpowiedzi', 'n-r-uprzejmosci',
                  'n-r-rodzina'] },

    { id: 'r-chce', title: 'Chcę…', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['rc-woda', 'rc-herbata', 'rc-jesc', 'rc-spac', 'rc-wstac', 'rc-usiasc',
                  'rc-korytarz', 'rc-okno', 'rc-tv', 'rc-muzyka', 'rc-cisza', 'rc-telefon'] },

    { id: 'r-niechce', title: 'Nie chcę…', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['rn-jesc', 'rn-pic', 'rn-lezec', 'rn-spac', 'rn-rozmawiac',
                  'rn-lek', 'rn-tv', 'rn-teraz'] },

    { id: 'r-czymoge', title: 'Czy mogę…?', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['rm-wstac', 'rm-wyjsc', 'rm-zjesc', 'rm-napic', 'rm-zadzwonic',
                  'rm-toaleta', 'rm-umyc', 'rm-lek'] },

    { id: 'r-kiedy', title: 'Kiedy…?', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['rk-obiad', 'rk-lek', 'rk-rehab', 'rk-lekarz', 'rk-badanie',
                  'rk-wyniki', 'rk-odwiedziny', 'rk-dom'] },

    { id: 'r-czuje', title: 'Czuję…', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['rf-bol', 'rf-zawroty', 'rf-mdlosci', 'rf-dusznosc', 'rf-oslabienie',
                  'rf-goraczka', 'rf-strach', 'rf-zlosc', 'rf-spokoj'] },

    { id: 'r-pytania', title: 'Pytania', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['rp-cosie', 'rp-gdzie', 'rp-kto', 'rp-dlaczego', 'rp-jakdlugo',
                  'rp-ile', 'rp-coteraz', 'rp-powazne', 'rp-lekarzmowi'] },

    { id: 'r-czas', title: 'Czas', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['rt-teraz', 'rt-dzis', 'rt-jutro', 'rt-wczoraj', 'rt-rano',
                  'rt-poludnie', 'rt-wieczor', 'rt-noc', 'rt-zachwile'] },

    { id: 'r-odpowiedzi', title: 'Odpowiedzi', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['ro-niewiem', 'ro-moze', 'ro-chybatak', 'ro-chybanie', 'ro-niepamietam',
                  'ro-zapomnialem', 'ro-wolniej', 'ro-rozumiem', 'ro-nierozumiem'] },

    { id: 'r-uprzejmosci', title: 'Uprzejmości', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['ru-dziendobry', 'ru-dowidzenia', 'ru-dziekuje', 'ru-przepraszam',
                  'ru-prosze', 'ru-dobranoc'] },

    { id: 'r-rodzina', title: 'Do rodziny', color: KOLOR.ludzie, cols: 3,
      buttonIds: ['rr-tesknie', 'rr-przyjedzcie', 'rr-wporzadku', 'rr-lepiej',
                  'rr-gorzej', 'rr-zadzwoncie', 'rr-kocham', 'rr-kiedy', 'rr-rzeczy'] }
  ];

  var BUTTONS = [
    /* --- nawigacja ze startu ------------------------------------------ */
    nav('n-bol', 'Boli mnie', 'bol', 'bol', KOLOR.bol),
    b('p-pomoc', 'Potrzebuję pomocy', 'Potrzebuję pomocy.', 'pomoc',
      { color: KOLOR.bol, urgent: true }),
    nav('n-picie', 'Picie', 'picie', 'picie', KOLOR.potrzeby),
    nav('n-jedzenie', 'Jedzenie', 'jedzenie', 'jedzenie', KOLOR.potrzeby),
    nav('n-toaleta', 'Toaleta', 'toaleta', 'toaleta', KOLOR.potrzeby),
    nav('n-czucie', 'Samopoczucie', 'czucie', 'samopoczucie', KOLOR.czucie),
    nav('n-ludzie', 'Bliscy', 'ludzie', 'ludzie', KOLOR.ludzie),
    nav('n-dzien', 'Codzienne', 'dzien', 'codzienne', KOLOR.dzien),
    nav('n-personel', 'Do personelu', 'personel', 'personel', KOLOR.personel),
    nav('n-skala', 'Jak bardzo?', 'skala', 'skala', KOLOR.bol),
    nav('n-leki', 'Leki', 'leki', 'leki', KOLOR.leki),

    /* --- ból ------------------------------------------------------------ */
    b('bol-glowa',  'Głowa',           'Boli mnie głowa.',            'głowa',  { color: KOLOR.bol }),
    b('bol-gardlo', 'Gardło',          'Boli mnie gardło.',           'gardło', { color: KOLOR.bol }),
    b('bol-zab',    'Ząb',             'Boli mnie ząb.',              'ząb',    { color: KOLOR.bol }),
    b('bol-klatka', 'Klatka piersiowa','Boli mnie w klatce piersiowej.', 'klatka', { color: KOLOR.bol }),
    b('bol-brzuch', 'Brzuch',          'Boli mnie brzuch.',           'brzuch', { color: KOLOR.bol }),
    b('bol-plecy',  'Plecy',           'Bolą mnie plecy.',            'plecy',  { color: KOLOR.bol }),
    b('bol-reka',   'Ręka',            'Boli mnie ręka.',             'ręka',   { color: KOLOR.bol }),
    b('bol-noga',   'Noga',            'Boli mnie noga.',             'noga',   { color: KOLOR.bol }),

    /* --- skala bólu ------------------------------------------------------ */
    { id: 's0',  label: '0',  speak: 'Nie boli.',                   type: 'pain', value: 0 },
    { id: 's1',  label: '1',  speak: 'Ból jeden na dziesięć.',      type: 'pain', value: 1 },
    { id: 's2',  label: '2',  speak: 'Ból dwa na dziesięć.',        type: 'pain', value: 2 },
    { id: 's3',  label: '3',  speak: 'Ból trzy na dziesięć.',       type: 'pain', value: 3 },
    { id: 's4',  label: '4',  speak: 'Ból cztery na dziesięć.',     type: 'pain', value: 4 },
    { id: 's5',  label: '5',  speak: 'Ból pięć na dziesięć.',       type: 'pain', value: 5 },
    { id: 's6',  label: '6',  speak: 'Ból sześć na dziesięć.',      type: 'pain', value: 6 },
    { id: 's7',  label: '7',  speak: 'Ból siedem na dziesięć.',     type: 'pain', value: 7 },
    { id: 's8',  label: '8',  speak: 'Ból osiem na dziesięć.',      type: 'pain', value: 8 },
    { id: 's9',  label: '9',  speak: 'Ból dziewięć na dziesięć.',   type: 'pain', value: 9 },
    { id: 's10', label: '10', speak: 'Ból nie do zniesienia.',      type: 'pain', value: 10 },

    /* --- picie ----------------------------------------------------------- */
    b('pic-chce',    'Chcę pić',   'Chcę pić.',            'picie',   { color: KOLOR.potrzeby }),
    b('pic-woda',    'Woda',       'Poproszę wodę.',       'woda',    { color: KOLOR.potrzeby }),
    b('pic-herbata', 'Herbata',    'Poproszę herbatę.',    'herbata', { color: KOLOR.potrzeby }),
    b('pic-gorace',  'Za gorące',  'To jest za gorące.',   'gorące',  { color: KOLOR.potrzeby }),
    b('pic-zimne',   'Za zimne',   'To jest za zimne.',    'zimne',   { color: KOLOR.potrzeby }),
    b('pic-niechce', 'Nie chcę',   'Nie chcę pić.',        'pytanie', { color: KOLOR.potrzeby }),

    /* --- jedzenie -------------------------------------------------------- */
    b('jed-glodny', 'Jestem głodny', 'Jestem głodny.',      'jedzenie', { color: KOLOR.potrzeby }),
    b('jed-chce',   'Chcę jeść',     'Chcę jeść.',          'jedzenie', { color: KOLOR.potrzeby }),
    b('jed-niechce','Nie chcę jeść', 'Nie chcę jeść.',      'pytanie',  { color: KOLOR.potrzeby }),
    b('jed-gorace', 'Za gorące',     'To jest za gorące.',  'gorące',   { color: KOLOR.potrzeby }),
    b('jed-zimne',  'Za zimne',      'To jest za zimne.',   'zimne',    { color: KOLOR.potrzeby }),
    b('jed-dosc',   'Wystarczy',     'Dziękuję, wystarczy.','dziękuję', { color: KOLOR.potrzeby }),

    /* --- toaleta i higiena ------------------------------------------------ */
    b('toa-musze',   'Muszę do toalety', 'Muszę do toalety.',            'toaleta', { color: KOLOR.potrzeby }),
    b('toa-pomoc',   'Pomóż mi',         'Potrzebuję pomocy w toalecie.','pomoc',   { color: KOLOR.potrzeby }),
    b('toa-umyc',    'Chcę się umyć',    'Chcę się umyć.',               'myć',     { color: KOLOR.potrzeby }),
    b('toa-polozyc', 'Chcę się położyć', 'Chcę się położyć.',            'łóżko',   { color: KOLOR.potrzeby }),
    b('toa-wstac',   'Chcę wstać',       'Chcę wstać.',                  'ciało',   { color: KOLOR.potrzeby }),
    b('toa-przebrac','Chcę się przebrać','Chcę się przebrać.',           'ciało',   { color: KOLOR.potrzeby }),

    /* --- samopoczucie ------------------------------------------------------ */
    b('cz-zmeczony',    'Jestem zmęczony', 'Jestem zmęczony.',   'zmęczony',     { color: KOLOR.czucie }),
    b('cz-dobrze',      'Dobrze się czuję','Dobrze się czuję.',  'dobrze',       { color: KOLOR.czucie }),
    b('cz-zle',         'Źle się czuję',   'Źle się czuję.',     'źle',          { color: KOLOR.czucie }),
    b('cz-smutny',      'Jestem smutny',   'Jestem smutny.',     'smutny',       { color: KOLOR.czucie }),
    b('cz-zdenerwowany','Denerwuję się',   'Denerwuję się.',     'zdenerwowany', { color: KOLOR.czucie }),
    b('cz-zimno',       'Jest mi zimno',   'Jest mi zimno.',     'zimne',        { color: KOLOR.czucie }),
    b('cz-goraco',      'Jest mi gorąco',  'Jest mi gorąco.',    'gorące',       { color: KOLOR.czucie }),
    b('cz-spac',        'Chcę spać',       'Chcę spać.',         'spać',         { color: KOLOR.czucie }),
    b('cz-dziekuje',    'Dziękuję',        'Dziękuję.',          'dziękuję',     { color: KOLOR.czucie }),

    /* --- do personelu -------------------------------------------------------- */
    b('per-rehab',       'Kiedy rehabilitacja?', 'Kiedy jest rehabilitacja?', 'rehabilitacja', { color: KOLOR.personel }),
    b('per-lekarz',      'Kiedy lekarz?',        'Kiedy przyjdzie lekarz?',   'personel',      { color: KOLOR.personel }),
    b('per-dom',         'Chcę do domu',         'Chcę do domu.',             'dom',           { color: KOLOR.personel }),
    b('per-nierozumiem', 'Nie rozumiem',         'Nie rozumiem.',             'pytanie',       { color: KOLOR.personel }),
    b('per-powtorz',     'Powtórz proszę',       'Powtórz proszę.',           'powtórz',       { color: KOLOR.personel }),
    b('per-poczekaj',    'Poczekaj',             'Poczekaj chwilę.',          'czekać',        { color: KOLOR.personel }),
    b('per-samotny',     'Zostań ze mną',        'Zostań ze mną.',            'ludzie',        { color: KOLOR.personel }),
    b('per-dobrze',      'Dobrze',               'Dobrze.',                   'dobrze',        { color: KOLOR.personel }),

    /* --- leki ------------------------------------------------------------------ */
    b('lek-chce',  'Chcę lek',    'Chcę lek.',                       'leki', { color: KOLOR.leki }),
    b('lek-bol',   'Lek na ból',  'Boli mnie, potrzebuję leku.',     'leki', { color: KOLOR.leki }),
    b('lek-kiedy', 'Kiedy lek?',  'Kiedy dostanę lek?',              'leki', { color: KOLOR.leki }),

    /* --- codzienne ---------------------------------------------------------------- */
    b('dz-tv',          'Włącz telewizor', 'Włącz telewizor.',  'telewizor', { color: KOLOR.dzien }),
    b('dz-telefon',     'Chcę telefon',    'Chcę telefon.',     'telefon',   { color: KOLOR.dzien }),
    b('dz-cisza',       'Chcę ciszę',      'Chcę ciszę.',       'cisza',     { color: KOLOR.dzien }),
    b('dz-okno',        'Otwórz okno',     'Otwórz okno.',      'okno',      { color: KOLOR.dzien }),
    b('dz-swiatlo-on',  'Zapal światło',   'Zapal światło.',    'światło',   { color: KOLOR.dzien }),
    b('dz-swiatlo-off', 'Zgaś światło',    'Zgaś światło.',     'światło',   { color: KOLOR.dzien }),

    /* ================= drzewko rozbudowane ================= */

    nav('n-rozmowa', 'Rozmowa', 'rozmowa', 'dymek', KOLOR.rozmowa),

    nav('n-r-chce',        'Chcę…',        'r-chce',        'picie',        KOLOR.rozmowa),
    nav('n-r-niechce',     'Nie chcę…',    'r-niechce',     'pytanie',      KOLOR.rozmowa),
    nav('n-r-czymoge',     'Czy mogę…?',   'r-czymoge',     'pytanie',      KOLOR.rozmowa),
    nav('n-r-kiedy',       'Kiedy…?',      'r-kiedy',       'czekać',       KOLOR.rozmowa),
    nav('n-r-czuje',       'Czuję…',       'r-czuje',       'samopoczucie', KOLOR.rozmowa),
    nav('n-r-pytania',     'Pytania',      'r-pytania',     'dymek',        KOLOR.rozmowa),
    nav('n-r-czas',        'Czas',         'r-czas',        'kalendarz',    KOLOR.rozmowa),
    nav('n-r-odpowiedzi',  'Odpowiedzi',   'r-odpowiedzi',  'powtórz',      KOLOR.rozmowa),
    nav('n-r-uprzejmosci', 'Uprzejmości',  'r-uprzejmosci', 'dziękuję',     KOLOR.rozmowa),
    nav('n-r-rodzina',     'Do rodziny',   'r-rodzina',     'ludzie',       KOLOR.ludzie),

    /* --- Chcę… --- */
    b('rc-woda',     'wody',         'Chcę się napić wody.',           'woda',      { color: KOLOR.rozmowa }),
    b('rc-herbata',  'herbaty',      'Chcę herbatę.',                  'herbata',   { color: KOLOR.rozmowa }),
    b('rc-jesc',     'coś zjeść',    'Chcę coś zjeść.',                'jedzenie',  { color: KOLOR.rozmowa }),
    b('rc-spac',     'się przespać', 'Chcę się przespać.',             'spać',      { color: KOLOR.rozmowa }),
    b('rc-wstac',    'wstać',        'Chcę wstać z łóżka.',            'ciało',     { color: KOLOR.rozmowa }),
    b('rc-usiasc',   'usiąść',       'Chcę usiąść.',                   'łóżko',     { color: KOLOR.rozmowa }),
    b('rc-korytarz', 'na korytarz',  'Chcę wyjść na korytarz.',        'dom',       { color: KOLOR.rozmowa }),
    b('rc-okno',     'powietrza',    'Duszno mi, otwórz proszę okno.', 'okno',      { color: KOLOR.rozmowa }),
    b('rc-tv',       'telewizję',    'Chcę obejrzeć telewizję.',       'telewizor', { color: KOLOR.rozmowa }),
    b('rc-muzyka',   'muzykę',       'Chcę posłuchać muzyki.',         'muzyka',    { color: KOLOR.rozmowa }),
    b('rc-cisza',    'ciszę',        'Chcę, żeby było cicho.',         'cisza',     { color: KOLOR.rozmowa }),
    b('rc-telefon',  'zadzwonić',    'Chcę zadzwonić.',                'telefon',   { color: KOLOR.rozmowa }),

    /* --- Nie chcę… --- */
    b('rn-jesc',      'jeść',      'Nie chcę jeść.',            'jedzenie',  { color: KOLOR.rozmowa }),
    b('rn-pic',       'pić',       'Nie chcę pić.',             'picie',     { color: KOLOR.rozmowa }),
    b('rn-lezec',     'leżeć',     'Nie chcę już leżeć.',       'łóżko',     { color: KOLOR.rozmowa }),
    b('rn-spac',      'spać',      'Nie chcę spać.',            'spać',      { color: KOLOR.rozmowa }),
    b('rn-rozmawiac', 'rozmawiać', 'Nie chcę teraz rozmawiać.', 'cisza',     { color: KOLOR.rozmowa }),
    b('rn-lek',       'tego leku', 'Nie chcę tego leku.',       'leki',      { color: KOLOR.rozmowa }),
    b('rn-tv',        'telewizji', 'Wyłącz proszę telewizor.',  'telewizor', { color: KOLOR.rozmowa }),
    b('rn-teraz',     'teraz',     'Nie teraz. Później.',       'czekać',    { color: KOLOR.rozmowa }),

    /* --- Czy mogę…? --- */
    b('rm-wstac',     'wstać',      'Czy mogę wstać?',            'ciało',    { color: KOLOR.rozmowa }),
    b('rm-wyjsc',     'wyjść',      'Czy mogę wyjść z sali?',     'dom',      { color: KOLOR.rozmowa }),
    b('rm-zjesc',     'coś zjeść',  'Czy mogę coś zjeść?',        'jedzenie', { color: KOLOR.rozmowa }),
    b('rm-napic',     'napić się',  'Czy mogę się napić?',        'picie',    { color: KOLOR.rozmowa }),
    b('rm-zadzwonic', 'zadzwonić',  'Czy mogę zadzwonić?',        'telefon',  { color: KOLOR.rozmowa }),
    b('rm-toaleta',   'do toalety', 'Czy mogę pójść do toalety?', 'toaleta',  { color: KOLOR.rozmowa }),
    b('rm-umyc',      'umyć się',   'Czy mogę się umyć?',         'myć',      { color: KOLOR.rozmowa }),
    b('rm-lek',       'coś na ból', 'Czy mogę dostać coś na ból?','leki',     { color: KOLOR.rozmowa }),

    /* --- Kiedy…? --- */
    b('rk-obiad',      'obiad',         'Kiedy będzie obiad?',       'jedzenie',      { color: KOLOR.rozmowa }),
    b('rk-lek',        'lek',           'Kiedy dostanę lek?',        'leki',          { color: KOLOR.rozmowa }),
    b('rk-rehab',      'rehabilitacja', 'Kiedy jest rehabilitacja?', 'rehabilitacja', { color: KOLOR.rozmowa }),
    b('rk-lekarz',     'lekarz',        'Kiedy przyjdzie lekarz?',   'personel',      { color: KOLOR.rozmowa }),
    b('rk-badanie',    'badanie',       'Kiedy jest badanie?',       'termometr',     { color: KOLOR.rozmowa }),
    b('rk-wyniki',     'wyniki',        'Kiedy będą wyniki?',        'książka',       { color: KOLOR.rozmowa }),
    b('rk-odwiedziny', 'odwiedziny',    'Kiedy są odwiedziny?',      'ludzie',        { color: KOLOR.rozmowa }),
    b('rk-dom',        'do domu',       'Kiedy wrócę do domu?',      'dom',           { color: KOLOR.rozmowa }),

    /* --- Czuję… --- */
    b('rf-bol',        'ból',        'Boli mnie.',          'bol',          { color: KOLOR.bol }),
    b('rf-zawroty',    'zawroty',    'Mam zawroty głowy.',  'głowa',        { color: KOLOR.rozmowa }),
    b('rf-mdlosci',    'mdłości',    'Jest mi niedobrze.',  'brzuch',       { color: KOLOR.rozmowa }),
    b('rf-dusznosc',   'duszność',   'Ciężko mi oddychać.', 'klatka',       { color: KOLOR.bol }),
    b('rf-oslabienie', 'osłabienie', 'Jestem osłabiony.',   'zmęczony',     { color: KOLOR.rozmowa }),
    b('rf-goraczka',   'gorączka',   'Chyba mam gorączkę.', 'termometr',    { color: KOLOR.rozmowa }),
    b('rf-strach',     'strach',     'Boję się.',           'strach',       { color: KOLOR.rozmowa }),
    b('rf-zlosc',      'złość',      'Jestem zły.',         'zdenerwowany', { color: KOLOR.rozmowa }),
    b('rf-spokoj',     'spokój',     'Jestem spokojny.',    'dobrze',       { color: KOLOR.rozmowa }),

    /* --- Pytania --- */
    b('rp-cosie',      'Co się stało?',   'Co się stało?',         'dymek',    { color: KOLOR.rozmowa }),
    b('rp-gdzie',      'Gdzie jestem?',   'Gdzie jestem?',         'dom',      { color: KOLOR.rozmowa }),
    b('rp-kto',        'Kto to jest?',    'Kto to jest?',          'ludzie',   { color: KOLOR.rozmowa }),
    b('rp-dlaczego',   'Dlaczego?',       'Dlaczego?',             'pytanie',  { color: KOLOR.rozmowa }),
    b('rp-jakdlugo',   'Jak długo?',      'Jak długo to potrwa?',  'czekać',   { color: KOLOR.rozmowa }),
    b('rp-ile',        'Ile jeszcze?',    'Ile jeszcze?',          'czekać',   { color: KOLOR.rozmowa }),
    b('rp-coteraz',    'Co teraz?',       'Co teraz będzie?',      'dymek',    { color: KOLOR.rozmowa }),
    b('rp-powazne',    'Czy to poważne?', 'Czy to poważne?',       'personel', { color: KOLOR.rozmowa }),
    b('rp-lekarzmowi', 'Co mówi lekarz?', 'Co powiedział lekarz?', 'personel', { color: KOLOR.rozmowa }),

    /* --- Czas (dokleja się do zdania w pasku) --- */
    b('rt-teraz',    'teraz',       'Teraz.',       'czekać',    { color: KOLOR.rozmowa }),
    b('rt-dzis',     'dzisiaj',     'Dzisiaj.',     'kalendarz', { color: KOLOR.rozmowa }),
    b('rt-jutro',    'jutro',       'Jutro.',       'kalendarz', { color: KOLOR.rozmowa }),
    b('rt-wczoraj',  'wczoraj',     'Wczoraj.',     'kalendarz', { color: KOLOR.rozmowa }),
    b('rt-rano',     'rano',        'Rano.',        'słońce',    { color: KOLOR.rozmowa }),
    b('rt-poludnie', 'po południu', 'Po południu.', 'słońce',    { color: KOLOR.rozmowa }),
    b('rt-wieczor',  'wieczorem',   'Wieczorem.',   'spać',      { color: KOLOR.rozmowa }),
    b('rt-noc',      'w nocy',      'W nocy.',      'spać',      { color: KOLOR.rozmowa }),
    b('rt-zachwile', 'za chwilę',   'Za chwilę.',   'czekać',    { color: KOLOR.rozmowa }),

    /* --- Odpowiedzi --- */
    b('ro-niewiem',     'Nie wiem',         'Nie wiem.',           'pytanie', { color: KOLOR.rozmowa }),
    b('ro-moze',        'Może',             'Może.',               'pytanie', { color: KOLOR.rozmowa }),
    b('ro-chybatak',    'Chyba tak',        'Chyba tak.',          'dobrze',  { color: KOLOR.rozmowa }),
    b('ro-chybanie',    'Chyba nie',        'Chyba nie.',          'źle',     { color: KOLOR.rozmowa }),
    b('ro-niepamietam', 'Nie pamiętam',     'Nie pamiętam.',       'dymek',   { color: KOLOR.rozmowa }),
    b('ro-zapomnialem', 'Zapomniałem słowa','Zapomniałem słowa.',  'dymek',   { color: KOLOR.rozmowa }),
    b('ro-wolniej',     'Mów wolniej',      'Mów proszę wolniej.', 'powtórz', { color: KOLOR.rozmowa }),
    b('ro-rozumiem',    'Rozumiem',         'Rozumiem.',           'dobrze',  { color: KOLOR.rozmowa }),
    b('ro-nierozumiem', 'Nie rozumiem',     'Nie rozumiem.',       'pytanie', { color: KOLOR.rozmowa }),

    /* --- Uprzejmości --- */
    b('ru-dziendobry',  'Dzień dobry', 'Dzień dobry.', 'dobrze',   { color: KOLOR.rozmowa }),
    b('ru-dowidzenia',  'Do widzenia', 'Do widzenia.', 'dobrze',   { color: KOLOR.rozmowa }),
    b('ru-dziekuje',    'Dziękuję',    'Dziękuję.',    'dziękuję', { color: KOLOR.rozmowa }),
    b('ru-przepraszam', 'Przepraszam', 'Przepraszam.', 'dymek',    { color: KOLOR.rozmowa }),
    b('ru-prosze',      'Proszę',      'Proszę.',      'dymek',    { color: KOLOR.rozmowa }),
    b('ru-dobranoc',    'Dobranoc',    'Dobranoc.',    'spać',     { color: KOLOR.rozmowa }),

    /* --- Do rodziny (pisane na SMS) --- */
    b('rr-tesknie',     'Tęsknię',              'Tęsknię za Wami.',               'dziękuję',  { color: KOLOR.ludzie }),
    b('rr-przyjedzcie', 'Przyjedźcie',          'Przyjedźcie proszę.',            'ludzie',    { color: KOLOR.ludzie }),
    b('rr-wporzadku',   'Wszystko OK',          'Wszystko w porządku.',           'dobrze',    { color: KOLOR.ludzie }),
    b('rr-lepiej',      'Dziś lepiej',          'Dziś czuję się lepiej.',         'dobrze',    { color: KOLOR.ludzie }),
    b('rr-gorzej',      'Dziś gorzej',          'Dziś mam gorszy dzień.',         'źle',       { color: KOLOR.ludzie }),
    b('rr-zadzwoncie',  'Zadzwońcie',           'Zadzwońcie do mnie.',            'telefonuj', { color: KOLOR.ludzie }),
    b('rr-kocham',      'Kocham Was',           'Kocham Was.',                    'dziękuję',  { color: KOLOR.ludzie }),
    b('rr-kiedy',       'Kiedy przyjedziecie?', 'Kiedy przyjedziecie?',           'kalendarz', { color: KOLOR.ludzie }),
    b('rr-rzeczy',      'Przynieście rzeczy',   'Przynieście proszę moje rzeczy.','książka',   { color: KOLOR.ludzie })
  ];

  var SETTINGS = {
    id: 'settings',
    ttsLang: 'pl-PL',
    ttsVoiceURI: null,
    ttsRate: 0.9,
    ttsPitch: 1,
    caregiverPin: '2468',
    buttonMinPx: 88,
    speakOnTap: true,       // wypowiedz od razu po dotknięciu kafelka
    autoAppend: true,       // i dopisz do paska zdania
    logUsage: true
  };

  var META = {
    id: 'meta',
    schemaVersion: 1,
    // Podnieś, gdy dochodzą nowe tablice — istniejące instalacje dostaną je
    // przy najbliższym uruchomieniu, bez ruszania zmian opiekuna.
    contentVersion: 2,
    appName: 'Mowa Taty',
    createdAt: new Date().toISOString()
  };

  global.DefaultData = {
    boards: BOARDS,
    buttons: BUTTONS,
    settings: SETTINGS,
    meta: META,
    colors: KOLOR
  };

}(window));
