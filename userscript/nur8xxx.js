// Mitarbeiter-Dropdown: Häkchen "nur <Z>xxx" (ehemals eigenes Userscript "NIU – Mitarbeiter-Dropdown nur 8xxx" v1.1).
// Die Tausenderziffer Z kommt aus den Einstellungen (Standard 8); gefiltert werden nur vierstellige Dienstnummern.
//
// Das Dropdown auf der Kommando-Seite hat rund 3000 Einträge. Deshalb wird es nicht Option für Option umgebaut
// (in Firefox friert die Seite dabei ein), sondern mit einer einzigen innerHTML-Zuweisung aus einem vorbereiteten
// String; die beiden Varianten (alle / gefiltert) werden einmal berechnet und wiederverwendet.
(function () {
  'use strict';

  const KEY = 'niu_nur8xxx';   // Ein/Aus-Zustand je Browser (localStorage)
  let prefix = DEFAULT_DNR_PREFIX;
  let rx = makeRegex(prefix);
  let observer = null;

  function makeRegex(z) {
    return new RegExp('\\(' + z + '\\d{3}\\)\\s*$');
  }

  function install() {
    const s = document.getElementById('m_ddlEmployee');
    if (!s || document.getElementById('f8000wrap')) return;

    // Beide Zustände als HTML vorbereiten (einmalig, ohne das Dropdown anzufassen)
    const allHtml = s.innerHTML;
    let filteredHtml = null;
    let filteredCount = 0;
    const allCount = s.options.length;
    function getFilteredHtml() {
      if (filteredHtml === null) {
        const parts = [];
        for (let i = 0; i < s.options.length; i++) {
          const o = s.options[i];
          if (rx.test(o.text)) { parts.push(o.outerHTML); }
        }
        filteredHtml = parts.join('');
        filteredCount = parts.length;
      }
      return filteredHtml;
    }

    const label = document.createElement('label');
    label.id = 'f8000wrap';
    label.style.cssText = 'margin-left:6px;font-size:11px;cursor:pointer;white-space:nowrap;';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.style.verticalAlign = 'middle';
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' nur ' + prefix + 'xxx'));
    s.parentNode.insertBefore(label, s.nextSibling);

    function apply() {
      const cur = s.value;
      // Eigene Umbauten sollen den Beobachter nicht auslösen
      if (observer) { observer.disconnect(); }
      s.innerHTML = cb.checked ? getFilteredHtml() : allHtml;
      let idx = -1;
      for (let i = 0; i < s.options.length; i++) {
        if (s.options[i].value === cur) { idx = i; break; }
      }
      s.selectedIndex = idx >= 0 ? idx : 0;
      label.title = (cb.checked ? filteredCount : allCount) + ' Einträge';
      if (observer) { observer.observe(document.body, { childList: true, subtree: true }); }
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
    observer = new MutationObserver(install);
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
