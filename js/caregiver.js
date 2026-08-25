/* caregiver.js — tryb opiekuna: personalizacja, zdjęcia bliskich, kopia zapasowa,
 * diagnostyka głosu.
 *
 * Wejście: przytrzymanie nagłówka tablicy przez 3 sekundy + PIN (domyślnie 2468).
 * Chodzi o to, żeby chory nie wszedł tu przypadkiem, a nie o realne zabezpieczenie.
 */
(function (global) {
  'use strict';

  var panel, inner;

  function E(s) { return App.escapeHtml(s); }

  function ready() {
    panel = document.getElementById('caregiverPanel');
    inner = document.getElementById('caregiverInner');
  }

  /* ---------------- wejście ---------------- */

  function requestAccess() {
    ready();
    if (App.state.caregiver) { openMain(); return; }

    var pin = App.state.settings.caregiverPin;
    if (!pin) { App.setCaregiver(true); openMain(); return; }

    App.askPin('PIN opiekuna').then(function (given) {
      if (given === null || given === undefined) { return; }
      if (String(given).trim() !== String(pin)) { App.toast('Błędny PIN'); return; }
      App.setCaregiver(true);
      openMain();
    });
  }

  function openMain() {
    ready();
    var d = TTS.diagnostics();
    var s = App.state.settings;

    inner.innerHTML =
      '<h2>Tryb opiekuna</h2>' +

      '<div class="cg-section">' +
        '<h3>Głos</h3>' +
        '<div class="status ' + d.level + '">' + E(d.message) + '</div>' +
        '<div style="font-size:13px;color:#5a6672;margin-bottom:8px">' +
          'Głosów łącznie: ' + d.total + ' · polskich: ' + d.pl +
          ' · offline: ' + d.plOffline +
          (d.lastLagMs !== null ? ' · ostatni start: ' + d.lastLagMs + ' ms' : '') +
          ' · internet: ' + (d.online ? 'jest' : 'brak') +
        '</div>' +
        '<div class="cg-row"><label for="cgVoice">Głos</label>' +
          '<select id="cgVoice">' +
            '<option value="">(automatycznie — najlepszy polski)</option>' +
            d.voices.map(function (v) {
              return '<option value="' + E(v.uri) + '"' +
                     (s.ttsVoiceURI === v.uri ? ' selected' : '') + '>' +
                     E(v.name) + (v.local ? ' — offline' : ' — sieciowy') + '</option>';
            }).join('') +
          '</select></div>' +
        '<div class="cg-row"><label for="cgRate">Tempo mowy</label>' +
          '<input id="cgRate" type="range" min="0.5" max="1.3" step="0.05" value="' +
            (s.ttsRate || 0.9) + '"></div>' +
        '<div class="cg-actions">' +
          '<button type="button" id="cgTestVoice">Sprawdź głos</button>' +
          '<button type="button" id="cgRefreshVoices">Odśwież listę głosów</button>' +
        '</div>' +
      '</div>' +

      '<div class="cg-section">' +
        '<h3>Bliscy (zdjęcia i numery)</h3>' +
        '<div class="people-list" id="cgPeople"></div>' +
        '<div class="cg-actions" style="margin-top:8px">' +
          '<button type="button" class="primary" id="cgAddPerson">+ Dodaj osobę</button>' +
        '</div>' +
      '</div>' +

      '<div class="cg-section">' +
        '<h3>Wygląd i zachowanie</h3>' +
        '<div class="cg-row"><label for="cgBtnSize">Wielkość przycisków</label>' +
          '<input id="cgBtnSize" type="range" min="72" max="140" step="4" value="' +
            (s.buttonMinPx || 88) + '"></div>' +
        '<div class="cg-row"><label for="cgSpeakOnTap">Mów po dotknięciu</label>' +
          '<input id="cgSpeakOnTap" type="checkbox"' +
            (s.speakOnTap !== false ? ' checked' : '') + '></div>' +
        '<div class="cg-row"><label for="cgAppend">Dopisuj do zdania</label>' +
          '<input id="cgAppend" type="checkbox"' +
            (s.autoAppend !== false ? ' checked' : '') + '></div>' +
        '<div class="cg-row"><label for="cgPin">PIN opiekuna</label>' +
          '<input id="cgPin" type="text" inputmode="numeric" value="' +
            E(s.caregiverPin || '') + '"></div>' +
      '</div>' +

      '<div class="cg-section">' +
        '<h3>Zdalna aktualizacja</h3>' +
        '<div style="font-size:13px;color:#5a6672;margin-bottom:8px">' +
          'Paczka leży obok aplikacji na serwerze. Zmieniasz ją na komputerze, ' +
          'telefon pobiera ją sam — przy uruchomieniu, po powrocie do aplikacji ' +
          'i co pół godziny. Nikt nic tu nie musi wpisywać.</div>' +
        '<div class="cg-row"><label for="cgRemoteUrl">Adres paczki</label>' +
          '<input id="cgRemoteUrl" type="text" value="' + E(s.remoteUrl || '') +
          '" placeholder="./paczka.json"></div>' +
        '<div class="cg-row"><label for="cgRemotePass">Hasło (opcjonalne)</label>' +
          '<input id="cgRemotePass" type="text" value="' + E(s.remotePass || '') +
          '" placeholder="tylko dla paczki zaszyfrowanej"></div>' +
        '<div class="cg-row"><label for="cgRemoteAuto">Sprawdzaj przy starcie</label>' +
          '<input id="cgRemoteAuto" type="checkbox"' +
            (s.remoteAuto !== false ? ' checked' : '') + '></div>' +
        '<div class="cg-actions">' +
          '<button type="button" class="primary" id="cgRemoteNow">Sprawdź teraz</button>' +
          '<button type="button" id="cgForceUpdate">Odśwież aplikację</button>' +
        '</div>' +
        '<div style="font-size:12px;color:#5a6672;margin-top:8px">Ostatnio wgrana paczka: ' +
          E(s.remoteVersionApplied || 'żadna') + '</div>' +
      '</div>' +

      '<div class="cg-section">' +
        '<h3>Kopia zapasowa</h3>' +
        '<div style="font-size:13px;color:#5a6672;margin-bottom:8px">' +
          'Wszystko zostaje na tym urządzeniu. Kopia to zwykły plik JSON — ' +
          'trzymaj go u siebie, nie w chmurze.</div>' +
        '<div class="cg-actions">' +
          '<button type="button" id="cgExport">Zapisz kopię</button>' +
          '<button type="button" id="cgImport">Wczytaj kopię</button>' +
          '<button type="button" class="danger" id="cgReset">Przywróć ustawienia fabryczne</button>' +
        '</div>' +
        '<div style="font-size:12px;color:#5a6672;margin-top:8px" id="cgStorage">Magazyn: ' +
          (DB.getMode() === 'idb' ? 'IndexedDB'
            : 'localStorage (awaryjny, ~5 MB — zdjęcia mogą się nie zmieścić)') +
          ' · adres: ' + (Share.isSecure() ? 'bezpieczny (https)' :
            'zwykły — „Udostępnij" i schowek nie zadziałają') + '</div>' +
      '</div>' +

      '<div class="cg-section">' +
        '<h3>Statystyka użycia</h3>' +
        '<div id="cgStats" style="font-size:14px">liczę…</div>' +
      '</div>' +

      '<button class="sheet-close" type="button" id="cgExit">Wyjdź z trybu opiekuna</button>';

    renderPeopleList();
    renderStats();
    renderStorageInfo();
    bindMain();
    App.openSheet('caregiverPanel');
  }

  function bindMain() {
    var s = App.state.settings;

    document.getElementById('cgVoice').addEventListener('change', function () {
      saveSetting('ttsVoiceURI', this.value || null);
      TTS.configure(App.state.settings);
    });
    document.getElementById('cgRate').addEventListener('change', function () {
      saveSetting('ttsRate', parseFloat(this.value));
      TTS.configure(App.state.settings);
    });
    document.getElementById('cgTestVoice').addEventListener('click', function () {
      TTS.speak('Dzień dobry. Test polskiego głosu. Boli mnie głowa.');
      setTimeout(function () {
        var d = TTS.diagnostics();
        App.toast('Start mowy: ' + (d.lastLagMs === null ? '—' : d.lastLagMs + ' ms'));
      }, 1800);
    });
    document.getElementById('cgRefreshVoices').addEventListener('click', function () {
      TTS.refreshVoices();
      openMain();
    });

    document.getElementById('cgAddPerson').addEventListener('click', function () { addPerson(); });

    document.getElementById('cgBtnSize').addEventListener('change', function () {
      saveSetting('buttonMinPx', parseInt(this.value, 10));
      document.documentElement.style.setProperty('--btn-min', this.value + 'px');
    });
    document.getElementById('cgSpeakOnTap').addEventListener('change', function () {
      saveSetting('speakOnTap', this.checked);
    });
    document.getElementById('cgAppend').addEventListener('change', function () {
      saveSetting('autoAppend', this.checked);
    });
    document.getElementById('cgPin').addEventListener('change', function () {
      saveSetting('caregiverPin', this.value.trim());
    });

    document.getElementById('cgRemoteUrl').addEventListener('change', function () {
      saveSetting('remoteUrl', this.value.trim());
    });
    document.getElementById('cgRemotePass').addEventListener('change', function () {
      saveSetting('remotePass', this.value.trim());
    });
    document.getElementById('cgRemoteAuto').addEventListener('change', function () {
      saveSetting('remoteAuto', this.checked);
    });
    document.getElementById('cgRemoteNow').addEventListener('click', pullRemoteNow);
    document.getElementById('cgForceUpdate').addEventListener('click', forceAppUpdate);

    document.getElementById('cgExport').addEventListener('click', exportBackup);
    document.getElementById('cgImport').addEventListener('click', importBackup);
    document.getElementById('cgReset').addEventListener('click', factoryReset);

    document.getElementById('cgExit').addEventListener('click', function () {
      App.setCaregiver(false);
      App.closeSheet('caregiverPanel');
    });

    void s;
  }

  function saveSetting(key, value) {
    App.state.settings[key] = value;
    App.state.settings.id = 'settings';
    return DB.put('settings', App.state.settings);
  }

  /* ---------------- bliscy ---------------- */

  function renderPeopleList() {
    var host = document.getElementById('cgPeople');
    if (!host) { return; }
    if (!App.state.people.length) {
      host.innerHTML = '<div style="font-size:14px;color:#5a6672">' +
        'Nikogo jeszcze nie ma. Dodaj żonę, dzieci, wnuki — zdjęcie + imię + numer.</div>';
      return;
    }
    host.innerHTML = App.state.people.map(function (p) {
      var url = App.imageUrl(p.imageId);
      return '<div class="person-row">' +
             (url ? '<img src="' + url + '" alt="">' : '<div></div>') +
             '<div><div class="name">' + E(p.name) + '</div>' +
             '<div class="phone">' + E(p.phone || 'bez numeru') + '</div></div>' +
             '<button type="button" data-person="' + E(p.id) + '">Zmień</button></div>';
    }).join('');
    host.querySelectorAll('button[data-person]').forEach(function (b) {
      b.addEventListener('click', function () { editPerson(b.dataset.person); });
    });
  }

  function addPerson() { editPerson(null); }

  function blobOfImage(imageId) {
    var rec = imageId ? App.state.images[imageId] : null;
    if (!rec) { return null; }
    if (rec.blob instanceof Blob) { return rec.blob; }
    if (rec.dataUrl) { return DB.dataUrlToBlob(rec.dataUrl); }
    return null;
  }

  function focusOf(imageId) {
    var rec = imageId ? App.state.images[imageId] : null;
    return (rec && rec.focusY !== undefined) ? rec.focusY : 0.35;
  }

  function editPerson(personId) {
    ready();
    var p = personId
      ? App.state.people.filter(function (x) { return x.id === personId; })[0]
      : { id: 'p-' + Date.now(), name: '', phone: '', imageId: null };
    if (!p) { return; }

    var url = App.imageUrl(p.imageId);

    inner.innerHTML =
      '<h2>' + (personId ? 'Zmień osobę' : 'Nowa osoba') + '</h2>' +
      '<div class="cg-row"><label for="pName">Imię</label>' +
        '<input id="pName" type="text" value="' + E(p.name) + '" placeholder="np. Anna"></div>' +
      '<div class="cg-row"><label for="pVoc">Jak nazywać</label>' +
        '<input id="pVoc" type="text" value="' + E(p.vocative || '') +
        '" placeholder="np. Anię — do zdania „Chcę zobaczyć…"></div>' +
      '<div class="cg-row"><label for="pPhone">Numer telefonu</label>' +
        '<input id="pPhone" type="tel" inputmode="tel" value="' + E(p.phone || '') +
        '" placeholder="+48…"></div>' +
      '<div class="cg-row"><label>Zdjęcie</label>' +
        '<div><img id="pPreview" src="' + (url || '') + '" alt="" ' +
        'style="width:120px;height:120px;object-fit:cover;border-radius:10px;' +
        'object-position:' + App.imageFocus(p.imageId) + ';' +
        'border:2px solid #c9d1d8;' + (url ? '' : 'display:none') + '">' +
        '<input id="pFile" type="file" accept="image/*" style="margin-top:8px"></div></div>' +
      '<div class="cg-row" id="pFocusRow"' + (url ? '' : ' style="display:none"') + '>' +
        '<label for="pFocus">Kadr: góra ↔ dół</label>' +
        '<input id="pFocus" type="range" min="0" max="100" step="2" value="' +
        Math.round(focusOf(p.imageId) * 100) + '"></div>' +
      '<div style="font-size:13px;color:#5a6672;margin:8px 0">' +
        'Zdjęcie jest tylko pomniejszane — kadr ustawiasz suwakiem i możesz go ' +
        'poprawić kiedykolwiek. Najlepiej działa wyraźna twarz z bliska; ' +
        'na zdjęciu grupowym nie da się pokazać jednej osoby.</div>' +
      '<div class="cg-actions">' +
        '<button type="button" class="primary" id="pSave">Zapisz</button>' +
        '<button type="button" id="pRotate">↻ Obróć zdjęcie</button>' +
        '<button type="button" id="pCancel">Anuluj</button>' +
        (personId ? '<button type="button" class="danger" id="pDelete">Usuń</button>' : '') +
      '</div>';

    var pending = null;                        // { blob, width, height, focusY }
    var focusY = focusOf(p.imageId);

    var preview = document.getElementById('pPreview');
    var slider = document.getElementById('pFocus');

    slider.addEventListener('input', function () {
      focusY = parseInt(this.value, 10) / 100;
      preview.style.objectPosition = '50% ' + this.value + '%';
    });

    document.getElementById('pFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) { return; }
      App.toast('Przetwarzam zdjęcie…');
      Share.normalizeImage(f, 900).then(function (res) {
        if (!res) { App.toast('Nie udało się wczytać zdjęcia'); return; }
        pending = res;
        focusY = res.focusY;
        preview.src = URL.createObjectURL(res.blob);
        preview.style.objectPosition = '50% ' + Math.round(focusY * 100) + '%';
        preview.style.display = '';
        slider.value = Math.round(focusY * 100);
        document.getElementById('pFocusRow').style.display = '';
      });
    });

    document.getElementById('pRotate').addEventListener('click', function () {
      var source = pending ? pending.blob : blobOfImage(p.imageId);
      if (!source) { App.toast('Najpierw wybierz zdjęcie'); return; }
      App.toast('Obracam…');
      Share.rotateImage(source, 90).then(function (res) {
        if (!res) { App.toast('Nie udało się obrócić'); return; }
        pending = res;
        focusY = res.focusY;
        preview.src = URL.createObjectURL(res.blob);
        preview.style.objectPosition = '50% ' + Math.round(focusY * 100) + '%';
        preview.style.display = '';
        slider.value = Math.round(focusY * 100);
        document.getElementById('pFocusRow').style.display = '';
      });
    });

    document.getElementById('pCancel').addEventListener('click', openMain);

    if (personId) {
      document.getElementById('pDelete').addEventListener('click', function () {
        App.confirmBox('Usunąć ' + (p.name || 'tę osobę') + ' z tablicy?', 'Usuń')
          .then(function (ok) {
            if (!ok) { return; }
            return DB.remove('people', p.id)
              .then(function () { return App.reload(); })
              .then(openMain);
          });
      });
    }

    document.getElementById('pSave').addEventListener('click', function () {
      var name = document.getElementById('pName').value.trim();
      if (!name) { App.toast('Podaj imię'); return; }
      p.name = name;
      p.vocative = document.getElementById('pVoc').value.trim();
      p.phone = document.getElementById('pPhone').value.trim();
      p.order = p.order || App.state.people.length;

      var chain = Promise.resolve();
      if (pending) {
        var imgId = 'img-' + p.id;
        p.imageId = imgId;
        chain = DB.putImage(imgId, pending.blob, name, {
          width: pending.width, height: pending.height, focusY: focusY
        });
      } else if (p.imageId) {
        // samo przesunięcie kadru istniejącego zdjęcia
        var rec = App.state.images[p.imageId];
        if (rec && rec.focusY !== focusY) {
          rec.focusY = focusY;
          chain = DB.put('images', rec);
        }
      }
      chain.then(function () { return DB.put('people', p); })
           .then(function () { return App.reload(); })
           .then(function () { App.toast('Zapisano'); openMain(); });
    });
  }

  /* ---------------- przyciski ---------------- */

  function addButton(boardId) { editButton(null, boardId); }

  function editButton(buttonId, boardId) {
    ready();
    var isNew = !buttonId;
    var btn = isNew
      ? { id: 'u-' + Date.now(), label: '', speak: '', type: 'phrase',
          icon: 'pytanie', color: '#37474f' }
      : App.state.buttons[buttonId];
    if (!btn) { return; }
    var board = App.state.boards[boardId || App.state.boardId];

    var iconOptions = Icons.names.map(function (n) {
      return '<option value="' + E(n) + '"' + (btn.icon === n ? ' selected' : '') + '>' +
             E(n) + '</option>';
    }).join('');

    var url = App.imageUrl(btn.imageId);

    inner.innerHTML =
      '<h2>' + (isNew ? 'Nowy przycisk' : 'Zmień przycisk') + '</h2>' +
      '<div class="cg-row"><label for="bLabel">Napis</label>' +
        '<input id="bLabel" type="text" value="' + E(btn.label) + '" placeholder="np. Głowa"></div>' +
      '<div class="cg-row"><label for="bSpeak">Co ma powiedzieć</label>' +
        '<textarea id="bSpeak" rows="2" placeholder="np. Boli mnie głowa.">' +
        E(btn.speak || '') + '</textarea></div>' +
      '<div class="cg-row"><label for="bIcon">Ikona</label>' +
        '<select id="bIcon">' + iconOptions + '</select></div>' +
      '<div class="cg-row"><label for="bColor">Kolor</label>' +
        '<input id="bColor" type="color" value="' + E(btn.color || '#37474f') + '"></div>' +
      '<div class="cg-row"><label>Własne zdjęcie</label>' +
        '<div><img id="bPreview" src="' + (url || '') + '" alt="" ' +
        'style="width:96px;height:96px;object-fit:cover;border-radius:10px;' +
        'border:2px solid #c9d1d8;' + (url ? '' : 'display:none') + '">' +
        '<input id="bFile" type="file" accept="image/*" style="margin-top:8px"></div></div>' +
      '<div style="font-size:13px;color:#5a6672;margin:8px 0">' +
        'Zdjęcie zastępuje ikonę. Dla dorosłego po udarze własne, znajome zdjęcie ' +
        'działa lepiej niż rysunek.</div>' +
      '<div class="cg-actions">' +
        '<button type="button" class="primary" id="bSave">Zapisz</button>' +
        '<button type="button" id="bTest">Posłuchaj</button>' +
        '<button type="button" id="bCancel">Anuluj</button>' +
        (isNew ? '' : '<button type="button" class="danger" id="bDelete">Usuń z tablicy</button>') +
      '</div>';

    var pendingBlob = null;

    document.getElementById('bFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) { return; }
      Share.normalizeImage(f, 900).then(function (res) {
        if (!res) { return; }
        pendingBlob = res;
        var img = document.getElementById('bPreview');
        img.src = URL.createObjectURL(res.blob);
        img.style.objectPosition = '50% ' + Math.round(res.focusY * 100) + '%';
        img.style.display = '';
      });
    });

    document.getElementById('bTest').addEventListener('click', function () {
      TTS.speak(document.getElementById('bSpeak').value ||
                document.getElementById('bLabel').value);
    });

    document.getElementById('bCancel').addEventListener('click', function () {
      App.closeSheet('caregiverPanel');
    });

    if (!isNew) {
      document.getElementById('bDelete').addEventListener('click', function () {
        App.confirmBox('Usunąć przycisk „' + btn.label + '" z tablicy?', 'Usuń')
          .then(function (ok) {
            if (!ok) { return; }
            board.buttonIds = (board.buttonIds || []).filter(function (x) { return x !== btn.id; });
            return DB.put('boards', board)
              .then(function () { return App.reload(); })
              .then(function () { App.closeSheet('caregiverPanel'); App.toast('Usunięto'); });
          });
      });
    }

    document.getElementById('bSave').addEventListener('click', function () {
      btn.label = document.getElementById('bLabel').value.trim();
      btn.speak = document.getElementById('bSpeak').value.trim() || btn.label;
      btn.icon = document.getElementById('bIcon').value;
      btn.color = document.getElementById('bColor').value;
      if (!btn.label) { App.toast('Podaj napis'); return; }

      var chain = Promise.resolve();
      if (pendingBlob) {
        var imgId = 'img-' + btn.id;
        btn.imageId = imgId;
        chain = DB.putImage(imgId, pendingBlob.blob, btn.label, {
          width: pendingBlob.width, height: pendingBlob.height,
          focusY: pendingBlob.focusY
        });
      }
      chain.then(function () { return DB.put('buttons', btn); })
           .then(function () {
             if (isNew && board) {
               board.buttonIds = (board.buttonIds || []).concat([btn.id]);
               return DB.put('boards', board);
             }
             return null;
           })
           .then(function () { return App.reload(); })
           .then(function () { App.closeSheet('caregiverPanel'); App.toast('Zapisano'); });
    });

    App.openSheet('caregiverPanel');
  }

  /* ---------------- zdalna aktualizacja ---------------- */

  function pullRemoteNow() {
    var s = App.state.settings;
    if (!s.remoteUrl) { App.toast('Najpierw podaj adres paczki'); return; }

    App.toast('Sprawdzam…');
    Remote.check(s).then(function (r) {
      var opis = 'Paczka z ' + (r.version || 'nieznanej daty') + '.\n' +
                 (r.pack.people ? r.pack.people.length + ' bliskich, ' : '') +
                 (r.pack.images ? r.pack.images.length + ' zdjęć' : '');
      if (!r.isNewer) { opis += '\n\nTa sama wersja, którą masz. Wgrać ponownie?'; }

      return App.confirmBox(opis, 'Wgraj').then(function (ok) {
        if (!ok) { return null; }
        App.toast('Wgrywam…');
        return Remote.apply(r.pack, s)
          .then(normalizeStoredImages)
          .then(function () { return App.reload(); })
          .then(function () { App.toast('Gotowe'); openMain(); });
      });
    }).catch(function (e) {
      App.toast(e && e.message ? e.message : 'Nie udało się pobrać paczki');
    });
  }

  /* Service worker trzyma aplikację w pamięci podręcznej. Po wgraniu nowej
   * wersji na serwer telefon potrafi uparcie pokazywać starą — ten przycisk
   * czyści cache i przeładowuje. */
  function forceAppUpdate() {
    App.confirmBox('Pobrać najnowszą wersję aplikacji z serwera? ' +
                   'Tablice i zdjęcia zostaną nietknięte.', 'Odśwież')
      .then(function (ok) {
        if (!ok) { return; }
        var jobs = [];
        if (global.caches) {
          jobs.push(caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return caches.delete(k); }));
          }));
        }
        if (navigator.serviceWorker) {
          jobs.push(navigator.serviceWorker.getRegistrations().then(function (rs) {
            return Promise.all(rs.map(function (r) { return r.unregister(); }));
          }));
        }
        Promise.all(jobs).then(function () {
          location.replace(location.pathname + '?v=' + Date.now());
        });
      });
  }

  /* ---------------- kopia zapasowa ---------------- */

  function exportBackup() {
    DB.exportAll().then(function (data) {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mowa-taty-kopia-' +
        new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        document.body.removeChild(a);
      }, 1000);
      App.toast('Kopia zapisana w Pobranych');
    });
  }

  function importBackup() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) { return; }

      App.confirmBox('Wczytanie kopii nadpisze obecną zawartość aplikacji. Kontynuować?',
                     'Wczytaj').then(function (ok) {
        if (!ok) { return; }
        var fr = new FileReader();
        fr.onload = function () {
          var data;
          try { data = JSON.parse(fr.result); }
          catch (e) { App.toast('To nie jest poprawny plik kopii'); return; }
          App.toast('Wczytuję…');
          DB.importAll(data)
            .then(normalizeStoredImages)
            .then(function () { return App.reload(); })
            .then(function () { App.toast('Wczytano kopię'); openMain(); });
        };
        fr.readAsText(f);
      });
    });
    input.click();
  }

  /* Paczka z komputera (np. zbudowana z pliku .docx) potrafi mieć zdjęcia
   * po kilka MB. Po imporcie przepuszczamy duże obrazki przez to samo
   * kadrowanie, co przy dodawaniu ręcznym — inaczej telefon niepotrzebnie
   * trzyma pełne fotografie. */
  function normalizeStoredImages() {
    var LIMIT = 150 * 1024;

    return DB.getAll('images').then(function (rows) {
      var jobs = rows.map(function (rec) {
        var blob = rec.blob instanceof Blob ? rec.blob
                 : (rec.dataUrl ? DB.dataUrlToBlob(rec.dataUrl) : null);
        // Zdjęcia z paczki nie mają wymiarów ani kadru — przepuszczamy je
        // przez ten sam tor co ręcznie dodawane, żeby dostały jedno i drugie
        // (przy okazji prostując obrót EXIF).
        var needsMeta = rec.width === undefined || rec.focusY === undefined;
        var needsRotate = !!rec.rotate;
        if (!blob || (blob.size <= LIMIT && !needsMeta && !needsRotate)) { return null; }

        var work = needsRotate ? Share.rotateImage(blob, rec.rotate)
                               : Share.normalizeImage(blob, 900);

        return work.then(function (res) {
          if (!res) { return null; }
          // Po obrocie kadr liczymy od nowa — stary odnosił się do innych boków.
          var focus = needsRotate ? res.focusY
                    : (rec.focusY !== undefined ? rec.focusY : res.focusY);
          return DB.putImage(rec.id, res.blob, rec.caption || '', {
            width: res.width, height: res.height, focusY: focus
          });
        });
      }).filter(Boolean);

      if (!jobs.length) { return null; }
      App.toast('Zmniejszam ' + jobs.length + ' zdjęć…');
      return Promise.all(jobs);
    }).catch(function () { /* zmniejszanie jest opcjonalne, import ma się udać */ });
  }

  function factoryReset() {
    App.confirmBox('Przywrócić domyślne tablice? Zdjęcia i bliscy zostaną zachowani.',
                   'Przywróć').then(function (ok) {
      if (!ok) { return; }
      return Promise.all([DB.clear('boards'), DB.clear('buttons')])
        .then(function () {
          return Promise.all([
            DB.putMany('boards', DefaultData.boards),
            DB.putMany('buttons', DefaultData.buttons)
          ]);
        })
        .then(function () { return App.reload(); })
        .then(function () { App.toast('Przywrócono'); openMain(); });
    });
  }

  /** Czy telefon obiecał nie kasować danych i ile miejsca zajmują zdjęcia. */
  function renderStorageInfo() {
    var host = document.getElementById('cgStorage');
    if (!host || !global.navigator.storage) { return; }
    var base = host.textContent;

    var jobs = [
      navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(null),
      navigator.storage.estimate ? navigator.storage.estimate() : Promise.resolve(null)
    ];

    Promise.all(jobs).then(function (r) {
      var txt = base;
      if (r[0] === true) { txt += ' · dane chronione przed skasowaniem'; }
      else if (r[0] === false) {
        txt += ' · UWAGA: telefon może skasować dane przy braku miejsca — ' +
               'zainstaluj aplikację na ekranie głównym i trzymaj kopię zapasową';
      }
      if (r[1] && r[1].usage) {
        txt += ' · zajęte: ' + Math.round(r[1].usage / 1024) + ' kB';
      }
      host.textContent = txt;
    }).catch(function () {});
  }

  /* ---------------- statystyka ---------------- */

  function renderStats() {
    DB.getAll('usageLog').then(function (rows) {
      var host = document.getElementById('cgStats');
      if (!host) { return; }
      if (!rows.length) { host.textContent = 'Brak danych — aplikacja nie była jeszcze używana.'; return; }

      var today = new Date().toISOString().slice(0, 10);
      var todayCount = rows.filter(function (r) { return (r.ts || '').slice(0, 10) === today; }).length;

      var byBtn = {};
      rows.forEach(function (r) { byBtn[r.buttonId] = (byBtn[r.buttonId] || 0) + 1; });
      var top = Object.keys(byBtn).sort(function (a, b) { return byBtn[b] - byBtn[a]; }).slice(0, 5);

      host.innerHTML =
        '<div>Dotknięć dzisiaj: <b>' + todayCount + '</b> · łącznie: <b>' + rows.length + '</b></div>' +
        '<div style="margin-top:6px">Najczęstsze:</div><ul style="margin:4px 0 0 18px;padding:0">' +
        top.map(function (id) {
          var b = App.state.buttons[id];
          return '<li>' + E(b ? b.label : id) + ' — ' + byBtn[id] + '</li>';
        }).join('') + '</ul>' +
        '<div style="font-size:12px;color:#5a6672;margin-top:8px">' +
        'Wzrost liczby udanych komunikatów i spadek frustracji = działa. ' +
        'Brak użycia przez 1–2 tygodnie = uprość tablice i skonsultuj neurologopedę.</div>';
    });
  }

  global.Caregiver = {
    requestAccess: requestAccess,
    open: openMain,
    addPerson: addPerson,
    editPerson: editPerson,
    addButton: addButton,
    editButton: editButton,
    normalizeImages: normalizeStoredImages
  };

}(window));
