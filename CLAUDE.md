# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Was das Repo ist

Userscript-Portierung der Chrome-Extension „NIU's little helper“ (Wiener Rotes Kreuz, internes System NIU).
Upstream: https://github.com/geraldbaeck/NIUsLittleHelper (Unlicense). Verweise auf das Original und die Lizenz
in README, `build.py`-Header und Release-Notizen müssen erhalten bleiben.

NIU wird schrittweise abgelöst; laufendes Ziel ist der Rückbau nicht mehr benötigter Funktionen.
`FUNKTIONEN.md` ist das Inventar aller Funktionen mit IDs (D1, P4, K5 …), Zustand, Abhängigkeiten und der
Spalte „Entscheidung“. Beim Entfernen von Features diese IDs verwenden und Abschnitt 4 (welche
Fremdbibliothek mit welchem Feature entfällt) beachten.

## Befehle

```bash
python3 build.py                 # -> dist/niu-little-helper.user.js + niu-little-helper.meta.js
python3 build.py --test          # -> test/build-test.user.js (mit Test-Hook, nicht ausliefern)
```

Tests (Node ist unter `C:\Program Files\nodejs` installiert, in Git Bash ggf. `export PATH="$PATH:/c/Program Files/nodejs"`;
einmalig `cd test && npm i jsdom@24 fake-indexeddb@5`):

```bash
python3 build.py --test && cd test && node smoke.js && node behaviour.js && node lvstatistic.js
```

- `smoke.js`: lädt den Test-Build in jsdom für ~13 NIU-/Intranet-URLs, prüft welche Module starten und welche
  Bibliotheks-Globals ankommen. Einzelnen Fall prüfen: das `cases`-Array in der Datei kürzen, es gibt keinen Filter-Parameter.
- `behaviour.js`: Filter „nur 8xxx“, Einstellungsseite, Storage-Shim, `NIU_BASE`.
- `lvstatistic.js`: Gruppierung der LV-Statistik gegen `test/fixtures/lvstatistic.js` (echte, namenlose Tabelle).
- `exports-scan.js`: zeigt, welche Globals jede Bibliothek anlegt; Grundlage für `EXPORTS` in `build.py`, wenn eine Bibliothek dazukommt oder wegfällt.

Release: `US_REVISION` in `build.py` hochzählen (sonst erkennen Tampermonkey/Userscripts kein Update), bauen, testen,
committen, Tag `v<extension-version>.<revision>`, dann

```bash
gh release create vX.Y.Z.N dist/niu-little-helper.user.js dist/niu-little-helper.meta.js --title "..." --notes "..."
```

`@updateURL`/`@downloadURL` zeigen fest auf `releases/latest/download/…` von SirFlip/NIU-Addons.

## Architektur

**Quelle der Wahrheit ist `extension/`** (Original-Extension, Manifest V2). `build.py` liest `extension/manifest.json`
und erzeugt daraus eine einzige Datei; die Extension selbst wird nicht mehr ausgeliefert (in Chrome nicht mehr installierbar).
Änderungen an Features gehören nach `extension/src/content_scripts/`, nie nach `dist/`.

Aufbau der gebauten Datei (alles in einer IIFE, gemeinsamer Scope wie bei Content-Scripts):

1. `userscript/shim.js`: ersetzt `chrome.storage.sync` (→ `GM.getValue/setValue`, Fallback localStorage),
   `chrome.extension.getURL` (→ eingebettete `data:`-URIs bzw. eigenes Schema `niuhelper-res:` mit jQuery-Transport),
   definiert `NIU_BASE` (aktueller Host, weil Userscripts nicht cross-origin dürfen) und `NIU_SETTINGS_URL`.
2. `SHARED` (definitions.js, lib/var.js, lib/lib.js, lib/staff-lib.js): immer im Scope, egal welche Seite.
3. `__LIBS`: jede Fremdbibliothek aus `extension/js/` in eine Funktion gewickelt, wird erst ausgeführt, wenn die
   Seite sie laut Manifest braucht; die Globals aus `EXPORTS` werden danach in den gemeinsamen Scope übernommen (`__adopt`).
4. `__SCRIPTS`: jedes Content-Script als Funktion.
5. `__ENTRIES` + Dispatcher: Manifest-`matches` werden zu Regexen (`*`-Host wird bewusst auf `niu`/`niu.wrk.at`
   eingeschränkt, Pfade case-insensitiv wegen IIS). `EXTRA_ENTRIES` hängt die nur im Userscript existierenden Module aus
   `userscript/` an (Einstellungsseite `Header.aspx#niu-helper-settings`, Settings-Link, „nur 8xxx“).

`patch_source()` in `build.py` schreibt in `staff-lib.js` alle `"https://niu.wrk.at/` auf `NIU_BASE + "/` um und
**bricht ab, wenn es nicht exakt 17 Vorkommen sind**. Wer Funktionen aus staff-lib entfernt, muss den Zähler anpassen.
`lib.js` hat eine weitere feste `niu.wrk.at`-URL (shortemployee), die nicht gepatcht wird.

Die Content-Scripts sind jQuery-Code, der NIU-Seiten (ASP.NET WebForms) per DOM-Scraping erweitert. `staff-lib.js`
kapselt die NIU-Abfragen (GET + simulierte Postbacks mit gescrapten `__EVENTVALIDATION`-Tokens) hinter einem
PouchDB-Cache (`getFromCache`, DB `niuhelperdb1`, 24 h). Fast alle Cache-Nutzer sitzen in `EmployeeDump.js`
(Liste/Ausdruck), dem größten Modul. Einzige schreibende Funktion ist `writeMemo` (Sammel-Memo in EmployeeDump).

## Repo-spezifische Regeln

- Keine NIU-Seitendumps mit Kollegennamen, Dienstnummern oder Kontaktdaten einchecken; neue Test-Fixtures vorher
  anonymisieren oder nachfragen. Die vorhandene Fixture und die Commit-Identität wurden geprüft und sind freigegeben.
- `dist/` ist eingecheckt und muss zum Stand von `extension/` + `userscript/` passen: nach Quelländerungen immer neu bauen.
