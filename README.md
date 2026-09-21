# NIU's little helper – Userscript-Build

## Installation

Die fertige Datei liegt bei jedem Release unter einer festen Adresse:

    https://github.com/SirFlip/NIU-Addons/releases/latest/download/niu-little-helper.user.js

Daneben liegt `niu-little-helper.meta.js` (nur der Kopf mit Versionsnummer).
Beide Adressen stehen im Script als `@downloadURL` und `@updateURL`, darüber
laufen die automatischen Updates. Voraussetzung für ein Update ist, dass die
`@version` im Release höher ist als die installierte.

### Desktop: Chrome, Edge, Firefox, Safari mit Tampermonkey

1. Tampermonkey installieren: [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo),
   [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd),
   [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/tampermonkey/),
   [Safari App Store](https://apps.apple.com/app/tampermonkey/id1482490089).
2. **Nur Chrome und Edge:** unter `chrome://extensions` bzw. `edge://extensions` den
   **Entwicklermodus** einschalten. Ohne ihn führt Tampermonkey seit Chrome 120
   keine Userscripts aus.
3. Die Adresse oben im Browser öffnen. Tampermonkey zeigt die Installationsseite,
   dort **Installieren** klicken.
4. NIU neu laden. Im Kopf der Seite erscheint „NIU's little helper ist derzeit aktiv“.

**Auto-Update:** Tampermonkey prüft die `@updateURL` standardmäßig etwa einmal
täglich und installiert neue Versionen ohne Nachfrage. Einstellen unter
Tampermonkey-Menü → **Dashboard → Einstellungen → Script-Update →
Prüfintervall**. Sofort prüfen: **Dashboard → Hilfsmittel → Nach Script-Updates
suchen** oder im Dashboard das Script öffnen und **Nach Updates suchen** wählen.

Violentmonkey funktioniert gleich (Einstellungen → „Auf Updates prüfen“).

### iPhone, iPad und Mac Safari mit „Userscripts“

1. App **Userscripts** von quoid aus dem [App Store](https://apps.apple.com/app/userscripts/id1463298887)
   laden. Am Mac und am iPhone ist es dieselbe App.
2. Die Erweiterung einschalten: **Einstellungen → Apps → Safari → Erweiterungen →
   Userscripts** (iOS) bzw. **Safari → Einstellungen → Erweiterungen** (Mac).
   Dort den Zugriff auf `niu.wrk.at` (und `niu`, falls im WLAN genutzt) erlauben,
   am einfachsten „Alle Websites“.
3. Die App einmal öffnen und einen Ordner für die Scripts wählen (Vorschlag:
   den vorgeschlagenen iCloud-Ordner „Userscripts“ übernehmen). Ohne Ordner
   speichert die Erweiterung nichts.
4. In Safari die Adresse oben öffnen. Safari zeigt den Quelltext. Das
   Userscripts-Symbol in der Adressleiste (Puzzle-Symbol „Erweiterungen“) antippen,
   dort **Userscripts** wählen. Die Erweiterung erkennt die `.user.js` und bietet
   **Install** an.
   Alternativ die Datei über „Teilen → In Dateien sichern“ direkt in den
   Userscripts-Ordner legen.
5. NIU laden und prüfen, ob der Hinweis im Kopf erscheint. Falls nicht: im
   Userscripts-Popup nachsehen, ob das Script aktiviert ist.

Installation und Updates über die Userscripts-App wurden auf dem iPhone geprüft (September 2026).

**Auto-Update:** Userscripts liest `@updateURL` und `@downloadURL`. Beim Öffnen
des Userscripts-Popups in Safari erscheint oben ein Hinweis, wenn eine neuere
Version vorliegt, ein Tipp auf **Update** installiert sie. Eine stille
Aktualisierung im Hintergrund wie bei Tampermonkey gibt es dort nicht, es
braucht den Tipp im Popup. In der App kann man unter **Settings** zusätzlich
„Check for Updates“ auslösen.

### Neue Version veröffentlichen

1. `US_REVISION` in `build.py` hochzählen (sonst erkennen die Clients kein Update).
2. `python3 build.py` und die Tests laufen lassen.
3. Committen, Tag `vX.Y.Z.N` setzen, pushen.
4. GitHub-Release mit beiden Dateien aus `dist/` anlegen:

       gh release create vX.Y.Z.N dist/niu-little-helper.user.js dist/niu-little-helper.meta.js --title "..." --notes "..."

Die Adresse `releases/latest/download/…` zeigt danach automatisch auf das neue Release.

## Was das Tool kann

Seit Version 0.59 ist das Addon auf die Teile von NIU reduziert, die noch in
Verwendung sind. Dienstplan und Ambulanzen laufen in einem anderen System, die
zugehörigen Funktionen wurden entfernt.

- **Startseite:** Kalender-Export je Kurs (Google, iCal, Outlook).
- **Kurssuche:** „Nur abgeschlossene Kurse“ beim Aufruf abgewählt, automatische Suche über die nächsten 12 Monate, sortierbare
  Tabelle mit Volltextsuche, Vorfilter (freie Plätze, §50/§51, SAN-Basiskurse,
  FSD, KHD, FKR, Pflichtfortbildungen), Kursauswahl und Suchformular ausblendbar.
- **Kursdetails:** Kalender-Export je Termin.
- **LV-Statistik:** Zusatztabelle gruppiert nach Dienstart und Funktion.
- **Mitarbeiter Liste/Ausdruck:** sortierbare Tabelle mit Filter je Spalte,
  Auswertungsspalten (Grundkurse, SAN-Ampel, Berechtigungen, Dienstgrad,
  Gaststatus, fehlendes Foto, AD-Benutzer, Kommando-Links),
  Sammel-Mail und Sammel-Memo für ausgewählte Zeilen.
- **Mitarbeiter Detail:** Hinweis auf nicht ausgefolgte Dekrete, Kopierbox für
  Name und Anschrift.
- **Mitarbeiter kurz/Zusammenfassung:** VCF- und Foto-Download.
- **Memos:** Autor-Filter, Mail-Icon und Kommando-Links je Memo.
- **Spezialdienste:** Eingabeformular vorbefüllen, „alle OK“ beim Unterschreiben.
- **Sidebar:** Eintrag „Kurssuche (NIU)“ unter „Ausbildung“, weil NIU dort nur noch die MPO-Kurssuche verlinkt.
- **Überall:** Häkchen „nur 8xxx“ am Mitarbeiter-Dropdown (Nummernkreis in den Einstellungen wählbar), Einstellungen im NIU-Kopf.

Das vollständige Inventar mit allem, was es vor dem Rückbau gab, steht in
[FUNKTIONEN.md](FUNKTIONEN.md).

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
| Menü in Liste/Ausdruck mit jQuery UI | reines CSS-Menü, jQuery UI entfällt |

Neu dabei: `userscript/nur8xxx.js` (Häkchen „nur 8xxx“ am Mitarbeiter-Dropdown).
Entfernt (siehe FUNKTIONEN.md): Dienstplan, Ambulanzen, Dienststatistik, Kursan-/abmeldung,
Word-Vorlagen, Mitarbeiter Neu, Confluence-Erweiterungen.

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
