// Mitarbeiter-Dropdown: Häkchen "nur 8xxx" (ehemals eigenes Userscript "NIU – Mitarbeiter-Dropdown nur 8xxx" v1.1)
(function () {
  'use strict';

  const KEY = 'niu_nur8xxx';
  const RX = /\(8\d{3}\)\s*$/;

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
    label.appendChild(document.createTextNode(' nur 8xxx'));
    s.parentNode.insertBefore(label, s.nextSibling);

    function apply() {
      const cur = s.value;
      const keep = cb.checked ? s._all.filter(o => RX.test(o.text)) : s._all;
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

  install();
  // Falls das Dropdown erst später (z. B. per Postback) nachgeladen wird
  new MutationObserver(install).observe(document.body, { childList: true, subtree: true });
})();
