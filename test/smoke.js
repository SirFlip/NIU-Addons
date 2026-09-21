// Smoke-Test: lädt das gebaute Userscript in jsdom für mehrere NIU-URLs und prüft,
process.on('unhandledRejection', (r) => { /* Netzwerk-/IndexedDB-Rejections in jsdom */ });
// dass die richtigen Module starten, die Bibliotheken ankommen und nichts wirft.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const code = fs.readFileSync(__dirname + '/build-test.user.js', 'utf8');

const cases = [
  { url: 'https://niu.wrk.at/Kripo/Header.aspx', html: '<span id="pageTitle">NIU</span><select id="m_ddlEmployee"><option value="1">Huber (8123)</option><option value="2">Maier (7001)</option></select>',
    expectScripts: ['Header.js', 'header-extras.js', 'nur8xxx.js', 'settings.js'], expectGlobals: ['jQuery'],
    check: (w) => [!!w.document.querySelector('#niuHelperSettingsLink'), !!w.document.querySelector('#f8000wrap')] },
  { url: 'http://niu/kripo/Ambulances/AmbulancesEdit.aspx?id=5', html: '<h1>Ambulanz</h1><h2>Testambulanz</h2><span id="ctl00_main_m_AmbulanceDisplay_m_Number">12/2026</span><span id="ctl00_main_m_AmbulanceDayDisplay_m_SubNumber">1</span>' +
      '<span id="ctl00_main_m_AmbulanceDayDisplay_m_Start">Mo, 21.9.2026 8:00</span><span id="ctl00_main_m_AmbulanceDayDisplay_m_StartWork">Mo, 21.9.2026 9:00</span><span id="ctl00_main_m_AmbulanceDayDisplay_m_EndWork">Mo, 21.9.2026 18:00</span>' +
      '<span id="ctl00_main_m_AmbulanceDisplay_m_Ort">Wien</span><table><tr class="DutyRosterHeader"><td>a</td><td>b</td></tr></table>',
    expectScripts: ['AmbulancesEdit.js', 'nur8xxx.js'], expectGlobals: ['jQuery', 'moment', 'XLSX', 'createCalendar', 'Spinner'],
    check: (w) => [/calendar\/render/.test(w.document.body.innerHTML), /src="data:image\/png/.test(w.document.body.innerHTML)] },
  { url: 'https://niu.wrk.at/Kripo/Employee/detailEmployee.aspx?EmployeeNumberID=1', html: '<h1>Test (8123)</h1><div id="ctl00_main_m_Employee_m_ccEmployeeMain__employeeMain"></div>',
    expectScripts: ['detailEmployee.js', 'nur8xxx.js'], expectGlobals: ['PNotify', 'ClipboardJS', 'JSZip', 'JSZipUtils', 'saveAs', 'PouchDB'],
    check: (w) => [!!w.document.querySelector('#template_box'), !!w.document.querySelector('#upload_select_docx'), !!w.document.querySelector('a[rel="modal:open"][href^="niuhelper-res:"]')],
    after: async (w, probe) => { const jq = probe('jQuery'); const html = await new Promise((r) => jq.get(w.document.querySelector('a[rel="modal:open"]').getAttribute('href')).done(r).fail(() => r('')));
      return [/Word Vorlagen/.test(html)]; } },
  { url: 'https://niu.wrk.at/Kripo/Employee/EmployeeDump.aspx', html: '<div id="ctl00_m_Header">h</div><table class="export"><tr><th>DNr</th><th>Name</th></tr><tr><td>8123</td><td>Huber</td></tr></table>',
    expectScripts: ['EmployeeDump.js', 'nur8xxx.js'], expectGlobals: ['jQuery', 'PouchDB', 'vex'],
    tolerate: /reading 'substr'/, // Fixture hat keine Suchparameter-Zeile
    check: (w) => [!!w.document.querySelector('#menu'), !!w.document.querySelector('#dienstcount li')] },
  { url: 'https://niu.wrk.at/Kripo/Employee/newEmployee.aspx', html: '<div id="ctl00_m_Header">h</div>',
    expectScripts: ['newEmployee.js', 'nur8xxx.js'], expectGlobals: ['jQuery'],
    check: (w) => [!!w.document.querySelector('#freiednrall')] },
  { url: 'https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=1', html: '<table></table>',
    expectScripts: ['EmployeeDutyStatistic.js', 'nur8xxx.js'], expectGlobals: ['Chartist'] },
  { url: 'https://niu.wrk.at/Kripo/Today/Today.aspx', html: '<table></table>',
    expectScripts: ['today.js', 'nur8xxx.js'], expectGlobals: ['ics', 'createCalendar', 'saveAs'] },
  { url: 'https://niu.wrk.at/Kripo/Kufer/SearchCourse.aspx', html: '<table></table>',
    expectScripts: ['SearchCourse.js', 'nur8xxx.js'], expectGlobals: ['moment', 'PouchDB'],
    tolerate: /ungültige anzahl an spalten/ }, // Fixture hat keine Kurstabelle
  { url: 'https://niu.wrk.at/df/memo/Memo_last.asp?x=1', html: '<table></table>', expectScripts: ['memo_last.js'], expectGlobals: ['PouchDB'] },
  { url: 'https://niu.wrk.at/df/spezialdiensterfassung/unterschreiben.asp', html: '<table><tr><th class="th">OK</th></tr></table>',
    expectScripts: ['spezialdienstUnterschreiben.js'], expectGlobals: ['jQuery'], check: (w) => [!!w.document.querySelector('button.everyone')] },
  { url: 'https://intranet.wrk.at/confluence/pages/viewpage.action?spaceKey=VFM&title=Bescheiderstellung', html: '<div id="main-content"></div><div id="breadcrumbs"></div>',
    expectScripts: ['vfm-bescheiderstellung.js', 'viewpage.action.js'], expectGlobals: ['Docxtemplater', 'JSZip'],
    check: (w) => [!!w.document.querySelector('#generatebutton')] },
  { url: 'https://niu.wrk.at/Kripo/Header.aspx#niu-helper-settings', html: '<span id="pageTitle">NIU</span>',
    expectScripts: ['Header.js', 'header-extras.js', 'nur8xxx.js', 'settings.js'], expectGlobals: [],
    check: (w) => [w.document.title.includes('Einstellungen'), w.document.querySelectorAll('input').length === 5] },
  { url: 'https://niu.wrk.at/irgendwas/anderes.aspx', html: '', expectScripts: [], expectGlobals: [] },
];

(async () => {
  let failed = 0;
  for (const c of cases) {
    const logs = [], errors = [];
    const vc = new VirtualConsole();
    vc.on('log', (...a) => logs.push(a.join(' ')));
    vc.on('error', (...a) => errors.push(a.map(String).join(' ')));
    vc.on('jsdomError', (e) => { if (!/Not implemented|Could not parse CSS/.test(e.message)) errors.push('jsdomError: ' + e.message); });
    const dom = new JSDOM('<!doctype html><html><head></head><body>' + c.html + '</body></html>', { url: c.url, runScripts: 'outside-only', virtualConsole: vc, pretendToBeVisual: true });
    const w = dom.window;
    const store = {};
    w.GM = { getValue: async (k) => store[k], setValue: async (k, v) => { store[k] = v; } };
    let probe = null;
    w.__NIU_HELPER_TEST__ = (p) => { probe = p; };
    const fidb = require('fake-indexeddb'); w.indexedDB = new fidb.IDBFactory(); w.IDBKeyRange = fidb.IDBKeyRange;
    try { w.eval(code); } catch (e) { errors.push('THROW: ' + e.stack); }
    await new Promise((r) => setTimeout(r, 400));

    const active = (logs.find((l) => l.includes('aktiv:')) || '').split('aktiv: ')[1] || '';
    const got = active ? active.split(', ').sort() : [];
    const problems = [];
    if (JSON.stringify(got) !== JSON.stringify([...c.expectScripts].sort())) problems.push('Module: ' + JSON.stringify(got));
    for (const g of c.expectGlobals) { const t = probe ? typeof probe(g) : 'no-probe'; if (t === 'undefined' || t === 'no-probe') problems.push('Global fehlt: ' + g); }
    if (c.after) (await c.after(w, probe)).forEach((ok, i) => { if (!ok) problems.push('After-Check ' + i + ' fehlgeschlagen'); });
    if (c.check) c.check(w).forEach((ok, i) => { if (!ok) problems.push('DOM-Check ' + i + ' fehlgeschlagen'); });
    // Netzwerkfehler sind in jsdom erwartbar (kein NIU erreichbar) - echte Skriptfehler nicht
    const real = errors.filter((e) => !(c.tolerate && c.tolerate.test(e))).filter((e) => !/ECONNREFUSED|ENOTFOUND|getaddrinfo|XMLHttpRequest|Cross origin|NetworkError|socket hang up|EAI_AGAIN/i.test(e));
    real.forEach((e) => problems.push('Fehler: ' + e.split('\n').slice(0, 3).join(' | ')));
    console.log((problems.length ? 'FAIL ' : 'ok   ') + c.url);
    problems.forEach((p) => console.log('       ' + p));
    if (problems.length) failed++;
    w.close();
  }
  console.log(failed ? `\n${failed} Fall/Fälle fehlgeschlagen` : '\nAlle Fälle ok');
  process.exit(failed ? 1 : 0);
})();
