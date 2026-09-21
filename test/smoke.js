// Smoke-Test: lädt das gebaute Userscript in jsdom für mehrere NIU-URLs und prüft,
process.on('unhandledRejection', (r) => { /* Netzwerk-/IndexedDB-Rejections in jsdom */ });
// dass die richtigen Module starten, die Bibliotheken ankommen und nichts wirft.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const code = fs.readFileSync(__dirname + '/build-test.user.js', 'utf8');

const cases = [
  { url: 'https://niu.wrk.at/Kripo/Header.aspx', html: '<span id="pageTitle">NIU</span><select id="m_ddlEmployee"><option value="1">Huber (8123)</option><option value="2">Maier (7001)</option></select>',
    expectScripts: ['Header.js', 'header-extras.js', 'nur8xxx.js', 'settings.js'], expectGlobals: ['jQuery'],
    check: (w) => [!!w.document.querySelector('#niuHelperSettingsLink'), !!w.document.querySelector('#f8000wrap'), /NIU-Addon ist derzeit aktiv/.test(w.document.body.innerHTML)] },
  // Entfernte Module: Dienstplan, Ambulanzen, Dienststatistik, Mitarbeiter Neu, Leitstellen-Kopf
  { url: 'http://niu/kripo/Ambulances/AmbulancesEdit.aspx?id=5', html: '<h1>Ambulanz</h1>', expectScripts: ['nur8xxx.js'], expectGlobals: [] },
  { url: 'https://niu.wrk.at/Kripo/DutyRosterNH/DutyRoster.aspx', html: '<table></table>', expectScripts: ['nur8xxx.js'], expectGlobals: [] },
  { url: 'https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=1', html: '<table></table>', expectScripts: ['nur8xxx.js'], expectGlobals: [] },
  { url: 'https://niu.wrk.at/Kripo/Employee/newEmployee.aspx', html: '<div id="ctl00_m_Header">h</div>', expectScripts: ['nur8xxx.js'], expectGlobals: [] },
  { url: 'https://niu.wrk.at/Kripo/external/ControlCenterHead.aspx', html: '<select id="m_ddlEmployee"></select>', expectScripts: ['nur8xxx.js'], expectGlobals: [] },
  // Mitarbeiter-Detail: Dekret-Hinweis und Kopierbox, keine Word-Vorlage mehr
  { url: 'https://niu.wrk.at/Kripo/Employee/detailEmployee.aspx?EmployeeNumberID=1',
    html: '<h1>Test (8123)</h1><div id="ctl00_main_m_Employee_m_ccEmployeeMain__employeeMain"></div><input id="ctl00_main_m_Employee_m_ccEmployeeMain__firstName" value="Anna"><input id="ctl00_main_m_Employee_m_ccEmployeeMain__lastName" value="Huber">' +
      '<select id="ctl00_main_m_Employee_m_ccEmployeeMain__professionTitle"><option selected>&lt;Berufstitel&gt;</option></select><select id="ctl00_main_m_Employee_m_ccEmployeeMain__preAcademicTitle"><option selected>&lt;Titel&gt;</option></select><select id="ctl00_main_m_Employee_m_ccEmployeeMain__postAcademicTitle"><option selected>&lt;Titel&gt;</option></select>' +
      '<input id="ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_Street" value="Teststraße"><input id="ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_StreetNumber" value="1"><input id="ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_PostalCode" value="1010"><input id="ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_City" value="Wien"><select id="ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_Country"><option selected>Österreich</option></select>',
    expectScripts: ['detailEmployee.js', 'nur8xxx.js'], expectGlobals: ['PNotify', 'ClipboardJS'],
    check: (w) => [!!w.document.querySelector('#copybox'), /Anna Huber\nTeststraße 1\n1010 Wien\nÖsterreich/.test(w.document.querySelector('#copycontent').value), !w.document.querySelector('#template_box')] },
  // Liste/Ausdruck: Menue ohne jQuery UI, ohne Dienststatistik-Eintraege
  { url: 'https://niu.wrk.at/Kripo/Employee/EmployeeDump.aspx', html: '<div id="ctl00_m_Header">h</div><table class="export"><tr><th>DNR</th><th>Name</th><th>Email</th></tr><tr><td>8123</td><td>Huber Anna</td><td>a@example.org</td></tr></table>',
    expectScripts: ['EmployeeDump.js', 'nur8xxx.js'], expectGlobals: ['jQuery', 'PouchDB', 'vex'],
    check: (w) => [!!w.document.querySelector('#menu'), !!w.document.querySelector('#grundkurse'), !w.document.querySelector('#rddienste'), !w.document.querySelector('#pflichtfortbildungen'),
      !!w.document.querySelector('button#memo_alle_selektiert'), !!w.document.querySelector('#datatable tfoot .footer_input')],
    after: async (w) => { w.document.querySelector('#menu .menu-title').click();
      let opened = null; w.open = (u) => { opened = u; return null; };
      w.document.querySelector('#mailto_alle_sichtbaren').click();
      return [w.document.querySelector('#menu > li').classList.contains('open'), opened === 'mailto:?bcc=a%40example.org']; } },
  // Startseite: nur noch Kurs-Export
  { url: 'https://niu.wrk.at/Kripo/Today/Today.aspx',
    html: '<table id="ctl00_main_m_CourseList__CourseTable"><tr><td>h</td></tr><tr><td>h2</td></tr><tr><td>K123</td><td><a class="CourseTitel" href="/Kripo/Kufer/CourseDetail.aspx?CourseID=K123">Kurs A</a></td><td>Mo, 05.10.2026 08:00</td><td>Mo, 05.10.2026 16:00</td><td>LV</td></tr></table>',
    expectScripts: ['today.js', 'nur8xxx.js'], expectGlobals: ['createCalendar'],
    check: (w) => [/calendar\/render/.test(w.document.body.innerHTML), /Nottendorfergasse/.test(w.document.body.innerHTML), w.document.querySelector('#ctl00_main_m_CourseList__CourseTable a').target === 'wrk_todayDetail'] },
  { url: 'https://niu.wrk.at/Kripo/Kufer/SearchCourse.aspx', html: '<table></table>',
    expectScripts: ['SearchCourse.js', 'nur8xxx.js'], expectGlobals: ['moment'] }, // Fixture hat keine Kurstabelle, darf nicht werfen
  { url: 'https://niu.wrk.at/Kripo/Kufer/CourseDetail.aspx?CourseID=K1', html: '<h1>Kurs</h1><h5>K1 - Test</h5><table class="MessageTable"><tr></tr><tr></tr></table>',
    expectScripts: ['CourseDetail.js', 'nur8xxx.js'], expectGlobals: ['createCalendar'],
    check: (w) => [!w.document.querySelector('#person_autocomplete')] },
  { url: 'https://niu.wrk.at/df/memo/Memo_last.asp?x=1', html: '<table></table>', expectScripts: ['memo_last.js'], expectGlobals: ['PouchDB'] },
  { url: 'https://niu.wrk.at/df/spezialdiensterfassung/unterschreiben.asp', html: '<table><tr><th class="th">OK</th></tr></table>',
    expectScripts: ['spezialdienstUnterschreiben.js'], expectGlobals: ['jQuery'], check: (w) => [!!w.document.querySelector('button.everyone')] },
  { url: 'https://niu.wrk.at/TNG/SpezialdienstErfassung/Spezialdiensteingabe.asp', html: '<form><input name="Datum"><input name="Stundenbis"><input name="Minutenbis"><input type="checkbox" name="ListeEingabe"></form>',
    expectScripts: ['Spezialdiensteingabe.js'], expectGlobals: ['jQuery'], check: (w) => [/\d{2}\.\d{2}\.\d{4}/.test(w.document.querySelector('input[name=Datum]').value)] },
  { url: 'https://intranet.wrk.at/confluence/pages/viewpage.action?spaceKey=VFM&title=Bescheiderstellung', html: '<div id="main-content"></div>', expectScripts: [], expectGlobals: [] },
  { url: 'https://niu.wrk.at/Kripo/Header.aspx#niu-helper-settings', html: '<span id="pageTitle">NIU</span>',
    expectScripts: ['Header.js', 'header-extras.js', 'nur8xxx.js', 'settings.js'], expectGlobals: [],
    check: (w) => [w.document.title.includes('Einstellungen'), w.document.querySelectorAll('input').length === 3, w.document.querySelectorAll('select').length === 1] },
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
