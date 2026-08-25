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
        openPanelFromUrl();
        checkRemote();
        scheduleRemoteChecks();
      })
      .catch(function (err) {
        el.boot.textContent = 'Błąd uruchamiania: ' + (err && err.message ? err.message : err);
      });
  }

  /* Wejście do trybu opiekuna adresem: .../mowa-taty/#opiekun
   * Gesty bywają przechwytywane przez system telefonu, a link działa zawsze
   * i da się go wysłać sobie z komputera. PIN nadal obowiązuje. */
  function openPanelFromUrl() {
    var marker = (location.hash + location.search).toLowerCase();
    if (marker.indexOf('opiekun') === -1) { return; }
    if (history.replaceState) {
      history.replaceState(null, '', location.pathname);   // nie zostawiaj w adresie
    }
    setTimeout(function () { Caregiver.requestAccess(); }, 300);
  }

  /* Zdalna aktualizacja: pobierz paczkę z serwera i zastosuj, jeśli jest
   * nowsza niż ostatnio wgrana. Dzieje się samo — chory nic nie robi.
   * Sprawdzamy przy starcie, po powrocie do aplikacji i co pół godziny,
   * żeby zmiana z komputera dotarła bez restartu telefonu. */
  var remoteBusy = false;

  function scheduleRemoteChecks() {
    if (S.settings.remoteAuto === false || !S.settings.remoteUrl) { return; }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { checkRemote(); }
    });
    setInterval(checkRemote, 30 * 60 * 1000);
  }

  function checkRemote() {
    var s = S.settings;
    if (!s.remoteUrl || s.remoteAuto === false || remoteBusy) { return; }
    remoteBusy = true;

    Remote.check(s).then(function (r) {
      if (!r.isNewer) { return null; }
      toast('Pobieram nowe ustawienia…');
      return Remote.apply(r.pack, s)
        .then(function () { return Caregiver.normalizeImages(); })
        .then(function () { return loadAll(); })
        .then(function () {
          applySettings();
          TTS.configure(S.settings);
          S.boardId = 'home'; S.stack = [];
          render(null);
          toast('Zaktualizowano zdalnie');
        });
    }).catch(function () {
      /* brak sieci albo brak paczki — aplikacja działa dalej offline */
    }).then(function () { remoteBusy = false; });
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

      /* Do istniejących tablic dokładamy wejścia do nowych działów.
       * Warunek „przycisku jeszcze nie ma w bazie" chroni przed wskrzeszaniem
       * tego, co opiekun świadomie skasował. */
      var boardsToSave = [];
      DefaultData.boards.forEach(function (def) {
        var mine = S.boards[def.id];
        if (!mine) { return; }
        var adds = (def.buttonIds || []).filter(function (id) {
          return !S.buttons[id] && (mine.buttonIds || []).indexOf(id) === -1;
        });
        if (!adds.length) { return; }
        adds.forEach(function (id) { needed[id] = true; });
        mine.buttonIds = (mine.buttonIds || []).concat(adds);
        boardsToSave.push(mine);
      });

      var newButtons = DefaultData.buttons.filter(function (btn) {
        return needed[btn.id] && !S.buttons[btn.id];
      });

      if (!newBoards.length && !newButtons.length && !boardsToSave.length) {
        meta.contentVersion = target;
        return DB.put('meta', meta).then(function () { return false; });
      }

      var jobs = [];
      if (newBoards.length) { jobs.push(DB.putMany('boards', newBoards)); }
      if (newButtons.length) { jobs.push(DB.putMany('buttons', newButtons)); }
      if (boardsToSave.length) { jobs.push(DB.putMany('boards', boardsToSave)); }
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

  /** Kadr zdjęcia jako wartość dla CSS object-position. */
  function imageFocus(imageId) {
    var rec = S.images[imageId];
    var fx = (rec && rec.focusX !== undefined) ? rec.focusX : 0.5;
    var fy = (rec && rec.focusY !== undefined) ? rec.focusY : 0.35;
    return Math.round(fx * 100) + '% ' + Math.round(fy * 100) + '%';
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
      inner += '<img class="photo" src="' + photo + '" alt="" ' +
               'style="object-position:' + imageFocus(btn.imageId) + '">';
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
      d.innerHTML = (photo ? '<img class="photo" src="' + photo + '" alt="" ' +
                             'style="object-position:' + imageFocus(p.imageId) + '">'
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

  /* ---- własne okienka -------------------------------------------------
   * prompt() i confirm() bywają ignorowane w zainstalowanej aplikacji
   * (iOS w trybie standalone, część przeglądarek na Androidzie). Skoro od
   * tego zależy wejście do trybu opiekuna i kasowanie danych, robimy własne. */

  function dialog(opts) {
    return new Promise(function (resolve) {
      var host = document.getElementById('dialogInner');
      host.innerHTML =
        '<h2>' + escapeHtml(opts.title || '') + '</h2>' +
        (opts.html || '') +
        '<div class="big-actions" id="dlgButtons"></div>';

      (opts.buttons || []).forEach(function (b) {
        var el = document.createElement('button');
        el.type = 'button';
        el.textContent = b.label;
        if (b.primary) { el.style.borderColor = '#0d47a1'; el.style.background = '#e3f2fd'; }
        if (b.danger) { el.style.borderColor = '#c62828'; el.style.color = '#c62828'; }
        el.addEventListener('click', function () {
          closeSheet('dialog');
          resolve(typeof b.value === 'function' ? b.value() : b.value);
        });
        document.getElementById('dlgButtons').appendChild(el);
      });

      if (opts.onOpen) { opts.onOpen(host, function (v) { closeSheet('dialog'); resolve(v); }); }
      openSheet('dialog');
    });
  }

  function confirmBox(message, okLabel) {
    return dialog({
      title: 'Potwierdź',
      html: '<div class="msg-preview">' + escapeHtml(message) + '</div>',
      buttons: [
        { label: okLabel || 'Tak', value: true, danger: true },
        { label: 'Anuluj', value: false, primary: true }
      ]
    });
  }

  /** Klawiatura numeryczna — wygodniejsza na telefonie niż pole tekstowe. */
  function askPin(title) {
    var entered = '';
    return dialog({
      title: title || 'PIN opiekuna',
      html: '<div class="msg-preview" id="pinView" style="text-align:center;' +
            'letter-spacing:10px;font-size:30px">·  ·  ·  ·</div>' +
            '<div class="keypad" id="keypad"></div>',
      buttons: [{ label: 'Anuluj', value: null }],
      onOpen: function (host, done) {
        var pad = host.querySelector('#keypad');
        var view = host.querySelector('#pinView');

        function draw() {
          view.textContent = entered
            ? entered.split('').map(function () { return '●'; }).join('  ')
            : '·  ·  ·  ·';
        }

        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].forEach(function (k) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = k;
          b.addEventListener('click', function () {
            if (k === '⌫') { entered = entered.slice(0, -1); draw(); return; }
            if (k === 'OK') { done(entered); return; }
            if (entered.length < 8) { entered += k; draw(); }
          });
          pad.appendChild(b);
        });
        draw();
      }
    });
  }

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
    // Ikony pasków rysujemy wektorowo — emoji były za małe i nieczytelne.
    el.btnSpeakAll.innerHTML = Icons.svg('głośnik') + '<span>Powiedz</span>';
    el.btnBackspace.innerHTML = Icons.svg('kosz') + '<span>Kasuj</span>';
    el.btnSend.innerHTML = Icons.svg('wyślij') + '<span>Wyślij</span>';
    el.btnUp.innerHTML = Icons.svg('wstecz') + '<span>Wstecz</span>';
    el.btnHome.innerHTML = Icons.svg('dom') + '<span>Start</span>';

    el.btnSpeakAll.addEventListener('click', function () {
      flash(el.btnSpeakAll);
      var t = sentenceText();
      if (t) { TTS.speak(t); }
    });

    // „Kasuj" czyści CAŁE zdanie. Pojedynczy element usuwa się dotknięciem
    // jego kafelka w pasku u góry — tak jest szybciej i mniej myląco.
    el.btnBackspace.addEventListener('click', function () {
      flash(el.btnBackspace);
      if (!S.sentence.length) { return; }
      S.sentence = [];
      renderSentence();
      TTS.stop();
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
    tapsToRun(el.boardHead, 5, 3000, function () { Caregiver.requestAccess(); });

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

  /* Przytrzymanie palca.
   *
   * Świadomie NIE używamy tu Pointer Events ani zdarzeń *cancel. Safari na
   * iPhonie przy długim przytrzymaniu odpala własny gest (zaznaczanie tekstu,
   * menu kontekstowe) i wysyła pointercancel — licznik był kasowany i nic się
   * nie działo. Zamiast tego: touch + mysz, przerwanie tylko przy ruchu palca
   * i przy puszczeniu. Callout wyłączamy w CSS. */
  function holdToRun(node, ms, fn) {
    var timer = null, sx = 0, sy = 0;

    function point(e) {
      if (e.touches && e.touches.length) { return e.touches[0]; }
      if (e.changedTouches && e.changedTouches.length) { return e.changedTouches[0]; }
      return e;
    }

    function start(e) {
      var p = point(e);
      sx = p.clientX; sy = p.clientY;
      clearTimeout(timer);
      timer = setTimeout(function () { timer = null; fn(); }, ms);
    }

    function move(e) {
      if (!timer) { return; }
      var p = point(e);
      if (Math.abs(p.clientX - sx) > 20 || Math.abs(p.clientY - sy) > 20) { stop(); }
    }

    function stop() { clearTimeout(timer); timer = null; }

    node.addEventListener('touchstart', start, { passive: true });
    node.addEventListener('touchmove', move, { passive: true });
    node.addEventListener('touchend', stop);
    node.addEventListener('mousedown', start);
    node.addEventListener('mousemove', move);
    node.addEventListener('mouseup', stop);
    node.addEventListener('mouseleave', stop);
  }

  /* Zapasowe wejście dla telefonów, na których przytrzymanie zostanie przejęte
   * przez system: pięć szybkich dotknięć nagłówka. */
  function tapsToRun(node, count, windowMs, fn) {
    var hits = [];
    node.addEventListener('click', function () {
      var now = Date.now();
      hits.push(now);
      hits = hits.filter(function (t) { return now - t < windowMs; });
      if (hits.length >= count) { hits = []; fn(); }
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
    imageFocus: imageFocus,
    escapeHtml: escapeHtml,
    dialog: dialog,
    confirmBox: confirmBox,
    askPin: askPin,
    setCaregiver: function (on) {
      S.caregiver = !!on;
      document.body.classList.toggle('caregiver', S.caregiver);
      render(null);
    },
    sentenceText: sentenceText
  };

  document.addEventListener('DOMContentLoaded', boot);

}(window));
