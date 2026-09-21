// Ermittelt, welche globalen Namen jede Bibliothek wirklich anlegt, und ob der Extension-Code sie verwendet
const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const ext = path.join(__dirname, '..', 'extension');
const manifest = JSON.parse(fs.readFileSync(ext + '/manifest.json', 'utf8').replace(/^\uFEFF/, ''));
const libs = [...new Set(manifest.content_scripts.flatMap(c => c.js).filter(f => f.startsWith('js/')))];
const src = manifest.content_scripts.flatMap(c => c.js).filter(f => f.startsWith('src/')).map(f => fs.readFileSync(path.join(ext, f), 'utf8')).join('\n');
const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://niu.wrk.at/', runScripts: 'outside-only' });
const w = dom.window;
for (const f of libs) {
  const before = new Set(Object.getOwnPropertyNames(w));
  try { w.eval(fs.readFileSync(path.join(ext, f), 'utf8')); } catch (e) { console.log('  !! ' + f + ': ' + e.message); }
  const added = Object.getOwnPropertyNames(w).filter(k => !before.has(k));
  const used = added.filter(k => new RegExp('(^|[^.\\w$])' + k.replace('$', '\\$') + '\\b').test(src));
  console.log(f.padEnd(48), 'neu:', added.join(','), '| im Code benutzt:', used.join(',') || '-');
}
