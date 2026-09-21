// Mitarbeiter-Dropdown: Häkchen "nur <Z>xxx" (ehemals eigenes Userscript "NIU – Mitarbeiter-Dropdown nur 8xxx" v1.1).
// Die Tausenderziffer Z kommt aus den Einstellungen (Standard 8); gefiltert werden nur vierstellige Dienstnummern.
(function () {
  'use strict';

  const KEY = 'niu_nur8xxx';   // Ein/Aus-Zustand je Browser (localStorage)
  let prefix = DEFAULT_DNR_PREFIX;
  let rx = makeRegex(prefix);

  function makeRegex(z) {
    return new RegExp('\\(' + z + '\\d{3}\\)\\s*$');
  }

  function install() {
    const s = document.getElementById('m_ddlEmployee');
    if (!s || document.getElementById('f8000wrap')) return;

    s._all = Array.from(s.options);

    const label = document.createElement('label');
    label.id = 'f8000wrap';
    label.style.cssText = 'margin-left:6px;font-size:11px;cursor:pointer;white-space:nowrap;';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.style.verticalAlign = 'middle';
    label.appendChild(cb);
    const text = document.createTextNode(' nur ' + prefix + 'xxx');
    label.appendChild(text);
    s.parentNode.insertBefore(label, s.nextSibling);

    function apply() {
      const cur = s.value;
      const keep = cb.checked ? s._all.filter(o => rx.test(o.text)) : s._all;
      while (s.options.length) s.remove(0);
      keep.forEach(o => s.add(o));
      const idx = keep.findIndex(o => o.value === cur);
      s.selectedIndex = idx >= 0 ? idx : 0;
      label.title = keep.length + ' Einträge';
      try { localStorage.setItem(KEY, cb.checked ? '1' : '0'); } catch (e) {}
    }

    cb.addEventListener('change', apply);

    // gespeicherten Zustand wiederherstellen
    try { if (localStorage.getItem(KEY) === '1') { cb.checked = true; apply(); } } catch (e) {}
  }

  // Tausenderziffer aus den Einstellungen lesen, dann einhängen
  const load = {};
  load[STORAGE_KEY_DNR_PREFIX] = DEFAULT_DNR_PREFIX;
  chrome.storage.sync.get(load, function (items) {
    const z = String(items[STORAGE_KEY_DNR_PREFIX] || DEFAULT_DNR_PREFIX);
    if (/^[1-9]$/.test(z)) { prefix = z; rx = makeRegex(z); }
    install();
    // Falls das Dropdown erst später (z. B. per Postback) nachgeladen wird
    new MutationObserver(install).observe(document.body, { childList: true, subtree: true });
  });
})();
