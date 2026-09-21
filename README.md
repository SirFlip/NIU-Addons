# NIU's little helper – Userscript-Build

## Installation

Die fertige Datei liegt bei jedem Release unter
<https://github.com/SirFlip/NIU-Addons/releases/latest/download/niu-little-helper.user.js>.

**Desktop (Chrome, Edge, Firefox) mit Tampermonkey oder Violentmonkey**

1. Tampermonkey aus dem Store des Browsers installieren.
2. Den Link oben öffnen. Tampermonkey zeigt die Installationsseite, dort „Installieren“ klicken.
3. Updates holt Tampermonkey automatisch über die im Script eingetragene `@updateURL`.

**iPhone / iPad / Mac Safari mit „Userscripts“**

1. App „Userscripts“ (quoid) aus dem App Store installieren und in Safari als Erweiterung aktivieren.
2. Den Link oben in Safari öffnen. Das Userscripts-Symbol in der Adressleiste antippen, dort erscheint das Script zur Installation.
   Alternativ die Datei in den Userscripts-Ordner in „Dateien“ legen.
3. Beim ersten Aufruf von NIU im Userscripts-Menü die Erweiterung für `niu.wrk.at` erlauben.

**Einstellungen** erreichst du im NIU-Kopf über „⚙ Einstellungen“ oder das Tampermonkey-Menü.

## Was das Tool kann

Siehe [FUNKTIONEN.md](FUNKTIONEN.md) für das vollständige Inventar aller Funktionen mit Zustand und Abhängigkeiten.

## Herkunft und Lizenz

Dieses Repo ist eine Userscript-Portierung der Chrome-Erweiterung
**„NIU's little helper“** von Gerald Bäck, Sebastian Kuttnig, Stephan Spindler,
Daniel Steiner und weiteren Mitwirkenden:
<https://github.com/geraldbaeck/NIUsLittleHelper>

Der Ordner `extension/` enthält die Original-Extension (Stand upstream `bd58b69`
plus eigene Änderungen, siehe Tabelle unten). `build.py` macht daraus **eine**
Datei `dist/niu-little-helper.user.js` für Tampermonkey, Violentmonkey und
Userscripts (Safari/iOS).

Das Original ist als **Unlicense** (public domain) veröffentlicht. Diese
Portierung steht unter derselben Lizenz, siehe [UNLICENSE](UNLICENSE).
Die eingebetteten Fremdbibliotheken (jQuery, jQuery UI, PouchDB, moment,
DataTables, SheetJS, docxtemplater, JSZip, FileSaver, Chartist, vex, PNotify,
ClipboardJS, jquery-modal, spin.js, ouical, ics.js) unterliegen ihren eigenen
Lizenzen; die Lizenz-Header bleiben in der gebauten Datei erhalten.
NIU selbst ist Eigentum des Österreichischen Roten Kreuzes.

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
