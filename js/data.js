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
                  'n-r-rodzina', 'n-rozmowa2'] },

    /* ---------- druga część drzewka ---------- */
    { id: 'rozmowa2', title: 'Więcej rozmowy', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['n-r2-lekarz', 'n-r2-cialo', 'n-r2-rehab', 'n-r2-posilki',
                  'n-r2-ubranie', 'n-r2-dom', 'n-r2-zainteresowania',
                  'n-r2-sprawy', 'n-r2-emocje'] },

    { id: 'r2-lekarz', title: 'Rozmowa z lekarzem', color: KOLOR.personel, cols: 3,
      buttonIds: ['l-chce', 'l-cojest', 'l-wyzdrowieje', 'l-mowic', 'l-ilepotrwa',
                  'l-leki', 'l-operacja', 'l-boje', 'l-prosciej', 'l-niezrozumialem',
                  'l-prawda', 'l-wypis'] },

    { id: 'r2-cialo', title: 'Ciało i dolegliwości', color: KOLOR.bol, cols: 3,
      buttonIds: ['c-kreci', 'c-dretwieje', 'c-nieczuje', 'c-skurcz', 'c-swedzi',
                  'c-oczy', 'c-usta', 'c-sluch', 'c-wzrok', 'c-trzesie',
                  'c-slabo', 'c-serce'] },

    { id: 'r2-rehab', title: 'Rehabilitacja', color: KOLOR.rozmowa, cols: 3,
      buttonIds: ['h-chce', 'h-niedam', 'h-boli', 'h-jeszczeraz', 'h-wolniej',
                  'h-przerwa', 'h-pomaga', 'h-chodzic', 'h-reka', 'h-przytrzymaj'] },

    { id: 'r2-posilki', title: 'Posiłki', color: KOLOR.potrzeby, cols: 3,
      buttonIds: ['j-zupa', 'j-drugie', 'j-chleb', 'j-owoc', 'j-jogurt', 'j-slodkie',
                  'j-twarde', 'j-przelykanie', 'j-krztusze', 'j-nakarmcie',
                  'j-sam', 'j-sol'] },

    { id: 'r2-ubranie', title: 'Ubranie i wygoda', color: KOLOR.potrzeby, cols: 3,
      buttonIds: ['u-ubrac', 'u-rozebrac', 'u-nogi', 'u-poduszka', 'u-koc',
                  'u-czyste', 'u-uwiera', 'u-skarpetki', 'u-kapcie', 'u-okulary'] },

    { id: 'r2-dom', title: 'Dom i wspomnienia', color: KOLOR.ludzie, cols: 3,
      buttonIds: ['d-tesknie', 'd-jaktam', 'd-coslychac', 'd-ktojest', 'd-porzadku',
                  'd-zdjecia', 'd-opowiedz', 'd-pamietam', 'd-niepamietam',
                  'd-inaczej', 'd-lozko', 'd-kwiaty'] },

    { id: 'r2-zainteresowania', title: 'Telewizja i czas', color: KOLOR.dzien, cols: 3,
      buttonIds: ['z-wiadomosci', 'z-sport', 'z-muzyka', 'z-kanal', 'z-glosniej',
                  'z-ciszej', 'z-czytac', 'z-okno', 'z-nudzi', 'z-zostaw'] },

    { id: 'r2-sprawy', title: 'Sprawy i rzeczy', color: KOLOR.personel, cols: 3,
      buttonIds: ['s-rzeczy', 's-telefon', 's-okulary', 's-portfel', 's-zalatwcie',
                  's-rachunki', 's-praca', 's-dokumenty', 's-podpis', 's-niezgadzam'] },

    { id: 'r2-emocje', title: 'Emocje', color: KOLOR.czucie, cols: 3,
      buttonIds: ['e-ciesze', 'e-spokojny', 'e-martwie', 'e-wstyd', 'e-bezradny',
                  'e-dosc', 'e-niepoddam', 'e-cisza', 'e-przytul', 'e-zostaw'] },

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
    b('rr-rzeczy',      'Przynieście rzeczy',   'Przynieście proszę moje rzeczy.','książka',   { color: KOLOR.ludzie }),

    /* ================= druga część drzewka ================= */

    nav('n-rozmowa2', 'Więcej…', 'rozmowa2', 'plus', KOLOR.rozmowa),

    nav('n-r2-lekarz',          'U lekarza',    'r2-lekarz',          'personel',      KOLOR.personel),
    nav('n-r2-cialo',           'Ciało',        'r2-cialo',           'ciało',         KOLOR.bol),
    nav('n-r2-rehab',           'Rehabilitacja','r2-rehab',           'rehabilitacja', KOLOR.rozmowa),
    nav('n-r2-posilki',         'Posiłki',      'r2-posilki',         'jedzenie',      KOLOR.potrzeby),
    nav('n-r2-ubranie',         'Ubranie',      'r2-ubranie',         'ubranie',       KOLOR.potrzeby),
    nav('n-r2-dom',             'Dom',          'r2-dom',             'dom',           KOLOR.ludzie),
    nav('n-r2-zainteresowania', 'Telewizja',    'r2-zainteresowania', 'telewizor',     KOLOR.dzien),
    nav('n-r2-sprawy',          'Sprawy',       'r2-sprawy',          'książka',       KOLOR.personel),
    nav('n-r2-emocje',          'Emocje',       'r2-emocje',          'serce',         KOLOR.czucie),

    /* --- u lekarza --- */
    b('l-chce',            'Chcę lekarza',   'Chcę porozmawiać z lekarzem.',   'personel',  { color: KOLOR.personel }),
    b('l-cojest',          'Co mi jest?',    'Co mi właściwie jest?',          'pytanie',   { color: KOLOR.personel }),
    b('l-wyzdrowieje',     'Wyzdrowieję?',   'Czy wyzdrowieję?',               'pytanie',   { color: KOLOR.personel }),
    b('l-mowic',           'Będę mówił?',    'Czy będę znowu mówił?',          'dymek',     { color: KOLOR.personel }),
    b('l-ilepotrwa',       'Ile to potrwa?', 'Ile to wszystko potrwa?',        'czekać',    { color: KOLOR.personel }),
    b('l-leki',            'Jakie leki?',    'Jakie leki teraz biorę?',        'leki',      { color: KOLOR.personel }),
    b('l-operacja',        'Operacja?',      'Czy będzie operacja?',           'termometr', { color: KOLOR.personel }),
    b('l-boje',            'Boję się',       'Boję się tego badania.',         'strach',    { color: KOLOR.personel }),
    b('l-prosciej',        'Prościej',       'Wytłumaczcie mi to prościej.',   'powtórz',   { color: KOLOR.personel }),
    b('l-niezrozumialem',  'Nie zrozumiałem','Nie zrozumiałem lekarza.',       'pytanie',   { color: KOLOR.personel }),
    b('l-prawda',          'Chcę prawdy',    'Chcę wiedzieć, jak jest naprawdę.', 'dymek',  { color: KOLOR.personel }),
    b('l-wypis',           'Kiedy wypis?',   'Kiedy zostanę wypisany?',        'dom',       { color: KOLOR.personel }),

    /* --- ciało i dolegliwości --- */
    b('c-dretwieje', 'Drętwieje ręka', 'Drętwieje mi ręka.',         'ręka',      { color: KOLOR.bol }),
    b('c-kreci',     'Kręci się',      'Kręci mi się w głowie.',     'głowa',     { color: KOLOR.bol }),
    b('c-nieczuje',  'Nie czuję nogi', 'Nie czuję nogi.',            'noga',      { color: KOLOR.bol }),
    b('c-skurcz',    'Skurcz',         'Mam skurcz.',                'noga',      { color: KOLOR.bol }),
    b('c-swedzi',    'Swędzi',         'Swędzi mnie.',               'ciało',     { color: KOLOR.bol }),
    b('c-oczy',      'Pieką oczy',     'Pieką mnie oczy.',           'oko',       { color: KOLOR.bol }),
    b('c-usta',      'Sucho w ustach', 'Zaschło mi w ustach.',       'woda',      { color: KOLOR.bol }),
    b('c-sluch',     'Nie słyszę',     'Nie słyszę dobrze.',         'ucho',      { color: KOLOR.bol }),
    b('c-wzrok',     'Widzę słabo',    'Widzę niewyraźnie.',         'oko',       { color: KOLOR.bol }),
    b('c-trzesie',   'Trzęsą się ręce','Trzęsą mi się ręce.',        'ręka',      { color: KOLOR.bol }),
    b('c-slabo',     'Słabo mi',       'Zrobiło mi się słabo.',      'zmęczony',  { color: KOLOR.bol }),
    b('c-serce',     'Serce wali',     'Serce mi mocno bije.',       'serce',     { color: KOLOR.bol }),

    /* --- rehabilitacja --- */
    b('h-chce',         'Chcę ćwiczyć',  'Chcę ćwiczyć.',              'rehabilitacja', { color: KOLOR.rozmowa }),
    b('h-niedam',       'Nie dam rady',  'Nie dam rady więcej.',       'zmęczony',      { color: KOLOR.rozmowa }),
    b('h-boli',         'Boli przy tym', 'Boli mnie przy tym ćwiczeniu.', 'bol',        { color: KOLOR.bol }),
    b('h-jeszczeraz',   'Jeszcze raz',   'Jeszcze raz.',               'powtórz',       { color: KOLOR.rozmowa }),
    b('h-wolniej',      'Wolniej',       'Wolniej proszę.',            'czekać',        { color: KOLOR.rozmowa }),
    b('h-przerwa',      'Przerwa',       'Potrzebuję przerwy.',        'czekać',        { color: KOLOR.rozmowa }),
    b('h-pomaga',       'To pomaga',     'To mi dobrze robi.',         'dobrze',        { color: KOLOR.rozmowa }),
    b('h-chodzic',      'Chcę chodzić',  'Chcę spróbować chodzić.',    'noga',          { color: KOLOR.rozmowa }),
    b('h-reka',         'Podaj rękę',    'Podaj mi rękę.',             'ręka',          { color: KOLOR.rozmowa }),
    b('h-przytrzymaj',  'Przytrzymaj',   'Przytrzymaj mnie.',          'pomoc',         { color: KOLOR.rozmowa }),

    /* --- posiłki --- */
    b('j-zupa',        'Zupa',          'Poproszę zupę.',                 'jedzenie', { color: KOLOR.potrzeby }),
    b('j-drugie',      'Drugie danie',  'Poproszę drugie danie.',         'jedzenie', { color: KOLOR.potrzeby }),
    b('j-chleb',       'Chleb',         'Poproszę chleb.',                'jedzenie', { color: KOLOR.potrzeby }),
    b('j-owoc',        'Owoc',          'Poproszę owoc.',                 'jedzenie', { color: KOLOR.potrzeby }),
    b('j-jogurt',      'Jogurt',        'Poproszę jogurt.',               'jedzenie', { color: KOLOR.potrzeby }),
    b('j-slodkie',     'Coś słodkiego', 'Chcę coś słodkiego.',            'jedzenie', { color: KOLOR.potrzeby }),
    b('j-twarde',      'Za twarde',     'To jest za twarde, nie pogryzę.','ząb',      { color: KOLOR.potrzeby }),
    b('j-przelykanie', 'Ciężko przełknąć','Trudno mi przełykać.',         'gardło',   { color: KOLOR.bol }),
    b('j-krztusze',    'Krztuszę się',  'Krztuszę się.',                  'gardło',   { color: KOLOR.bol }),
    b('j-nakarmcie',   'Nakarmcie mnie','Nakarmcie mnie proszę.',         'pomoc',    { color: KOLOR.potrzeby }),
    b('j-sam',         'Zjem sam',      'Chcę zjeść sam.',                'ręka',     { color: KOLOR.potrzeby }),
    b('j-sol',         'Sól',           'Poproszę sól.',                  'jedzenie', { color: KOLOR.potrzeby }),

    /* --- ubranie i wygoda --- */
    b('u-ubrac',      'Chcę się ubrać',   'Chcę się ubrać.',            'ubranie',  { color: KOLOR.potrzeby }),
    b('u-rozebrac',   'Chcę się rozebrać','Chcę się rozebrać.',         'ubranie',  { color: KOLOR.potrzeby }),
    b('u-nogi',       'Zimne nogi',       'Zimno mi w nogi.',           'zimne',    { color: KOLOR.potrzeby }),
    b('u-poduszka',   'Poduszka',         'Poprawcie mi poduszkę.',     'łóżko',    { color: KOLOR.potrzeby }),
    b('u-koc',        'Koc',              'Poprawcie mi koc.',          'łóżko',    { color: KOLOR.potrzeby }),
    b('u-czyste',     'Czyste ubranie',   'Chcę czyste ubranie.',       'ubranie',  { color: KOLOR.potrzeby }),
    b('u-uwiera',     'Uwiera mnie',      'To ubranie mnie uwiera.',    'ubranie',  { color: KOLOR.potrzeby }),
    b('u-skarpetki',  'Skarpetki',        'Poproszę skarpetki.',        'ubranie',  { color: KOLOR.potrzeby }),
    b('u-kapcie',     'Kapcie',           'Poproszę kapcie.',           'ubranie',  { color: KOLOR.potrzeby }),
    b('u-okulary',    'Okulary',          'Podajcie mi okulary.',       'okulary',  { color: KOLOR.potrzeby }),

    /* --- dom i wspomnienia --- */
    b('d-tesknie',     'Tęsknię za domem', 'Tęsknię za domem.',              'dom',      { color: KOLOR.ludzie }),
    b('d-jaktam',      'Jak tam w domu?',  'Jak tam w domu?',                'dom',      { color: KOLOR.ludzie }),
    b('d-coslychac',   'Co słychać?',      'Co u Was słychać?',              'dymek',    { color: KOLOR.ludzie }),
    b('d-ktojest',     'Kto jest w domu?', 'Kto jest teraz w domu?',         'ludzie',   { color: KOLOR.ludzie }),
    b('d-porzadku',    'Wszystko OK?',     'Czy w domu wszystko w porządku?','pytanie',  { color: KOLOR.ludzie }),
    b('d-zdjecia',     'Zdjęcia',          'Chcę zobaczyć zdjęcia.',         'zdjęcie',  { color: KOLOR.ludzie }),
    b('d-opowiedz',    'Opowiedz mi',      'Opowiedz mi coś.',               'dymek',    { color: KOLOR.ludzie }),
    b('d-pamietam',    'Pamiętam to',      'Pamiętam to.',                   'dobrze',   { color: KOLOR.ludzie }),
    b('d-niepamietam', 'Nie pamiętam',     'Nie pamiętam tego.',             'pytanie',  { color: KOLOR.ludzie }),
    b('d-inaczej',     'Kiedyś inaczej',   'Kiedyś było inaczej.',           'kalendarz',{ color: KOLOR.ludzie }),
    b('d-lozko',       'Moje łóżko',       'Chcę wrócić do swojego łóżka.',  'łóżko',    { color: KOLOR.ludzie }),
    b('d-kwiaty',      'Podlejcie kwiaty', 'Podlejcie proszę kwiaty.',       'woda',     { color: KOLOR.ludzie }),

    /* --- telewizja i czas --- */
    b('z-wiadomosci', 'Wiadomości',    'Włącz wiadomości.',            'telewizor', { color: KOLOR.dzien }),
    b('z-sport',      'Sport',         'Włącz sport.',                 'telewizor', { color: KOLOR.dzien }),
    b('z-muzyka',     'Muzyka',        'Włącz muzykę.',                'muzyka',    { color: KOLOR.dzien }),
    b('z-kanal',      'Zmień kanał',   'Zmień kanał.',                 'telewizor', { color: KOLOR.dzien }),
    b('z-glosniej',   'Głośniej',      'Zrób głośniej.',               'głośnik',   { color: KOLOR.dzien }),
    b('z-ciszej',     'Ciszej',        'Zrób ciszej.',                 'cisza',     { color: KOLOR.dzien }),
    b('z-czytac',     'Chcę poczytać', 'Chcę poczytać.',               'książka',   { color: KOLOR.dzien }),
    b('z-okno',       'Popatrzeć',     'Chcę popatrzeć przez okno.',   'okno',      { color: KOLOR.dzien }),
    b('z-nudzi',      'Nudzi mi się',  'Nudzi mi się.',                'zmęczony',  { color: KOLOR.dzien }),
    b('z-zostaw',     'Zostaw włączone','Zostaw proszę włączone.',     'telewizor', { color: KOLOR.dzien }),

    /* --- sprawy i rzeczy --- */
    b('s-rzeczy',     'Moje rzeczy',    'Gdzie są moje rzeczy?',          'książka',   { color: KOLOR.personel }),
    b('s-telefon',    'Mój telefon',    'Gdzie jest mój telefon?',        'telefon',   { color: KOLOR.personel }),
    b('s-okulary',    'Moje okulary',   'Gdzie są moje okulary?',         'okulary',   { color: KOLOR.personel }),
    b('s-portfel',    'Mój portfel',    'Gdzie jest mój portfel?',        'książka',   { color: KOLOR.personel }),
    b('s-zalatwcie',  'Załatwcie to',   'Załatwcie to proszę za mnie.',   'pomoc',     { color: KOLOR.personel }),
    b('s-rachunki',   'Rachunki',       'Trzeba zapłacić rachunki.',      'książka',   { color: KOLOR.personel }),
    b('s-praca',      'Zadzwońcie',     'Zadzwońcie w mojej sprawie.',    'telefonuj', { color: KOLOR.personel }),
    b('s-dokumenty',  'Dokumenty',      'Potrzebuję moich dokumentów.',   'książka',   { color: KOLOR.personel }),
    b('s-podpis',     'Podpis',         'Nie mogę teraz podpisać.',       'książka',   { color: KOLOR.personel }),
    b('s-niezgadzam', 'Nie zgadzam się','Nie zgadzam się.',               'źle',       { color: KOLOR.personel }),

    /* --- emocje --- */
    b('e-ciesze',    'Cieszę się',     'Cieszę się.',                  'dobrze',   { color: KOLOR.czucie }),
    b('e-spokojny',  'Jestem spokojny','Jestem spokojny.',             'serce',    { color: KOLOR.czucie }),
    b('e-martwie',   'Martwię się',    'Martwię się.',                 'smutny',   { color: KOLOR.czucie }),
    b('e-wstyd',     'Wstyd mi',       'Wstyd mi.',                    'smutny',   { color: KOLOR.czucie }),
    b('e-bezradny',  'Bezradny',       'Czuję się bezradny.',          'smutny',   { color: KOLOR.czucie }),
    b('e-dosc',      'Mam dość',       'Mam już dość.',                'zdenerwowany', { color: KOLOR.czucie }),
    b('e-niepoddam', 'Nie poddam się', 'Nie poddam się.',              'dobrze',   { color: KOLOR.czucie }),
    b('e-cisza',     'Potrzebuję ciszy','Potrzebuję ciszy.',           'cisza',    { color: KOLOR.czucie }),
    b('e-przytul',   'Przytul mnie',   'Przytul mnie.',                'serce',    { color: KOLOR.czucie }),
    b('e-zostaw',    'Zostaw mnie',    'Zostaw mnie proszę na chwilę.','cisza',    { color: KOLOR.czucie })
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
    logUsage: true,

    // Zdalna konfiguracja: paczka leży obok aplikacji na GitHub Pages.
    // Telefon pobiera ją sam — użytkownik nie robi nic.
    remoteUrl: './paczka.json',
    remotePass: '',         // puste = paczka jawna; wypełnione = zaszyfrowana
    remoteAuto: true,
    remoteVersionApplied: ''
  };

  var META = {
    id: 'meta',
    schemaVersion: 1,
    // Podnieś, gdy dochodzą nowe tablice — istniejące instalacje dostaną je
    // przy najbliższym uruchomieniu, bez ruszania zmian opiekuna.
    contentVersion: 3,
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
