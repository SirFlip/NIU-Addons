# NIU's little helper – Userscript-Build

Macht aus der Chrome-Extension (Ordner `extension/`, Stand: Hannes-Version =
upstream `bd58b69` + eigene Änderungen) **eine** Datei
`dist/niu-little-helper.user.js` für Tampermonkey, Violentmonkey und
Userscripts (Safari/iOS).

## Bauen

    python3 build.py

Braucht nur Python 3. Version hochzählen: `US_REVISION` in `build.py`.

## Was anders ist als in der Extension

| Extension | Userscript |
|---|---|
| `chrome.storage.sync` | `GM.getValue/GM.setValue` (Fallback `GM_*`, dann `localStorage`) – gilt für `http://niu` und `https://niu.wrk.at` gemeinsam |
| Optionsseite | `…/Kripo/Header.aspx#niu-helper-settings` (Link „⚙ Einstellungen“ im NIU-Kopf, Tampermonkey-Menü) |
| `chrome.extension.getURL` | Bilder als data:-URI, HTML-Schnipsel über einen jQuery-Transport (`niuhelper-res:`) |
| feste AJAX-URLs `https://niu.wrk.at/...` | `NIU_BASE` = aktueller Host (cross-origin darf ein Userscript nicht) |
| Match `*://*/Kripo/...` (jeder Host) | nur `niu`, `niu.wrk.at`, `intranet.wrk.at`; Pfade ohne Gross/Klein-Unterschied |
| `background.js` (Willkommensseite, Dev-Reload) | entfällt |
| Cache erst nach dem ersten Speichern der Optionen aktiv | Cache standardmässig aktiv (wie auf der Optionsseite empfohlen) |
| fehlende Sortierpfeile der DataTables (`../images/` gab es nie) | aus `img/sort_*.png` eingebettet |
| `LVStatistic.js`: Gruppenzeilen per `#id_<Gruppe>_<Funktion>` gesucht – Funktionen mit Leerzeichen blieben 0, „i.A.“ warf einen Selektor-Fehler und brach die Schleife ab | Zeilen werden direkt referenziert; Dauer wird per Regex geparst; Gruppen sortiert mit „gesamt“-Zeile |
| `LVStatistic.js`: Muster für alte Dienstart-Namen (RKL/RKS …) | zusätzlich `RTW`/`NAW` → RTW, `LS` → neue Gruppe Leitstelle, `Öffentlichkeitsarbeit` → Sonstiges (heutige Namen wie „RD RTW Mittel ND“) |

Neu dabei: `userscript/nur8xxx.js` (Häkchen „nur 8xxx“ am Mitarbeiter-Dropdown).

Bibliotheken werden erst ausgeführt, wenn die aktuelle Seite sie laut
`manifest.json` braucht – deshalb darf das Skript auf dem ganzen NIU-Host laufen.

## Tests (optional, braucht Node)

    python3 build.py --test
    cd test && npm i jsdom@24 fake-indexeddb@5
    node smoke.js && node behaviour.js && node lvstatistic.js

`lvstatistic.js` rechnet die Gruppierung mit einer echten Tabelle
(`test/fixtures/lvstatistic.js`) nach.

`exports-scan.js` zeigt, welche globalen Namen jede Bibliothek anlegt
(Grundlage für `EXPORTS` in `build.py`, falls eine Bibliothek dazukommt).
