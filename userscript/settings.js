// Einstellungsseite (Ersatz für options.html der Extension).
// Aufruf: <NIU>/Kripo/Header.aspx#niu-helper-settings in einem eigenen Tab.
(function () {
  if (location.hash !== '#niu-helper-settings' || window.top !== window.self) return;

  var fields = [
    { key: STORAGE_KEY_KUERZEL, type: 'text', def: '', title: 'Kürzel',
      label: 'Persönliches Kürzel – wird im Bemerkungsfeld bei Ambulanzen, Ausbildungen etc. verwendet.' },
    { key: STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH, type: 'checkbox', def: DEFAULT_SEARCH_COURSE_ALWAYS_SEARCH, title: 'Kurssuche für zukünftige Kurse',
      label: 'Beim Aufruf der Kurssuche automatisch alle Kurse bis ein Jahr in die Zukunft anzeigen.' },
    { key: STORAGE_KEY_CACHE_ACTIVE, type: 'checkbox', def: DEFAULT_CACHE_ACTIVE, title: 'Cache',
      label: 'Temporäres Zwischenspeichern der NIU-Anfragen im lokalen Speicher (Empfehlung: Ja)' },
    { key: STORAGE_KEY_DF_EXP, type: 'checkbox', def: DEFAULT_DF_EXP, title: 'Optionale Funktionen',
      label: 'Autocomplete-Felder im Dienstplan' },
    { key: STORAGE_KEY_DEKRET_ALERT, type: 'checkbox', def: DEFAULT_DEKRET_ALERT, title: null,
      label: 'Hinweis für nicht ausgefolgte Dekrete' }
  ];

  document.title = "NIU's little helper – Einstellungen";
  var body = document.body || document.documentElement.appendChild(document.createElement('body'));
  body.innerHTML = '';
  body.style.cssText = 'font-family:Segoe UI,Arial,sans-serif;font-size:14px;background:#f4f4f4;color:#222;margin:0;padding:2em;';

  var box = document.createElement('div');
  box.style.cssText = 'max-width:640px;margin:0 auto;background:#fff;border-top:4px solid #bb0000;padding:1.5em 2em;box-shadow:0 1px 4px rgba(0,0,0,.2);';
  body.appendChild(box);

  var h = document.createElement('h2');
  h.textContent = "NIU's little helper – Einstellungen";
  h.style.marginTop = '0';
  box.appendChild(h);

  var inputs = {};
  fields.forEach(function (f) {
    if (f.title) {
      var t = document.createElement('h4');
      t.textContent = f.title;
      t.style.cssText = 'margin:1.4em 0 .4em 0;';
      box.appendChild(t);
    }
    var row = document.createElement('label');
    row.style.cssText = 'display:block;margin:.3em 0;cursor:pointer;';
    var input = document.createElement('input');
    input.type = f.type;
    input.style.cssText = f.type === 'text' ? 'display:block;margin-bottom:.3em;padding:.3em;width:12em;' : 'margin-right:.5em;vertical-align:middle;';
    row.appendChild(input);
    row.appendChild(document.createTextNode(f.label));
    box.appendChild(row);
    inputs[f.key] = input;
  });

  var save = document.createElement('button');
  save.textContent = 'Speichern';
  save.style.cssText = 'margin-top:2em;padding:.5em 1.5em;background:#bb0000;color:#fff;border:0;cursor:pointer;font-size:14px;';
  box.appendChild(save);

  var status = document.createElement('span');
  status.style.cssText = 'margin-left:1em;color:#2a7a2a;';
  box.appendChild(status);

  var foot = document.createElement('p');
  foot.style.cssText = 'margin-top:2em;font-size:11px;color:#777;';
  foot.textContent = 'Userscript-Version ' + __VERSION + ' · Speicher: ' + __store.backend +
    ' · Die Einstellungen gelten für http://niu und https://niu.wrk.at gemeinsam. Offene NIU-Seiten nach dem Speichern neu laden.';
  box.appendChild(foot);

  var load = {};
  fields.forEach(function (f) { load[f.key] = f.def; });
  chrome.storage.sync.get(load, function (items) {
    fields.forEach(function (f) {
      if (f.type === 'checkbox') inputs[f.key].checked = !!items[f.key];
      else inputs[f.key].value = items[f.key] || '';
    });
  });

  save.addEventListener('click', function () {
    var out = {};
    fields.forEach(function (f) {
      out[f.key] = f.type === 'checkbox' ? inputs[f.key].checked : inputs[f.key].value.trim();
    });
    chrome.storage.sync.set(out, function () {
      status.textContent = 'Einstellungen gespeichert.';
      setTimeout(function () { status.textContent = ''; }, 2000);
    });
  });
})();
