/* icons.js — wbudowany zestaw ikon SVG.
 *
 * Dlaczego własne ikony, a nie ARASAAC (sekcja e briefu):
 *  - działają offline bez pobierania czegokolwiek,
 *  - brak zależności od sieci przy pierwszym uruchomieniu,
 *  - brak kwestii licencyjnych przy ewentualnym udostępnieniu apki dalej.
 * ARASAAC zostaje jako rozbudowa (API opisane w briefie) — opiekun może już
 * dziś podmienić dowolną ikonę na własne zdjęcie, co dla dorosłego po udarze
 * i tak jest skuteczniejsze (McKelvey i wsp. 2010).
 *
 * Każda ikona to zawartość <svg viewBox="0 0 100 100">. Styl nadaje CSS.
 */
(function (global) {
  'use strict';

  // Twarz — jedna baza, różne miny. Dzięki temu emocje wyglądają spójnie.
  function face(mouth, brows) {
    return '<circle cx="50" cy="50" r="34"/>' +
           '<circle cx="38" cy="42" r="3.5" fill="currentColor" stroke="none"/>' +
           '<circle cx="62" cy="42" r="3.5" fill="currentColor" stroke="none"/>' +
           (brows || '') + mouth;
  }

  // Sylwetka — jedna baza, czerwony znacznik w innym miejscu.
  function body(mx, my) {
    var s = '<g stroke-width="4">' +
            '<circle cx="50" cy="16" r="10"/>' +
            '<path d="M46 27 L46 31 L54 31 L54 27"/>' +
            '<path d="M46 30 L37 34 L35 53 L38 66 L37 80 L63 80 L62 66 L65 53 L63 34 L54 30 Z"/>' +
            '<path d="M37 34 L27 40 L22 63 L27 65 L35 45"/>' +
            '<path d="M63 34 L73 40 L78 63 L73 65 L65 45"/>' +
            '<path d="M38 80 L35 98 L43 99 L49 84 L51 84 L57 99 L65 98 L62 80 Z"/>' +
            '</g>';
    if (mx !== undefined) {
      s += '<circle cx="' + mx + '" cy="' + my + '" r="9" ' +
           'fill="none" stroke="#c62828" stroke-width="6"/>';
    }
    return s;
  }

  var ICONS = {

    /* --- kategorie główne ------------------------------------------- */
    bol:      '<path d="M58 8 L26 56 L47 56 L41 94 L75 42 L52 42 Z"/>',
    pomoc:    '<path d="M28 68 Q28 34 50 30 Q72 34 72 68"/><path d="M18 68 L82 68"/>' +
              '<circle cx="50" cy="25" r="5"/><path d="M43 77 Q50 86 57 77"/>',
    picie:    '<path d="M28 20 L38 88 L62 88 L72 20 Z"/><path d="M33 54 L67 54"/>',
    jedzenie: '<circle cx="50" cy="52" r="22"/><circle cx="50" cy="52" r="13" stroke-width="3.5"/>' +
              '<g stroke-width="4"><path d="M9 16 L9 36"/><path d="M17 16 L17 36"/>' +
              '<path d="M25 16 L25 36"/><path d="M9 36 L25 36"/><path d="M17 36 L17 88"/>' +
              '<path d="M85 16 Q93 32 93 50 L85 54"/><path d="M85 16 L85 88"/></g>',
    toaleta:  '<rect x="30" y="8" width="40" height="18" rx="3"/>' +
              '<ellipse cx="50" cy="52" rx="26" ry="22"/>' +
              '<ellipse cx="50" cy="52" rx="16" ry="13" stroke-width="3.5"/>' +
              '<path d="M38 72 L35 90 L65 90 L62 72"/>',
    ludzie:   '<circle cx="34" cy="30" r="14"/><path d="M12 84 Q12 56 34 56 Q56 56 56 84"/>' +
              '<circle cx="70" cy="34" r="11" stroke-width="4.5"/>' +
              '<path d="M52 84 Q52 62 70 62 Q88 62 88 84" stroke-width="4.5"/>',
    personel: '<circle cx="50" cy="50" r="36"/><path d="M50 30 L50 70"/><path d="M30 50 L70 50"/>',
    leki:     '<rect x="14" y="38" width="72" height="26" rx="13"/><path d="M50 38 L50 64"/>' +
              '<circle cx="30" cy="51" r="4" fill="currentColor" stroke="none"/>',
    codzienne:'<rect x="12" y="26" width="76" height="50" rx="5"/>' +
              '<path d="M34 88 L66 88"/><path d="M50 76 L50 88"/>' +
              '<path d="M28 14 L46 26"/><path d="M72 14 L54 26"/>',
    samopoczucie: face('<path d="M36 62 Q50 72 64 62"/>'),

    /* --- części ciała (jedna sylwetka, różny znacznik) ---------------- */
    'ciało':  body(),
    głowa:    body(50, 16),
    ząb:      body(56, 22),
    gardło:   body(50, 30),
    klatka:   body(50, 42),
    brzuch:   body(50, 60),
    plecy:    body(66, 50),
    ręka:     body(25, 55),
    noga:     body(40, 90),

    /* --- napoje i jedzenie -------------------------------------------- */
    woda:     '<path d="M50 10 Q78 44 78 62 A28 28 0 0 1 22 62 Q22 44 50 10 Z"/>',
    herbata:  '<path d="M18 40 L18 66 Q18 82 38 82 L54 82 Q74 82 74 66 L74 40 Z"/>' +
              '<path d="M74 46 Q90 46 90 56 Q90 66 74 66"/><path d="M18 40 L74 40"/>' +
              '<path d="M34 26 Q40 18 34 10"/><path d="M52 26 Q58 18 52 10"/>',
    gorące:   '<path d="M30 76 Q22 56 34 44 Q38 60 46 52 Q56 38 48 18 Q78 34 74 62 ' +
              'Q72 80 56 86" stroke-width="5"/>',
    zimne:    '<path d="M50 12 L50 88"/><path d="M17 31 L83 69"/><path d="M83 31 L17 69"/>' +
              '<path d="M42 22 L50 30 L58 22"/><path d="M42 78 L50 70 L58 78"/>',

    /* --- czynności ------------------------------------------------------ */
    spać:     '<path d="M62 18 A34 34 0 1 0 62 82 A27 27 0 1 1 62 18 Z"/>',
    zmęczony: face('<path d="M36 66 Q50 58 64 66"/>',
                   '<path d="M30 34 L44 38"/><path d="M70 34 L56 38"/>'),
    dobrze:   face('<path d="M34 58 Q50 74 66 58"/>'),
    źle:      face('<path d="M34 70 Q50 54 66 70"/>'),
    smutny:   face('<path d="M34 70 Q50 56 66 70"/>',
                   '<path d="M30 32 L44 38"/><path d="M70 32 L56 38"/>'),
    zdenerwowany: face('<path d="M34 68 L66 68"/>',
                   '<path d="M32 30 L46 40"/><path d="M68 30 L54 40"/>'),
    dziękuję: '<path d="M50 84 L22 58 Q8 44 20 30 Q34 16 50 34 Q66 16 80 30 ' +
              'Q92 44 78 58 Z"/>',
    myć:      '<path d="M22 44 L78 44 L70 86 L30 86 Z"/><path d="M50 12 L50 44"/>' +
              '<path d="M34 24 Q50 6 66 24" stroke-width="4"/>',
    łóżko:    '<path d="M10 40 L10 82"/><path d="M10 56 L90 56 L90 82"/>' +
              '<path d="M10 70 L90 70"/><circle cx="28" cy="44" r="9"/>' +
              '<path d="M40 56 L40 44 L74 44 L74 56"/>',
    telewizor:'<rect x="10" y="24" width="80" height="52" rx="4"/>' +
              '<path d="M34 88 L66 88"/><path d="M50 76 L50 88"/>',
    telefon:  '<rect x="28" y="8" width="44" height="84" rx="7"/>' +
              '<path d="M42 20 L58 20"/><circle cx="50" cy="80" r="4"/>',
    cisza:    '<path d="M22 38 L38 38 L58 20 L58 80 L38 62 L22 62 Z"/>' +
              '<path d="M70 36 L88 64"/><path d="M88 36 L70 64"/>',
    światło:  '<path d="M36 66 Q22 54 22 42 A28 28 0 0 1 78 42 Q78 54 64 66 L64 76 L36 76 Z"/>' +
              '<path d="M40 86 L60 86"/>',
    okno:     '<rect x="14" y="14" width="72" height="72" rx="3"/>' +
              '<path d="M50 14 L50 86"/><path d="M14 50 L86 50"/>',
    dom:      '<path d="M12 48 L50 14 L88 48"/><path d="M22 44 L22 88 L78 88 L78 44"/>' +
              '<path d="M40 88 L40 60 L60 60 L60 88"/>',
    czekać:   '<circle cx="50" cy="50" r="36"/><path d="M50 26 L50 52 L68 62"/>',
    powtórz:  '<path d="M24 42 A28 28 0 1 1 26 62"/><path d="M12 30 L26 44 L40 32"/>',
    pytanie:  '<rect x="12" y="18" width="76" height="52" rx="10"/>' +
              '<path d="M34 70 L31 90 L52 70"/>' +
              '<text x="50" y="58" text-anchor="middle" font-size="42" font-weight="700" ' +
              'stroke="none" fill="currentColor" font-family="Segoe UI, Arial, sans-serif">?</text>',
    rehabilitacja: '<path d="M14 50 L26 50"/><path d="M74 50 L86 50"/>' +
              '<rect x="26" y="34" width="12" height="32" rx="3"/>' +
              '<rect x="62" y="34" width="12" height="32" rx="3"/>' +
              '<path d="M38 50 L62 50"/>',

    /* --- rozmowa rozbudowana --------------------------------------------- */
    muzyka:   '<circle cx="30" cy="72" r="13"/><circle cx="72" cy="62" r="13"/>' +
              '<path d="M43 72 L43 26 L85 16 L85 62"/><path d="M43 40 L85 30"/>',
    książka:  '<path d="M50 26 Q32 14 12 20 L12 78 Q32 72 50 84 Q68 72 88 78 L88 20 ' +
              'Q68 14 50 26 Z"/><path d="M50 26 L50 84"/>',
    kalendarz:'<rect x="12" y="22" width="76" height="66" rx="6"/>' +
              '<path d="M12 42 L88 42"/><path d="M32 12 L32 30"/><path d="M68 12 L68 30"/>' +
              '<circle cx="34" cy="58" r="4" fill="currentColor" stroke="none"/>' +
              '<circle cx="52" cy="58" r="4" fill="currentColor" stroke="none"/>',
    dymek:    '<rect x="10" y="18" width="80" height="54" rx="12"/>' +
              '<path d="M32 72 L28 92 L52 72"/>' +
              '<path d="M30 38 L70 38"/><path d="M30 54 L58 54"/>',
    słońce:   '<circle cx="50" cy="50" r="20"/>' +
              '<path d="M50 10 L50 22"/><path d="M50 78 L50 90"/>' +
              '<path d="M10 50 L22 50"/><path d="M78 50 L90 50"/>' +
              '<path d="M22 22 L30 30"/><path d="M70 70 L78 78"/>' +
              '<path d="M78 22 L70 30"/><path d="M30 70 L22 78"/>',
    termometr:'<path d="M40 68 L40 24 Q40 12 50 12 Q60 12 60 24 L60 68"/>' +
              '<circle cx="50" cy="78" r="13"/><path d="M50 32 L50 66" stroke-width="8"/>' +
              '<path d="M72 26 L84 20"/><path d="M72 44 L86 44"/>',
    strach:   face('<ellipse cx="50" cy="66" rx="9" ry="11"/>',
                   '<path d="M30 30 L44 36"/><path d="M70 30 L56 36"/>'),

    /* --- funkcje aplikacji ---------------------------------------------- */
    skala:    '<path d="M10 62 L90 62"/><path d="M22 62 L22 46"/><path d="M38 62 L38 38"/>' +
              '<path d="M54 62 L54 30"/><path d="M70 62 L70 22"/><path d="M86 62 L86 14"/>',
    sms:      '<rect x="10" y="20" width="80" height="54" rx="8"/>' +
              '<path d="M30 82 L27 96 L48 82"/><path d="M28 40 L72 40"/><path d="M28 54 L58 54"/>',
    udostępnij:'<circle cx="24" cy="50" r="12"/><circle cx="74" cy="24" r="12"/>' +
              '<circle cx="74" cy="76" r="12"/><path d="M35 44 L63 30"/><path d="M35 56 L63 70"/>',
    kopiuj:   '<rect x="14" y="14" width="50" height="60" rx="5"/>' +
              '<path d="M36 86 L86 86 L86 26 L76 26"/>',
    telefonuj:'<path d="M22 16 L38 14 L46 36 L34 44 Q44 64 60 72 L70 60 L90 70 L88 86 ' +
              'Q46 88 22 16 Z"/>',
    zdjęcie:  '<rect x="10" y="26" width="80" height="58" rx="6"/>' +
              '<circle cx="50" cy="55" r="17"/><path d="M34 26 L40 16 L60 16 L66 26"/>',
    plus:     '<path d="M50 20 L50 80"/><path d="M20 50 L80 50"/>',
    dom_ikona:'<path d="M12 48 L50 14 L88 48"/><path d="M22 44 L22 88 L78 88 L78 44"/>'
  };

  /** Zwraca gotowy <svg> albo null, jeśli nie ma takiej ikony. */
  function svg(name, extraClass) {
    var body = ICONS[name];
    if (!body) { return null; }
    return '<svg class="ico ' + (extraClass || '') + '" viewBox="0 0 100 100" ' +
           'aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  global.Icons = { svg: svg, names: Object.keys(ICONS), raw: ICONS };

}(window));
