process.on('unhandledRejection', () => {});
const { JSDOM, VirtualConsole } = require('jsdom'); const fs = require('fs');
const code = fs.readFileSync(__dirname + '/build-test.user.js', 'utf8');
const store = {};
function load(url, html) {
  const dom = new JSDOM('<!doctype html><body>' + html + '</body>', { url, runScripts: 'outside-only', virtualConsole: new VirtualConsole(), pretendToBeVisual: true });
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
  w = load('https://niu.wrk.at/Kripo/Header.aspx#niu-helper-settings', ''); await wait(100);
  let inputs = w.document.querySelectorAll('input');
  t('Einstellungen: Standard Cache an, Autocomplete aus', inputs[2].checked === true && inputs[3].checked === false);
  inputs[0].value = 'HK'; inputs[3].checked = true; w.document.querySelector('button').click(); await wait(100);
  t('Einstellungen: gespeichert', store['niu_kuerzel'] === '"HK"' && store['addon_df_expfeatures_on'] === 'true');
  w = load('http://niu/Kripo/Header.aspx#niu-helper-settings', ''); await wait(100);
  inputs = w.document.querySelectorAll('input');
  t('Einstellungen: auf anderem Host wieder geladen', inputs[0].value === 'HK' && inputs[3].checked === true);
  // staff-lib liest dieselben Werte
  let probe; w = (() => { const d = new JSDOM('<!doctype html><body></body>', { url: 'http://niu/Kripo/Employee/newEmployee.aspx', runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
    d.window.GM = { getValue: async (k) => store[k], setValue: async () => {} }; d.window.__NIU_HELPER_TEST__ = (p) => { probe = p; }; d.window.eval(code); return d.window; })();
  t('staff-lib: getKuerzel()', (await probe('getKuerzel')()) === 'HK');
  t('staff-lib: isCacheActive() Standard = true', (await probe('isCacheActive')()) === true);
  t('NIU_BASE folgt dem Host (http://niu)', probe('NIU_BASE') === 'http://niu');
  process.exit(ok ? 0 : 1);
})();
