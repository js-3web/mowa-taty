/* app.js — rdzeń aplikacji: dane w pamięci, rysowanie tablic, obsługa dotknięć. */
(function (global) {
  'use strict';

  var S = {
    settings: null,
    boards: {},          // id -> board
    buttons: {},         // id -> button
    people: [],
    images: {},          // id -> rekord obrazka
    urls: {},            // imageId -> objectURL (cache)
    boardId: 'home',
    stack: [],
    sentence: [],        // [{id,label,speak,icon,imageId}]
    caregiver: false
  };

  var el = {};

  /* ================= start ================= */

  function boot() {
    ['boot', 'app', 'sentence', 'grid', 'boardHead', 'boardTitle', 'toast',
     'btnSpeakAll', 'btnBackspace', 'btnSend', 'btnYes', 'btnNo', 'btnUp', 'btnHome',
     'sendSheet', 'sendPreview', 'sendActions',
     'personSheet', 'personName', 'personPreview', 'personActions'
    ].forEach(function (id) { el[id] = document.getElementById(id); });

    DB.open()
      .then(seedIfEmpty)
      .then(loadAll)
      .then(mergeNewContent)
      .then(function (changed) { return changed ? loadAll() : null; })
      .then(function () {
        applySettings();
        requestPersistentStorage();
        TTS.init(S.settings);
        TTS.warmUp();
        bindUI();
        render('home');
        el.boot.classList.add('done');
        el.app.hidden = false;
      })
      .catch(function (err) {
        el.boot.textContent = 'Błąd uruchamiania: ' + (err && err.message ? err.message : err);
      });
  }

  /** Pierwsze uruchomienie: wsyp domyślną zawartość. */
  function seedIfEmpty() {
    return DB.getAll('boards').then(function (rows) {
      if (rows.length) { return null; }
      return Promise.all([
        DB.putMany('boards', DefaultData.boards),
        DB.putMany('buttons', DefaultData.buttons),
        DB.put('settings', DefaultData.settings),
        DB.put('meta', DefaultData.meta)
      ]);
    });
  }

  /* Dokłada tablice, które doszły w nowszej wersji aplikacji — ale niczego
   * nie nadpisuje. Przycisk zmieniony albo skasowany przez opiekuna zostaje
   * taki, jaki był. */
  function mergeNewContent() {
    var target = DefaultData.meta.contentVersion || 1;

    return DB.getAll('meta').then(function (rows) {
      var meta = rows[0];
      if (!meta || (meta.contentVersion || 1) >= target) { return false; }

      var newBoards = DefaultData.boards.filter(function (b) { return !S.boards[b.id]; });
      var needed = {};
      newBoards.forEach(function (b) {
        (b.buttonIds || []).forEach(function (id) { needed[id] = true; });
      });

      // Wejście do nowego działu na tablicy Start — tylko jeśli opiekun
      // wcześniej tego przycisku nie usunął.
      var home = S.boards.home;
      var homeDefault = DefaultData.boards.filter(function (b) { return b.id === 'home'; })[0];
      var homeAdds = [];
      if (home && homeDefault) {
        (homeDefault.buttonIds || []).forEach(function (id) {
          if (!S.buttons[id] && (home.buttonIds || []).indexOf(id) === -1) {
            homeAdds.push(id);
            needed[id] = true;
          }
        });
      }

      var newButtons = DefaultData.buttons.filter(function (btn) {
        return needed[btn.id] && !S.buttons[btn.id];
      });

      if (!newBoards.length && !newButtons.length && !homeAdds.length) {
        meta.contentVersion = target;
        return DB.put('meta', meta).then(function () { return false; });
      }

      var jobs = [];
      if (newBoards.length) { jobs.push(DB.putMany('boards', newBoards)); }
      if (newButtons.length) { jobs.push(DB.putMany('buttons', newButtons)); }
      if (homeAdds.length) {
        home.buttonIds = (home.buttonIds || []).concat(homeAdds);
        jobs.push(DB.put('boards', home));
      }
      meta.contentVersion = target;
      jobs.push(DB.put('meta', meta));

      return Promise.all(jobs).then(function () { return true; });
    }).catch(function () { return false; });
  }

  function loadAll() {
    return Promise.all([
      DB.getAll('boards'), DB.getAll('buttons'), DB.getAll('settings'),
      DB.getAll('people'), DB.getAll('images')
    ]).then(function (r) {
      S.boards = {}; r[0].forEach(function (b) { S.boards[b.id] = b; });
      S.buttons = {}; r[1].forEach(function (b) { S.buttons[b.id] = b; });
      S.settings = r[2][0] || DefaultData.settings;
      S.people = r[3].sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      S.images = {}; r[4].forEach(function (i) { S.images[i.id] = i; });
      Object.keys(S.urls).forEach(function (k) {
        if (S.urls[k] && S.urls[k].indexOf('blob:') === 0) { URL.revokeObjectURL(S.urls[k]); }
      });
      S.urls = {};
    });
  }

  function applySettings() {
    document.documentElement.style.setProperty(
      '--btn-min', (S.settings.buttonMinPx || 88) + 'px');
  }

  /* Zdjęcia bliskich i tablice żyją wyłącznie w pamięci przeglądarki. Bez tego
   * Android może je skasować przy braku miejsca ("best effort" storage).
   * Prośba o trwały magazyn nic nie kosztuje, a przy zainstalowanej PWA
   * Chrome zwykle ją przyznaje bez pytania użytkownika. */
  function requestPersistentStorage() {
    if (!navigator.storage || !navigator.storage.persist) { return; }
    navigator.storage.persisted().then(function (already) {
      if (!already) { return navigator.storage.persist(); }
      return true;
    }).catch(function () { /* brak wsparcia — kopia zapasowa i tak jest obowiązkowa */ });
  }

  function imageUrl(imageId) {
    if (!imageId) { return null; }
    if (S.urls[imageId]) { return S.urls[imageId]; }
    var u = DB.imageUrl(S.images[imageId]);
    if (u) { S.urls[imageId] = u; }
    return u;
  }

  /* ================= rysowanie ================= */

  function render(boardId) {
    if (boardId && boardId !== S.boardId) {
      if (S.boardId) { S.stack.push(S.boardId); }
      S.boardId = boardId;
    }
    var board = S.boards[S.boardId] || S.boards.home;
    if (!board) { return; }

    el.boardTitle.textContent = board.title || '';
    el.boardHead.style.setProperty('--board-color', board.color || '#37474f');
    el.grid.style.setProperty('--cols', board.cols || 3);
    el.grid.innerHTML = '';

    var ids = (board.buttonIds || []).slice();

    if (board.id === 'ludzie') {
      renderPeople();
    } else {
      ids.forEach(function (id) {
        var btn = S.buttons[id];
        if (btn) { el.grid.appendChild(tile(btn)); }
      });
    }

    if (S.caregiver) {
      el.grid.appendChild(addTile(board));
    }
  }

  function tile(btn) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'tile' + (btn.urgent ? ' urgent' : '') + (btn.type === 'pain' ? ' pain' : '');
    d.dataset.id = btn.id;
    if (btn.color) { d.style.setProperty('--tile-color', btn.color); }

    var inner = '';
    var photo = btn.imageId ? imageUrl(btn.imageId) : null;
    if (photo) {
      inner += '<img class="photo" src="' + photo + '" alt="">';
    } else if (btn.icon && Icons.raw[btn.icon]) {
      inner += Icons.svg(btn.icon);
    }
    if (btn.type !== 'pain' || !photo) {
      inner += '<span class="label">' + escapeHtml(btn.label || '') + '</span>';
    }
    d.innerHTML = inner;

    d.addEventListener('pointerdown', function () { flash(d); });
    d.addEventListener('click', function () { activate(btn, d); });
    return d;
  }

  function addTile(board) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'tile';
    d.style.setProperty('--tile-color', '#1565c0');
    d.innerHTML = Icons.svg('plus') + '<span class="label">Dodaj przycisk</span>';
    d.addEventListener('click', function () {
      if (board.id === 'ludzie') { Caregiver.addPerson(); }
      else { Caregiver.addButton(board.id); }
    });
    return d;
  }

  function renderPeople() {
    if (!S.people.length) {
      var info = document.createElement('div');
      info.className = 'tile';
      info.style.gridColumn = '1 / -1';
      info.innerHTML = '<span class="label">Brak bliskich.<br>' +
                       'Przytrzymaj nagłówek 3 sekundy, żeby dodać zdjęcia.</span>';
      el.grid.appendChild(info);
      return;
    }
    S.people.forEach(function (p) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'tile';
      d.style.setProperty('--tile-color', DefaultData.colors.ludzie);
      var photo = imageUrl(p.imageId);
      d.innerHTML = (photo ? '<img class="photo" src="' + photo + '" alt="">'
                           : Icons.svg('ludzie')) +
                    '<span class="label">' + escapeHtml(p.name) +
                    (p.role ? '<span class="role">' + escapeHtml(p.role.toLowerCase()) +
                              '</span>' : '') + '</span>';
      d.addEventListener('pointerdown', function () { flash(d); });
      d.addEventListener('click', function () {
        if (S.caregiver) { Caregiver.editPerson(p.id); return; }
        openPerson(p);
      });
      el.grid.appendChild(d);
    });
  }

  function flash(node) {
    // Mowa startuje ~1 s po dotknięciu — feedback musi być natychmiastowy,
    // inaczej użytkownik dotyka drugi raz i kasuje własną wypowiedź.
    node.classList.add('pressed');
    setTimeout(function () { node.classList.remove('pressed'); }, 220);
  }

  /* ================= działanie przycisków ================= */

  function activate(btn, node) {
    if (S.caregiver && btn.type !== 'navigate') { Caregiver.editButton(btn.id); return; }

    switch (btn.type) {
      case 'navigate':
        if (S.caregiver) { /* w trybie opiekuna nawigacja nadal działa */ }
        render(btn.targetBoard);
        break;

      case 'pain':
      case 'phrase':
      default:
        say(btn);
        break;
    }
    logUse(btn.id);
  }

  function say(btn) {
    var text = btn.speak || btn.label || '';
    if (S.settings.speakOnTap !== false) { TTS.speak(text); }
    if (S.settings.autoAppend !== false) {
      S.sentence.push({
        id: btn.id, label: btn.label, speak: text,
        icon: btn.icon, imageId: btn.imageId
      });
      renderSentence();
    }
  }

  function renderSentence() {
    el.sentence.innerHTML = '';
    S.sentence.forEach(function (item, idx) {
      var chip = document.createElement('span');
      chip.className = 'chip';
      var photo = item.imageId ? imageUrl(item.imageId) : null;
      chip.innerHTML = (photo ? '<img src="' + photo + '" alt="">'
                              : (item.icon && Icons.raw[item.icon] ? Icons.svg(item.icon) : '')) +
                       '<span>' + escapeHtml(item.label || '') + '</span>';
      chip.addEventListener('click', function () {
        S.sentence.splice(idx, 1);
        renderSentence();
      });
      el.sentence.appendChild(chip);
    });
    el.sentence.scrollLeft = el.sentence.scrollWidth;
    var empty = S.sentence.length === 0;
    el.btnSpeakAll.disabled = empty;
    el.btnBackspace.disabled = empty;
    el.btnSend.disabled = empty;
  }

  function sentenceText() {
    return S.sentence.map(function (i) { return i.speak; }).join(' ').trim();
  }

  function logUse(buttonId) {
    if (S.settings.logUsage === false) { return; }
    DB.put('usageLog', {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      buttonId: buttonId,
      ts: new Date().toISOString()
    });
  }

  /* ================= wysyłka ================= */

  function openSend() {
    var text = sentenceText();
    if (!text) { return; }
    el.sendPreview.textContent = text;
    el.sendActions.innerHTML = '';

    // 1. SMS do zapisanych bliskich
    S.people.filter(function (p) { return p.phone; }).forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'btn';
      a.href = Share.smsHref(text, p.phone);
      a.innerHTML = Icons.svg('sms') +
        '<span>SMS do: ' + escapeHtml(p.name) +
        '<span class="sub">' + escapeHtml(p.phone) + ' — otworzy się aplikacja SMS</span></span>';
      a.addEventListener('click', function () { closeSheet('sendSheet'); });
      el.sendActions.appendChild(a);
    });

    // 2. SMS bez numeru (wybór adresata w aplikacji SMS)
    var aAny = document.createElement('a');
    aAny.className = 'btn';
    aAny.href = Share.smsHref(text, '');
    aAny.innerHTML = Icons.svg('sms') +
      '<span>SMS — wybierz adresata<span class="sub">treść będzie już wpisana</span></span>';
    aAny.addEventListener('click', function () { closeSheet('sendSheet'); });
    el.sendActions.appendChild(aAny);

    // 3. Arkusz systemowy (Messenger, WhatsApp, e-mail…)
    el.sendActions.appendChild(actionButton(
      'udostępnij', 'Udostępnij (Messenger, WhatsApp…)',
      Share.canShareText() ? 'wybierzesz aplikację z listy' : whyNoShare(),
      Share.canShareText(),
      function () {
        Share.shareText(text).then(function () { closeSheet('sendSheet'); })
          .catch(function () { /* użytkownik anulował */ });
      }));

    // 4. Obrazek z wypalonym tekstem — najpewniejszy dla Messengera
    el.sendActions.appendChild(actionButton(
      'zdjęcie', 'Wyślij jako obrazek',
      Share.canShareFiles() ? 'obrazki + tekst na jednym zdjęciu' : whyNoShare(),
      Share.canShareFiles(),
      function () {
        toast('Przygotowuję obrazek…');
        Share.renderMessageImage(S.sentence.map(function (i) {
          return {
            imageUrl: i.imageId ? imageUrl(i.imageId) : null,
            iconSvg: (!i.imageId && i.icon && Icons.raw[i.icon])
                       ? Icons.svg(i.icon) : null,
            label: i.label
          };
        }), text).then(function (blob) {
          if (!blob) { toast('Nie udało się zrobić obrazka'); return; }
          return Share.shareImage(blob, text).then(function () { closeSheet('sendSheet'); });
        }).catch(function () { toast('Wysyłka anulowana'); });
      }));

    // 5. Schowek — zawsze
    el.sendActions.appendChild(actionButton(
      'kopiuj', 'Kopiuj tekst', 'wklej ręcznie w dowolnej aplikacji', true,
      function () {
        Share.copyText(text)
          .then(function () { toast('Skopiowano'); closeSheet('sendSheet'); })
          .catch(function () { toast('Nie udało się skopiować'); });
      }));

    openSheet('sendSheet');
  }

  /** Rozróżnia dwie różne przyczyny braku „Udostępnij" — inaczej komunikat myli. */
  function whyNoShare() {
    if (!Share.isSecure()) { return 'niedostępne — otwórz aplikację przez adres https'; }
    if (!navigator.share) { return 'ta przeglądarka tego nie ma — na telefonie zadziała'; }
    return 'niedostępne na tym urządzeniu';
  }

  function actionButton(icon, title, sub, enabled, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.disabled = !enabled;
    b.innerHTML = Icons.svg(icon) + '<span>' + escapeHtml(title) +
                  '<span class="sub">' + escapeHtml(sub) + '</span></span>';
    if (enabled) { b.addEventListener('click', onClick); }
    return b;
  }

  function openPerson(p) {
    var text = sentenceText();
    el.personName.textContent = p.name;
    el.personPreview.textContent = text || '(puste zdanie — najpierw zbuduj komunikat)';
    el.personActions.innerHTML = '';

    el.personActions.appendChild(actionButton(
      'dziękuję', 'Powiedz: ' + p.name, 'wypowie imię na głos', true,
      function () { TTS.speak('Chcę zobaczyć ' + (p.vocative || p.name) + '.'); }));

    if (p.phone) {
      var call = document.createElement('a');
      call.className = 'btn';
      call.href = Share.telHref(p.phone);
      call.innerHTML = Icons.svg('telefonuj') +
        '<span>Zadzwoń<span class="sub">' + escapeHtml(p.phone) + '</span></span>';
      el.personActions.appendChild(call);

      var sms = document.createElement('a');
      sms.className = 'btn';
      sms.href = Share.smsHref(text, p.phone);
      sms.innerHTML = Icons.svg('sms') +
        '<span>Wyślij SMS<span class="sub">' +
        (text ? 'treść już wpisana' : 'pusta wiadomość') + '</span></span>';
      el.personActions.appendChild(sms);
    }

    openSheet('personSheet');
  }

  /* ================= arkusze i drobiazgi ================= */

  function openSheet(id) { document.getElementById(id).classList.add('open'); }
  function closeSheet(id) { document.getElementById(id).classList.remove('open'); }

  var toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('show'); }, 2600);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ================= zdarzenia ================= */

  function bindUI() {
    el.btnSpeakAll.addEventListener('click', function () {
      flash(el.btnSpeakAll);
      var t = sentenceText();
      if (t) { TTS.speak(t); }
    });

    el.btnBackspace.addEventListener('click', function () {
      flash(el.btnBackspace);
      S.sentence.pop();
      renderSentence();
    });
    // Długie przytrzymanie „Kasuj" czyści całe zdanie.
    holdToRun(el.btnBackspace, 900, function () {
      S.sentence = [];
      renderSentence();
      toast('Wyczyszczono');
    });

    el.btnSend.addEventListener('click', function () { flash(el.btnSend); openSend(); });

    el.btnYes.addEventListener('click', function () { flash(el.btnYes); TTS.speak('Tak.'); });
    el.btnNo.addEventListener('click', function () { flash(el.btnNo); TTS.speak('Nie.'); });

    el.btnUp.addEventListener('click', function () {
      flash(el.btnUp);
      var prev = S.stack.pop() || 'home';
      S.boardId = prev;
      render(null);
    });

    el.btnHome.addEventListener('click', function () {
      flash(el.btnHome);
      S.stack = [];
      S.boardId = 'home';
      render(null);
    });

    // Tryb opiekuna: przytrzymanie nagłówka przez 3 s (sekcja c briefu).
    holdToRun(el.boardHead, 3000, function () { Caregiver.requestAccess(); });

    document.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { closeSheet(b.dataset.close); });
    });
    document.querySelectorAll('.sheet').forEach(function (sh) {
      sh.addEventListener('click', function (e) {
        if (e.target === sh) { sh.classList.remove('open'); }
      });
    });

    renderSentence();
  }

  function holdToRun(node, ms, fn) {
    var t = null;
    function start() { clearTimeout(t); t = setTimeout(fn, ms); }
    function cancel() { clearTimeout(t); }
    node.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      node.addEventListener(ev, cancel);
    });
  }

  /* ================= API dla panelu opiekuna ================= */

  global.App = {
    state: S,
    render: render,
    reload: function () { return loadAll().then(function () { applySettings(); render(null); }); },
    toast: toast,
    openSheet: openSheet,
    closeSheet: closeSheet,
    imageUrl: imageUrl,
    escapeHtml: escapeHtml,
    setCaregiver: function (on) {
      S.caregiver = !!on;
      document.body.classList.toggle('caregiver', S.caregiver);
      render(null);
    },
    sentenceText: sentenceText
  };

  document.addEventListener('DOMContentLoaded', boot);

}(window));
