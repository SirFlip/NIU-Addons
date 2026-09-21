// Prüft die Gruppierung der LV-Statistik mit einer echten Tabelle (fixtures/lvstatistic.js)
process.on('unhandledRejection', () => {});
const { JSDOM, VirtualConsole } = require('jsdom'); const fs = require('fs');
const fx = require('./fixtures/lvstatistic.js');
const code = fs.readFileSync(__dirname + '/build-test.user.js', 'utf8');

const errors = [];
const vc = new VirtualConsole();
vc.on('error', (...a) => errors.push(a.map(String).join(' ')));
vc.on('jsdomError', (e) => errors.push(e.message));
const dom = new JSDOM('<!doctype html><body>' + fx.html() + '</body>', { url: 'https://niu.wrk.at/Kripo/Employee/LVStatistic.aspx', runScripts: 'outside-only', virtualConsole: vc, pretendToBeVisual: true });
const w = dom.window;
w.GM = { getValue: async () => undefined, setValue: async () => {} };
w.eval(code);

setTimeout(() => {
  let ok = true; const t = (name, cond, info) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : '  -> ' + info)); if (!cond) ok = false; };
  const d = w.document;
  const tables = [...d.querySelectorAll('h3')].map((h) => [h.textContent, h.nextElementSibling]);
  const grp = tables.find(([h]) => h.startsWith('Gruppiert'))[1];
  const src = tables.find(([h]) => h.startsWith('Dienste nach'))[1];
  const rows = [...grp.querySelectorAll('tr')].slice(1).map((r) => [...r.children].map((c) => c.textContent.trim()));
  const find = (g, f) => rows.find((r) => r[0] === g && r[1] === f);
  const parse = (s) => { const m = /(\d+) h (\d+) Min/.exec(s); return +m[1] * 60 + +m[2]; };

  t('keine Skriptfehler', errors.length === 0, errors.join(' | '));
  t('alle Quellzeilen haben Gruppierungs-Zelle', src.querySelectorAll('td.gruppiertzu').length === fx.rows.length);

  // Referenz: alle Zeilen einer Gruppe/Funktion selbst summieren
  const groups = {
    Support: /[Ss]upport/, KTW: /KTW(?! Support)|Tag |Nacht /, RTW: /RTW|NAW|RKL|RKS|RKP|RKF|RK3|RKIII/, Leitstelle: /\bLS\b/,
    KHD: /KHD Einsatz|KHD Mitarbeit|KAT |KAT-|KHD Übung|Einsatz FlüHi/, 'BT-SAN': /KHD Bereitschaft SAN|KHD Rufbereitschaft BT-SAN/,
    Ausbildung: /Ausbildung/, Ambulanzen: /Ambulanz(?!support)/, Sonstiges: /Mitarbeit LV|Öffentlichkeitsarbeit/, Bezirksstelle: /Bez\. /,
  };
  let checked = 0;
  for (const [g, re] of Object.entries(groups)) {
    const byF = {};
    for (const r of fx.rows) {
      if (!re.test(r[0])) continue;
      const f = r[1]; const m = /(\d+) h\s+(\d+) Min/.exec(r[3]);
      byF[f] = byF[f] || { anz: 0, dauer: 0, aus: 0, nacht: 0, blau: 0 };
      byF[f].anz += r[2]; byF[f].dauer += +m[1] * 60 + +m[2]; byF[f].aus += r[4]; byF[f].nacht += r[5]; byF[f].blau += r[6];
    }
    for (const [f, e] of Object.entries(byF)) {
      const row = find(g, f); checked++;
      t(`${g} / ${f || '(leer)'}`, row && +row[2] === e.anz && parse(row[3]) === e.dauer && +row[4] === e.aus && +row[5] === e.nacht && +row[6] === e.blau, JSON.stringify(row));
    }
  }
  t('mindestens 25 Gruppenzeilen geprüft', checked >= 25, checked);
  t('jede Quellzeile hat eine Gruppe', [...src.querySelectorAll('td.gruppiertzu')].every((c) => c.textContent.trim() !== ''),
    [...src.querySelectorAll('tr')].filter((r) => r.querySelector('td.gruppiertzu') && !r.querySelector('td.gruppiertzu').textContent.trim()).map((r) => r.children[0].textContent).join(', '));
  // Stichproben
  t('RTW/RTW-NAW F = 16 Dienste, 54 Ausfahrten', (find('RTW', 'RTW-NAW F') || []).slice(2).join() === '16,86 h 30 Min,54,46,54', JSON.stringify(find('RTW', 'RTW-NAW F')));
  t('KHD/KHD FMD MA i.A. vorhanden', !!find('KHD', 'KHD FMD MA i.A.'));
  t('Gruppensumme RTW', (find('RTW', 'gesamt') || []).slice(2).join() === '24,135 h 0 Min,83,70,83', JSON.stringify(find('RTW', 'gesamt')));
  process.exit(ok ? 0 : 1);
}, 300);
