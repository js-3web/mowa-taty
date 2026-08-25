/* tts.js — synteza mowy.
 *
 * Wnioski z pomiarów na docelowym telefonie (log z 25.08.2026):
 *  - polski głos jest i działa, ucinanie po ~15 s NIE występuje (260 znaków = 20,5 s),
 *  - START mowy następuje ~1000 ms po speak() — to bardzo dużo jak na przycisk AAC,
 *  - użytkownik w tym czasie nacisnął drugi raz, co skasowało pierwszą wypowiedź
 *    (w logu: „BŁĄD: interrupted").
 *
 * Stąd trzy decyzje:
 *  1. rozgrzewka silnika przy starcie aplikacji (cicha, pusta wypowiedź),
 *  2. powtórne dotknięcie TEGO SAMEGO przycisku w trakcie mówienia jest ignorowane
 *     (zamiast kasować wypowiedź); inny przycisk normalnie przerywa,
 *  3. głos wybierany leniwie przy każdym speak(), bo lista głosów na Androidzie
 *     potrafi się wypełnić dopiero po kilku sekundach (w logu: 6,3 s).
 */
(function (global) {
  'use strict';

  var synth = global.speechSynthesis || null;

  var state = {
    supported: !!synth,
    voices: [],
    plVoices: [],
    chosen: null,
    warmed: false,
    lastText: '',
    lastAt: 0,
    lastLagMs: null,
    lastError: null,
    speaking: false
  };

  var settings = {
    ttsLang: 'pl-PL', ttsRate: 0.9, ttsPitch: 1,
    ttsVoiceURI: null, ttsPreferMale: true
  };
  var listeners = [];

  function emit() { listeners.forEach(function (fn) { try { fn(state); } catch (e) {} }); }

  function isPl(v) { return (v.lang || '').toLowerCase().indexOf('pl') === 0; }

  function refreshVoices() {
    if (!synth) { return; }
    state.voices = synth.getVoices() || [];
    state.plVoices = state.voices.filter(isPl);
    state.chosen = pickVoice();
    emit();
  }

  /* Web Speech API nie podaje płci głosu — trzeba ją wnioskować z nazwy.
   * Stąd lista rozpoznawanych imion i oznaczeń. Dla dorosłego mężczyzny
   * po udarze męski głos brzmi jak własny, a nie jak lektor z automatu. */
  var MESKIE = ['adam', 'marek', 'jacek', 'jan', 'piotr', 'krzysztof', 'tomasz',
                'male', 'męski', 'meski', 'man', '-m-', 'oda', 'jmk'];
  var ZENSKIE = ['paulina', 'ewa', 'agnieszka', 'zosia', 'maja', 'anna', 'kasia',
                 'female', 'żeński', 'zenski', 'woman', '-f-'];

  function genderScore(voice) {
    var n = (voice.name + ' ' + voice.voiceURI).toLowerCase();
    var meski = MESKIE.some(function (t) { return n.indexOf(t) !== -1; });
    var zenski = ZENSKIE.some(function (t) { return n.indexOf(t) !== -1; });
    if (meski && !zenski) { return 1; }
    if (zenski && !meski) { return -1; }
    return 0;
  }

  function pickVoice() {
    if (settings.ttsVoiceURI) {
      var byUri = state.voices.filter(function (v) { return v.voiceURI === settings.ttsVoiceURI; });
      if (byUri.length) { return byUri[0]; }
    }

    // Głos lokalny (offline) ma pierwszeństwo — w szpitalu może nie być Wi-Fi.
    var pula = state.plVoices.filter(function (v) { return v.localService; });
    if (!pula.length) { pula = state.plVoices; }
    if (!pula.length) { return null; }

    if (settings.ttsPreferMale === false) { return pula[0]; }

    var meskie = pula.filter(function (v) { return genderScore(v) > 0; });
    if (meskie.length) { return meskie[0]; }

    // Nic pewnego — weź przynajmniej taki, który nie wygląda na żeński.
    var neutralne = pula.filter(function (v) { return genderScore(v) >= 0; });
    return neutralne[0] || pula[0];
  }

  function configure(s) {
    if (!s) { return; }
    ['ttsLang', 'ttsRate', 'ttsPitch', 'ttsVoiceURI', 'ttsPreferMale'].forEach(function (k) {
      if (s[k] !== undefined && s[k] !== null) { settings[k] = s[k]; }
    });
    state.chosen = pickVoice();
  }

  function makeUtterance(text) {
    var u = new global.SpeechSynthesisUtterance(text);
    u.lang = settings.ttsLang || 'pl-PL';
    u.rate = settings.ttsRate || 0.9;
    u.pitch = settings.ttsPitch || 1;
    var v = pickVoice();
    if (v) { u.voice = v; }
    return u;
  }

  /** Cicha wypowiedź „na rozgrzewkę" — skraca opóźnienie pierwszego użycia. */
  function warmUp() {
    if (!synth || state.warmed) { return; }
    try {
      var u = makeUtterance(' ');
      u.volume = 0;
      synth.speak(u);
      state.warmed = true;
    } catch (e) { /* rozgrzewka jest opcjonalna */ }
  }

  /**
   * Mówi tekst.
   * @returns {boolean} false = zignorowano (powtórzone dotknięcie w trakcie mowy)
   */
  function speak(text) {
    if (!synth || !text) { return false; }
    var now = Date.now();

    // Punkt 2: ta sama treść, w trakcie mówienia, w ciągu 2 s → zignoruj.
    if (state.speaking && text === state.lastText && (now - state.lastAt) < 2000) {
      return false;
    }

    state.lastText = text;
    state.lastAt = now;
    state.lastError = null;

    try { synth.cancel(); } catch (e) {}

    var chunks = splitLong(text);
    var asked = Date.now();

    chunks.forEach(function (part, i) {
      var u = makeUtterance(part);
      if (i === 0) {
        u.onstart = function () {
          state.lastLagMs = Date.now() - asked;
          state.speaking = true;
          emit();
        };
      }
      if (i === chunks.length - 1) {
        u.onend = function () { state.speaking = false; emit(); };
      }
      u.onerror = function (e) {
        // „interrupted" to normalne skasowanie poprzedniej wypowiedzi, nie awaria.
        if (e && e.error && e.error !== 'interrupted' && e.error !== 'canceled') {
          state.lastError = e.error;
        }
        state.speaking = false;
        emit();
      };
      synth.speak(u);
    });

    return true;
  }

  /* Ucinanie ~15 s nie wystąpiło na telefonie ojca, ale dzielenie bardzo długich
     tekstów nic nie kosztuje (log: ten sam czas łączny) i chroni na innym sprzęcie. */
  function splitLong(text) {
    if (text.length <= 200) { return [text]; }
    var parts = text.match(/[^.!?]+[.!?]*/g) || [text];
    var out = [], buf = '';
    parts.forEach(function (p) {
      if ((buf + p).length > 200 && buf) { out.push(buf.trim()); buf = p; }
      else { buf += p; }
    });
    if (buf.trim()) { out.push(buf.trim()); }
    return out;
  }

  function stop() {
    if (!synth) { return; }
    try { synth.cancel(); } catch (e) {}
    state.speaking = false;
    emit();
  }

  /** Dane dla ekranu diagnostycznego w trybie opiekuna. */
  function diagnostics() {
    var offlinePl = state.plVoices.filter(function (v) { return v.localService; });
    var level = 'ok', msg;

    if (!state.supported) {
      level = 'bad';
      msg = 'Ta przeglądarka nie obsługuje syntezy mowy. Użyj Chrome.';
    } else if (!state.voices.length) {
      level = 'warn';
      msg = 'Lista głosów jeszcze pusta — poczekaj chwilę i odśwież.';
    } else if (!state.plVoices.length) {
      level = 'bad';
      msg = 'Brak polskiego głosu. Ustawienia Androida → Zamiana tekstu na mowę → ' +
            'Mechanizm Google → Zainstaluj dane głosowe → polski.';
    } else if (!offlinePl.length) {
      level = 'warn';
      msg = 'Polski głos działa tylko przez internet. Bez Wi-Fi aplikacja zamilknie — ' +
            'doinstaluj pakiet offline.';
    } else {
      msg = 'Polski głos offline: ' + offlinePl[0].name + '.';
      if (state.lastLagMs !== null && state.lastLagMs > 600) {
        level = 'warn';
        msg += ' Uwaga: ostatni start mowy trwał ' + state.lastLagMs +
               ' ms — to długo, sprawdź działanie w trybie samolotowym.';
      }
    }

    return {
      level: level,
      message: msg,
      total: state.voices.length,
      pl: state.plVoices.length,
      plOffline: offlinePl.length,
      chosen: state.chosen ? state.chosen.name : null,
      chosenLocal: state.chosen ? state.chosen.localService : null,
      lastLagMs: state.lastLagMs,
      lastError: state.lastError,
      online: global.navigator.onLine,
      voices: state.plVoices.map(function (v) {
        return { name: v.name, lang: v.lang, uri: v.voiceURI, local: v.localService };
      })
    };
  }

  function init(s) {
    configure(s);
    if (!synth) { return; }
    refreshVoices();
    synth.onvoiceschanged = refreshVoices;
    // Android bywa leniwy — dopytaj kilka razy.
    var n = 0;
    var t = setInterval(function () {
      n++;
      refreshVoices();
      if (state.plVoices.length || n > 12) { clearInterval(t); }
    }, 500);
  }

  global.TTS = {
    init: init,
    configure: configure,
    speak: speak,
    stop: stop,
    warmUp: warmUp,
    refreshVoices: refreshVoices,
    diagnostics: diagnostics,
    onChange: function (fn) { listeners.push(fn); },
    state: state
  };

}(window));
