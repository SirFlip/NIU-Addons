process.on('unhandledRejection', () => {});
const { JSDOM, VirtualConsole } = require('jsdom'); const fs = require('fs');
const code = fs.readFileSync(__dirname + '/build-test.user.js', 'utf8');
const store = {};
function load(url, html) {
  const dom = new JSDOM('<!doctype html><body>' + html + '</body></html>', { url, runScripts: 'outside-only', virtualConsole: new VirtualConsole(), pretendToBeVisual: true });
  dom.window.GM = { getValue: async (k) => store[k], setValue: async (k, v) => { store[k] = v; } };
  dom.window.eval(code); return dom.window;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let ok = true; const t = (name, cond) => { console.log((cond ? 'ok   ' : 'FAIL ') + name); if (!cond) ok = false; };
  // 8xxx
  let w = load('http://niu/Kripo/Header.aspx', '<select id="m_ddlEmployee"><option value="a">Huber Anna (8123)</option><option value="b">Maier Max (7001)</option><option value="c">Test (81234)</option><option value="d">Kurz (8999)</option></select>');
  await wait(100);
  const cb = w.document.querySelector('#f8000wrap input'); const sel = w.document.getElementById('m_ddlEmployee');
  cb.checked = true; cb.dispatchEvent(new w.Event('change'));
  t('8xxx: nur vierstellige 8000er bleiben', [...sel.options].map(o => o.value).join('') === 'ad');
  cb.checked = false; cb.dispatchEvent(new w.Event('change'));
  t('8xxx: abwählen stellt alle wieder her', sel.options.length === 4);
  // Einstellungen speichern und in neuer "Seite" wieder laden
  // Reihenfolge der Felder: 0 = Autosuche Kurssuche, 1 = Cache, 2 = Dekret-Hinweis
  w = load('https://niu.wrk.at/Kripo/Header.aspx#niu-helper-settings', ''); await wait(100);
  let inputs = w.document.querySelectorAll('input');
  t('Einstellungen: drei Felder', inputs.length === 3);
  t('Einstellungen: Standard Autosuche an, Cache an, Dekret-Hinweis an', inputs[0].checked && inputs[1].checked && inputs[2].checked);
  inputs[0].checked = false; inputs[2].checked = false; w.document.querySelector('button').click(); await wait(100);
  t('Einstellungen: gespeichert', store['niu_search_course_always_search'] === 'false' && store['niu_dekret_alert'] === 'false' && store['addon_cache_active'] === 'true');
  w = load('http://niu/Kripo/Header.aspx#niu-helper-settings', ''); await wait(100);
  inputs = w.document.querySelectorAll('input');
  t('Einstellungen: auf anderem Host wieder geladen', inputs[0].checked === false && inputs[1].checked === true && inputs[2].checked === false);
  // Nummernkreis umstellen: Einstellung 7 -> Haekchen "nur 7xxx", nur 7001 bleibt
  w = load('https://niu.wrk.at/Kripo/Header.aspx#niu-helper-settings', ''); await wait(100);
  const selPrefix = w.document.querySelector('select');
  t('Einstellungen: Nummernkreis-Auswahl vorhanden, Standard 8', !!selPrefix && selPrefix.value === '8');
  selPrefix.value = '7'; w.document.querySelector('button').click(); await wait(100);
  t('Einstellungen: Nummernkreis gespeichert', store['niu_dnr_prefix'] === '"7"');
  w = load('http://niu/Kripo/Header.aspx', '<select id="m_ddlEmployee"><option value="a">Huber Anna (8123)</option><option value="b">Maier Max (7001)</option><option value="c">Test (71234)</option></select>');
  await wait(100);
  const cb7 = w.document.querySelector('#f8000wrap input'); const sel7 = w.document.getElementById('m_ddlEmployee');
  t('7xxx: Beschriftung folgt der Einstellung', /nur 7xxx/.test(w.document.querySelector('#f8000wrap').textContent));
  cb7.checked = true; cb7.dispatchEvent(new w.Event('change'));
  t('7xxx: nur vierstellige 7000er bleiben', [...sel7.options].map(o => o.value).join('') === 'b');
  // staff-lib liest dieselben Werte
  let probe; w = (() => { const d = new JSDOM('<!doctype html><body></body>', { url: 'http://niu/Kripo/Employee/EmployeeDump.aspx', runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
    d.window.GM = { getValue: async (k) => store[k], setValue: async () => {} }; d.window.__NIU_HELPER_TEST__ = (p) => { probe = p; }; d.window.eval(code); return d.window; })();
  t('staff-lib: isCacheActive() liest gespeicherten Wert', (await probe('isCacheActive')()) === true);
  t('staff-lib: getNiuDateString()', probe('getNiuDateString')(new Date(2026, 0, 5)) === '5.1.2026');
  const has = (n) => { try { return typeof probe(n) !== 'undefined'; } catch (e) { return false; } };
  t('staff-lib: entfernte Funktionen sind weg', !has('getKuerzel') && !has('calculateDutyStatistic') && !has('makeEmployeeSearchField'));
  t('NIU_BASE folgt dem Host (http://niu)', probe('NIU_BASE') === 'http://niu');
  // Datenblatt-Parser: ohne mailto-Link und ohne Foto kein Fehler, mit Link wird die Adresse gelesen
  const parse = probe('parseEmployeeDataSheet');
  const ohne = parse('<div><input id="ctl00_main_m_Employee_m_ccEmployeeMain__firstName" value="Anna"><div class="PermissionRow"><span class="PermissionType">SAN</span><span class="PermissionName">RS</span><span class="PermissionCheckbox"><input type="checkbox"></span></div></div>');
  t('Datenblatt: ohne E-Mail leer statt Fehler', ohne.Email === '' && ohne.FotoURL === '' && ohne.Vorname === 'Anna' && ohne.PermissionArray.length === 1 && ohne.PermissionArray[0].revoked === false && ohne.istGast === false);
  const mit = parse('<div><a href="mailto:a@example.org">Mail</a><img id="ctl00_main_m_Employee_m_ccEmployeeMain__picture" src="/img/unknown.png"></div>');
  t('Datenblatt: E-Mail und Foto gelesen', mit.Email === 'a@example.org' && mit.FotoURL.includes('unknown'));
  // runWithLimit: hoechstens 2 gleichzeitig, Ergebnisse in Reihenfolge, Fehler ergeben undefined
  const rwl = probe('runWithLimit'); let running = 0, peak = 0;
  const res = await rwl([1, 2, 3, 4, 5], 2, (x) => new Promise((r, j) => { running++; peak = Math.max(peak, running); setTimeout(() => { running--; x === 3 ? j(new Error('x')) : r(x * 10); }, 15); }));
  t('runWithLimit: Reihenfolge, Limit, Fehler', JSON.stringify(res) === '[10,20,null,40,50]' && peak === 2);
  const kl = probe('kommandoLinks')('8123', { EID: 'e', ENID: 'n' }, true);
  t('kommandoLinks: aktueller Host, DNr und IDs eingesetzt', /href='http:\/\/niu\/Kripo\/Employee\/detailEmployee\.aspx\?EmployeeId=e'/.test(kl) && /DienstNr=8123'/.test(kl) && /EmployeeNumberID=n'/.test(kl) && kl.split(' | ').length === 11);
  process.exit(ok ? 0 : 1);
})();
