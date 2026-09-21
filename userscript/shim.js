// ---------------------------------------------------------------------------
// Shim: ersetzt die Chrome-Extension-APIs, die NIU's little helper verwendet.
//   chrome.storage.sync.get/set  -> GM.getValue/GM.setValue (Fallback localStorage)
//   chrome.extension.getURL      -> eingebettete Ressourcen (__RES)
// ---------------------------------------------------------------------------
var __LOG = '[NIU++ userscript] ';
var __RES_SCHEME = 'niuhelper-res:';

// Auf einem NIU-Host immer den eigenen Origin verwenden (http://niu intern,
// https://niu.wrk.at extern). Sonst wären die AJAX-Aufrufe cross-origin -
// das durfte nur die Extension, ein Userscript nicht.
var NIU_BASE = /^(niu|niu\.wrk\.at)$/i.test(location.hostname) ? location.origin : 'https://niu.wrk.at';
var NIU_SETTINGS_URL = NIU_BASE + '/Kripo/Header.aspx#niu-helper-settings';

var MAX_CACHE_TIME; // wird in staff-lib.js ohne var gesetzt

var __store = (function () {
  var PFX = 'niuhelper:';
  var gm4 = (typeof GM === 'object' && GM && typeof GM.getValue === 'function' && typeof GM.setValue === 'function');
  var gm3 = (typeof GM_getValue === 'function' && typeof GM_setValue === 'function');

  function decode(raw) {
    if (typeof raw !== 'string') return raw; // undefined oder bereits ein Wert
    try { return JSON.parse(raw); } catch (e) { return raw; }
  }
  function get(key) {
    try {
      if (gm4) return Promise.resolve(GM.getValue(key)).then(decode);
      if (gm3) return Promise.resolve(decode(GM_getValue(key)));
      var v = localStorage.getItem(PFX + key);
      return Promise.resolve(v === null ? undefined : decode(v));
    } catch (e) {
      console.warn(__LOG + 'Storage lesen fehlgeschlagen', key, e);
      return Promise.resolve(undefined);
    }
  }
  function set(key, value) {
    var raw = JSON.stringify(value);
    try {
      if (gm4) return Promise.resolve(GM.setValue(key, raw));
      if (gm3) { GM_setValue(key, raw); return Promise.resolve(); }
      localStorage.setItem(PFX + key, raw);
    } catch (e) {
      console.warn(__LOG + 'Storage schreiben fehlgeschlagen', key, e);
    }
    return Promise.resolve();
  }
  return { get: get, set: set, backend: gm4 ? 'GM.*' : (gm3 ? 'GM_*' : 'localStorage') };
})();

// Standardwerte laut Optionsseite der Extension. Die Extension hat z.B. den
// Cache erst nach dem ersten Speichern der Optionen aktiviert - hier gilt der
// dokumentierte Standard sofort.
function __storageDefault(key) {
  if (key === STORAGE_KEY_CACHE_ACTIVE) return DEFAULT_CACHE_ACTIVE;
  return undefined;
}

var __storageArea = {
  get: function (keys, callback) {
    var names = [], defaults = {};
    if (typeof keys === 'string') names = [keys];
    else if (Array.isArray(keys)) names = keys.slice();
    else if (keys && typeof keys === 'object') { names = Object.keys(keys); defaults = keys; }

    Promise.all(names.map(function (k) { return __store.get(k); })).then(function (values) {
      var items = {};
      names.forEach(function (k, i) {
        var v = values[i];
        if (v === undefined && Object.prototype.hasOwnProperty.call(defaults, k)) v = defaults[k];
        if (v === undefined) v = __storageDefault(k);
        if (v !== undefined) items[k] = v;
      });
      if (typeof callback === 'function') callback(items);
    });
  },
  set: function (items, callback) {
    Promise.all(Object.keys(items || {}).map(function (k) { return __store.set(k, items[k]); })).then(function () {
      if (typeof callback === 'function') callback();
    });
  }
};

function __getURL(path) {
  var p = String(path).replace(/^\/+/, '');
  if (!Object.prototype.hasOwnProperty.call(__RES, p)) {
    console.warn(__LOG + 'Ressource nicht eingebettet: ' + p);
    return '';
  }
  // Bilder: direkt als data:-URI. Text/HTML: eigenes Schema, das der
  // jQuery-Transport unten beantwortet ($.get, jquery-modal).
  return __RES[p].indexOf('data:') === 0 ? __RES[p] : __RES_SCHEME + p;
}

var chrome = {
  // bewusst kein storage.local: PouchDB hält sich sonst für eine Chrome-App
  storage: { sync: __storageArea },
  extension: { getURL: __getURL },
  runtime: { getURL: __getURL, getManifest: function () { return { version: __VERSION }; } }
};

// wird aufgerufen, sobald jQuery geladen ist
function __installResTransport(jq) {
  jq.ajaxTransport('+*', function (options) {
    if (typeof options.url !== 'string' || options.url.indexOf(__RES_SCHEME) !== 0) return;
    var p = options.url.substring(__RES_SCHEME.length).replace(/[?#].*$/, '');
    return {
      send: function (headers, complete) {
        if (Object.prototype.hasOwnProperty.call(__RES, p)) complete(200, 'OK', { text: __RES[p] });
        else complete(404, 'Not Found', { text: '' });
      },
      abort: function () {}
    };
  });
}

function __addStyle(css) {
  if (!css) return;
  try {
    if (typeof GM_addStyle === 'function') { GM_addStyle(css); return; }
    if (typeof GM === 'object' && GM && typeof GM.addStyle === 'function') { GM.addStyle(css); return; }
  } catch (e) { /* Fallback unten */ }
  var s = document.createElement('style');
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
}
