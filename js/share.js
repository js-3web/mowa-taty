/* share.js — wysyłka komunikatu poza aplikację (sekcja i briefu).
 *
 * Trzy niezależne kanały, bo każdy zawodzi w innych warunkach:
 *   1. sms:  — działa nawet z file://, treść wpisana, wysyłkę zatwierdza człowiek,
 *   2. navigator.share — arkusz systemowy (Messenger, WhatsApp, mail), wymaga HTTPS,
 *   3. schowek — plan awaryjny, nie zależy od żadnej integracji.
 *
 * Aplikacja NIGDY nie wysyła niczego sama. Każda wysyłka to świadome
 * dotknięcie i potwierdzenie w aplikacji docelowej.
 */
(function (global) {
  'use strict';

  var nav = global.navigator;

  function isSecure() { return global.isSecureContext === true; }

  function canShareText() {
    return !!(nav.share) && isSecure();
  }

  function canShareFiles() {
    if (!nav.share || !nav.canShare || !isSecure()) { return false; }
    try {
      var probe = new File([new Blob(['x'], { type: 'text/plain' })], 'a.txt',
                           { type: 'text/plain' });
      return nav.canShare({ files: [probe] });
    } catch (e) { return false; }
  }

  /**
   * Link sms: z wpisaną treścią.
   * Android używa `?body=`, iOS historycznie `&body=` po numerze.
   */
  function smsHref(text, phone) {
    var body = encodeURIComponent(text || '');
    var num = (phone || '').replace(/\s/g, '');
    var ios = /iPad|iPhone|iPod/.test(nav.userAgent);
    if (!num) { return 'sms:' + (ios ? '&' : '?') + 'body=' + body; }
    return 'sms:' + num + (ios ? '&' : '?') + 'body=' + body;
  }

  function openSms(text, phone) {
    global.location.href = smsHref(text, phone);
  }

  function telHref(phone) {
    return 'tel:' + (phone || '').replace(/\s/g, '');
  }

  /** Systemowy arkusz udostępniania — tekst. */
  function shareText(text) {
    if (!canShareText()) { return Promise.reject(new Error('brak-wsparcia')); }
    return nav.share({ text: text });
  }

  /**
   * Udostępnienie obrazka. Uwaga: część komunikatorów przy załączonym pliku
   * gubi pole `text` — dlatego domyślnie tekst jest WYPALONY w obrazek,
   * a `text` dokładamy tylko pomocniczo.
   */
  function shareImage(blob, text) {
    if (!canShareFiles()) { return Promise.reject(new Error('brak-wsparcia')); }
    var file = new File([blob], 'komunikat.png', { type: 'image/png' });
    var payload = { files: [file] };
    if (text) { payload.text = text; }
    return nav.share(payload);
  }

  /** Kopiowanie do schowka z fallbackiem działającym również z file://. */
  function copyText(text) {
    if (nav.clipboard && isSecure()) {
      return nav.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('kopiowanie-nieudane'));
    });
  }

  /* ------------------------------------------------------------------ *
   *  Wypalanie komunikatu w obrazek (canvas → PNG).
   *  items: [{ iconSvg?: string, imageUrl?: string, label: string }]
   * ------------------------------------------------------------------ */

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function svgToDataUrl(svgMarkup) {
    // Ikony rysujemy czarnym konturem — currentColor nie zadziała poza DOM.
    var s = svgMarkup
      .replace(/class="[^"]*"/g, '')
      .replace(/currentColor/g, '#111')
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" ' +
               'fill="none" stroke="#111" stroke-width="5.5" ' +
               'stroke-linecap="round" stroke-linejoin="round" ');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  function renderMessageImage(items, sentence) {
    var W = 1080;
    var pad = 48;
    var cell = 200;
    var gap = 24;
    var perRow = Math.max(1, Math.floor((W - 2 * pad + gap) / (cell + gap)));
    var rows = Math.max(1, Math.ceil(items.length / perRow));
    var gridH = rows * cell + (rows - 1) * gap;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    // Wysokość zależy od długości tekstu — najpierw zmierzmy.
    ctx.font = '600 52px "Segoe UI", system-ui, Arial, sans-serif';
    var lines = wrapText(ctx, sentence || '', W - 2 * pad);
    var textH = lines.length * 66;

    canvas.width = W;
    canvas.height = pad + gridH + 40 + textH + pad + 44;

    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var sources = items.map(function (it) {
      if (it.imageUrl) { return loadImage(it.imageUrl); }
      if (it.iconSvg) { return loadImage(svgToDataUrl(it.iconSvg)); }
      return Promise.resolve(null);
    });

    return Promise.all(sources).then(function (imgs) {
      imgs.forEach(function (img, i) {
        var r = Math.floor(i / perRow);
        var c = i % perRow;
        var usedCols = Math.min(perRow, items.length - r * perRow);
        var rowW = usedCols * cell + (usedCols - 1) * gap;
        var x = Math.round((W - rowW) / 2) + c * (cell + gap);
        var y = pad + r * (cell + gap);

        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 3;
        roundRect(ctx, x, y, cell, cell, 16);
        ctx.stroke();

        if (img) {
          ctx.save();
          roundRect(ctx, x + 6, y + 6, cell - 12, cell - 12, 12);
          ctx.clip();
          drawCover(ctx, img, x + 6, y + 6, cell - 12, cell - 12, 0.35);
          ctx.restore();
        }
      });

      // Tekst pod spodem — to on niesie treść, gdy komunikator zgubi pole `text`.
      ctx.fillStyle = '#111111';
      ctx.font = '600 52px "Segoe UI", system-ui, Arial, sans-serif';
      ctx.textAlign = 'center';
      var ty = pad + gridH + 40 + 52;
      lines.forEach(function (ln) { ctx.fillText(ln, W / 2, ty); ty += 66; });

      ctx.fillStyle = '#78909c';
      ctx.font = '400 26px "Segoe UI", system-ui, Arial, sans-serif';
      ctx.fillText('wysłane z aplikacji Mowa Taty', W / 2, canvas.height - 30);

      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) { resolve(blob); }, 'image/png');
      });
    });
  }

  /* focusY: który punkt wysokości zdjęcia ma trafić na środek kadru.
   * 0.5 = geometryczny środek. Dla portretów dajemy 0.35, bo przy zdjęciu
   * pionowym środek wypada na tułowiu i kadr obcina głowę. */
  function drawCover(ctx, img, x, y, w, h, focusY) {
    var f = (focusY === undefined) ? 0.5 : focusY;
    var ir = img.width / img.height;
    var tr = w / h;
    var sw, sh, sx, sy;
    if (ir > tr) {
      sh = img.height; sw = sh * tr;
      sx = (img.width - sw) / 2; sy = 0;
    } else {
      sw = img.width; sh = sw / tr;
      sx = 0;
      sy = img.height * f - sh / 2;
      sy = Math.max(0, Math.min(sy, img.height - sh));   // nie wychodź poza zdjęcie
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxW) {
    if (!text) { return []; }
    var words = text.split(/\s+/);
    var lines = [], line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else { line = test; }
    });
    if (line) { lines.push(line); }
    return lines;
  }

  /* ------------------------------------------------------------------ *
   *  Import zdjęć: kadr kwadratowy + skalowanie. Użytkownik nie musi
   *  niczego przycinać ręcznie.
   * ------------------------------------------------------------------ */
  /* Wczytanie z poszanowaniem obrotu EXIF. Zdjęcia z telefonu bywają zapisane
   * „na boku", a informacja o obrocie siedzi w metadanych — bez tego twarz
   * leży poziomo. createImageBitmap potrafi to rozwinąć od razu. */
  function loadOriented(file) {
    if (global.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' })
        .catch(function () { return loadViaTag(file); });
    }
    return loadViaTag(file);
  }

  function loadViaTag(file) {
    var url = URL.createObjectURL(file);
    return loadImage(url).then(function (img) {
      URL.revokeObjectURL(url);
      return img;
    });
  }

  /** Sugerowane kadrowanie w pionie: im wyższe zdjęcie, tym wyżej twarz. */
  function suggestFocusY(w, h) {
    if (!w || !h || h <= w) { return 0.5; }
    var y = 0.5 / (h / w);
    return Math.max(0.2, Math.min(0.5, Math.round(y * 100) / 100));
  }

  /**
   * Zmniejsza zdjęcie BEZ przycinania — kadr ustawia się później suwakiem
   * i da się go poprawić w każdej chwili. Wcześniej kadr był wypalany
   * na sztywno i źle dobranego nie dało się już naprawić.
   * @returns {Promise<{blob, width, height, focusY}>}
   */
  function normalizeImage(file, maxSide) {
    maxSide = maxSide || 900;
    return loadOriented(file).then(function (img) {
      if (!img) { return null; }

      var w = img.width, h = img.height;
      var scale = Math.min(1, maxSide / Math.max(w, h));
      var cw = Math.max(1, Math.round(w * scale));
      var ch = Math.max(1, Math.round(h * scale));

      var canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);
      if (img.close) { img.close(); }

      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          resolve(blob ? {
            blob: blob, width: cw, height: ch, focusY: suggestFocusY(cw, ch)
          } : null);
        }, 'image/jpeg', 0.85);
      });
    }).catch(function () { return null; });
  }

  /**
   * Obrót zdjęcia o wielokrotność 90°, wypalany na stałe.
   * Potrzebny, bo część zdjęć (np. wyciągniętych z .docx) ma piksele obrócone
   * i wyzute z EXIF — nie ma jak zgadnąć, że leżą na boku.
   */
  function rotateImage(blob, deg, maxSide) {
    var d = ((deg % 360) + 360) % 360;
    maxSide = maxSide || 900;
    if (!d) { return normalizeImage(blob, maxSide); }

    return loadOriented(blob).then(function (img) {
      if (!img) { return null; }
      var w = img.width, h = img.height;
      var swap = (d % 180) !== 0;
      var outW = swap ? h : w;
      var outH = swap ? w : h;

      // Obracamy i od razu zmniejszamy — inaczej obrócone zdjęcie zostawałoby
      // w pełnej rozdzielczości i puchła pamięć telefonu.
      var scale = Math.min(1, maxSide / Math.max(outW, outH));

      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(outW * scale));
      canvas.height = Math.max(1, Math.round(outH * scale));

      var ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(d * Math.PI / 180);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -w / 2, -h / 2);
      if (img.close) { img.close(); }

      return new Promise(function (resolve) {
        canvas.toBlob(function (out) {
          resolve(out ? {
            blob: out, width: canvas.width, height: canvas.height,
            focusY: suggestFocusY(canvas.width, canvas.height)
          } : null);
        }, 'image/jpeg', 0.85);
      });
    }).catch(function () { return null; });
  }

  global.Share = {
    suggestFocusY: suggestFocusY,
    rotateImage: rotateImage,
    canShareText: canShareText,
    canShareFiles: canShareFiles,
    isSecure: isSecure,
    smsHref: smsHref,
    telHref: telHref,
    openSms: openSms,
    shareText: shareText,
    shareImage: shareImage,
    copyText: copyText,
    renderMessageImage: renderMessageImage,
    normalizeImage: normalizeImage
  };

}(window));
