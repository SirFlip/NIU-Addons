# NIU-Addon – Funktionsinventar

Stand: Userscript 0.59.0.9 (21. September 2026). Beschreibt, was das Addon heute tut.
Die Funktions-IDs (T1, K2, P8 …) stammen aus dem ursprünglichen Inventar der
Original-Extension und werden weiterverwendet, damit alte Verweise gültig bleiben.
Was seit 0.58 entfernt wurde, steht in Abschnitt 8.

Legende
- **Zielgruppe:** MA = alle Mitarbeiter, FU = Funktionäre / Dienstführung / Kommando
- **Zustand:** OK = funktioniert und ist durch einen Test abgedeckt, OK (ungetestet) = funktioniert,
  aber nur auf NIU geprüft, FRAGIL = hängt an festen Kursnamen oder NIU-Markup, das sich ändern kann

---

## 1. Überblick nach NIU-Seite

| Seite (URL unter /Kripo bzw. /df) | Script | Zielgruppe | Kurzbeschreibung | Fremdbibliotheken |
|---|---|---|---|---|
| Rahmen `/Kripo/` (Frameset) | – | – | Frames `header` (Header.aspx), `menu` (menu.aspx), `main` | – |
| Kopfzeile `Header.aspx` | Header.js, header-extras.js, settings.js | MA | Hinweis mit Version, Link „⚙ Einstellungen“, Einstellungsseite | – |
| Sidebar `menu.aspx` | menu.js | MA | Eintrag „Kurssuche (NIU)“ unter „Ausbildung“ | – (nutzt das jQuery/Dynatree der Seite) |
| Startseite `Today/Today.aspx` | today.js | MA | Kalender-Export je Kurs | ouical |
| Kurssuche `Kufer/SearchCourse.aspx` | SearchCourse.js | MA | Autosuche, sortierbare Tabelle, Vorfilter, Formulare ausblendbar | DataTables, moment |
| Kursdetails `Kufer/CourseDetail.aspx` | CourseDetail.js | MA | Kalender-Export je Termin | ouical |
| LV-Statistik `Employee/LVStatistic.aspx` | LVStatistic.js | MA | Zusatztabelle gruppiert nach Dienstart und Funktion | – |
| Mitarbeiter kurz `Employee/shortemployee.aspx` | shortemployee.js | MA | VCF- und Foto-Download | – |
| Mitarbeiter Zusammenfassung `Employee/summaryemployee.aspx` | summaryemployee.js | MA | VCF- und Foto-Download mit Dienstnummern, Organigramm | – |
| Mitarbeiter Detail `Employee/detailEmployee.aspx` | detailEmployee.js | FU | Dekret-Hinweis, Adress-Kopierbox | PNotify, ClipboardJS |
| Mitarbeiter Liste/Ausdruck `Employee/EmployeeDump.aspx` | EmployeeDump.js | FU | Sortierbare Tabelle, Auswertungsspalten, Sammel-Mail, Sammel-Memo | DataTables, vex, PouchDB |
| Memo LAST `df/memo/memo_last.asp` | memo_last.js | FU | Autor-Filter, Mail-Icon, Kommando-Links | PouchDB |
| Memo Erinnerung `df/memo/memo_erinnerung.asp` | memo_erinnerung.js | FU | Mail-Icon, Kommando-Links | PouchDB |
| Spezialdienst-Eingabe `TNG/SpezialdienstErfassung/Spezialdiensteingabe.asp` | Spezialdiensteingabe.js | FU | Formular vorbefüllen | – |
| Spezialdienst unterschreiben `df/spezialdiensterfassung/unterschreiben.asp` | spezialdienstUnterschreiben.js | FU | Button „OK“ für alle | – |
| Alle `/Kripo/`-Seiten mit Mitarbeiter-Dropdown | nur8xxx.js | MA | Häkchen „nur Zxxx“ | – |

jQuery wird auf allen Seiten geladen, PouchDB nur dort, wo der Cache gebraucht wird.

---

## 2. Funktionen im Detail

### 2.1 Kopfzeile und Einstellungen – Header.js, header-extras.js, settings.js

| # | Funktion | Was es tut | Zustand |
|---|---|---|---|
| H1 | Hinweis „NIU-Addon 0.59.0.9 ist derzeit aktiv.“ | Oben rechts, mit Versionsnummer aus dem Script-Kopf, verlinkt auf das Repo | OK |
| H2 | Link „⚙ Einstellungen“ | Öffnet die Einstellungsseite in neuem Tab; auch über das Tampermonkey-Menü erreichbar | OK |
| H3 | Einstellungsseite `Header.aspx#niu-helper-settings` | Autosuche Kurssuche (an/aus), Cache (an/aus), Dekret-Hinweis (an/aus), Nummernkreis 1xxx–9xxx | OK |
| H4 | Häkchen „nur Zxxx“ am Mitarbeiter-Dropdown (`#m_ddlEmployee`) | Filtert auf vierstellige Dienstnummern mit der eingestellten Tausenderziffer (Standard 8), Zustand je Browser gemerkt, überlebt Postbacks | OK |

Einstellungen werden über `GM.setValue` gespeichert und gelten für `http://niu` und `https://niu.wrk.at` gemeinsam. Nach dem Speichern offene NIU-Seiten neu laden.

### 2.2 Sidebar – menu.js

| # | Funktion | Was es tut | Zustand |
|---|---|---|---|
| S1 | Eintrag „Kurssuche (NIU)“ unter „Ausbildung“, hinter „Kurssuche im MPO“ | Öffnet `/Kripo/Kufer/SearchCourse.aspx` im Hauptframe. NIU verlinkt dort nur noch die MPO-Kurssuche. | OK |

Umsetzung: bevorzugt über die Dynatree-API der Seite (`unsafeWindow.jQuery`), damit der Eintrag sich wie die anderen verhält. Ohne Zugriff auf das Seiten-JavaScript (Userscripts-App auf iOS) wird ein Listeneintrag mit `target="main"` eingefügt, dessen Klick nicht an den Baum weitergereicht wird.

### 2.3 Startseite – today.js

| # | Funktion | Was es tut | Datenquelle | Zustand |
|---|---|---|---|---|
| T4 | Kalender-Button je Kurs (Google, iCal, Outlook) | Titel, Von/Bis, Ort (Dienststellen-Kürzel wie LV, Nord werden zu Adressen aus `var.js`), Link zur Kursseite als Beschreibung | Kurstabelle der Startseite | OK |
| T5 | Kurslinks öffnen in eigenem Fenster | `target=wrk_todayDetail` | – | OK |

### 2.4 Kurssuche – SearchCourse.js

| # | Funktion | Was es tut | Datenquelle | Zustand |
|---|---|---|---|---|
| K1 | „Kursauswahl“ und „Kurssuche“ ausblenden | Links „ausblenden“ neben den Überschriften, Standard: beide ausgeblendet, Zustand gespeichert | Einstellungen | OK |
| K2 | Autosuche | Beim ersten Aufruf (noch keine Ergebnistabelle): Zeitraum heute bis +12 Monate, Optionen Qualifikationen, Stornos, Anrechnung, E-Learning, Warteliste, dann „Suchen“. Abschaltbar in den Einstellungen | Einstellungen | OK |
| K7 | „Nur abgeschlossene Kurse“ abwählen | Beim ersten Aufruf wird das von NIU vorbelegte Häkchen entfernt. Nach einer Suche bleibt die eigene Auswahl unangetastet | – | OK |
| K3 | Sortierbare Tabelle statt NIU-Tabelle | Volltextsuche, Sortierung inkl. Datum, kein Paging, Link „öffnen“ in neuem Tab. Bei unbekannter Spaltenzahl: Warnung in der Konsole, NIU-Tabelle bleibt | DOM, DataTables | OK |
| K4 | Vorfilter-Leiste | Nur freie Plätze, §50, §50 Reanimationstraining, §51 Rezertifizierung, nur/keine Anrechnungskurse, SAN-Basiskurse, keine SAN-Kurse, FSD, KHD, FKR, Pflichtfortbildungen (RD-Fortbildung); UND-verknüpft | DataTables | FRAGIL (feste Kursnamen) |

### 2.5 Kursdetails – CourseDetail.js

| # | Funktion | Was es tut | Datenquelle | Zustand |
|---|---|---|---|---|
| C4 | Kalender-Export je Termin | Neue Spalte in der Termintabelle; bei genau einem Termin zusätzlich unter der Überschrift. Ort aus Ort, Stock, Raum, Bezeichnung; Beschreibung aus „Sonstiges“ | Erste MessageTable der Seite | OK |

### 2.6 LV-Statistik – LVStatistic.js

| # | Funktion | Was es tut | Datenquelle | Zustand |
|---|---|---|---|---|
| L1 | Zusatztabelle „Gruppiert nach Funktion und Dienstart“ | Summen je Gruppe (Support, KTW, RTW, Leitstelle, KHD, BT-SAN, Ausbildung, Ambulanzen, Sonstiges, Bezirksstelle) und Funktion, Gesamtzeile je Gruppe; Spalte „Gruppiert zu“ in der Originaltabelle | DOM | OK, an aktuelle Dienstart-Namen angepasst |

### 2.7 Mitarbeiter kurz / Zusammenfassung – shortemployee.js, summaryemployee.js

| # | Funktion | Was es tut | Datenquelle | Zustand |
|---|---|---|---|---|
| V1 | VCF-Download (shortemployee) | vCard mit Foto, Kontakten, Berechtigungen | DOM, Foto per XHR | OK (ungetestet) |
| V2 | VCF-Download (summaryemployee) | Zusätzlich Dienstnummern, Organigramm, Titel | DOM, Foto per XHR | OK (ungetestet) |
| V3 | Foto-Download | Foto ist als Download-Link umhüllt | DOM | OK (ungetestet) |

### 2.8 Mitarbeiter Detail – detailEmployee.js

| # | Funktion | Was es tut | Datenquelle | Zustand |
|---|---|---|---|---|
| M1 | Hinweis „Dekrete noch nicht ausgefolgt“ | PNotify-Popup beim Laden mit Name und Datum je Dekret; abschaltbar in den Einstellungen; Fallback, falls NIU die Verschachtelung ändert | DOM | OK (ungetestet) |
| M2 | Adress-Kopierbox | Textarea mit vollem Namen (Titel, Berufstitel) und Anschrift, Kopierbutton | DOM, ClipboardJS | OK |

### 2.9 Mitarbeiter Liste/Ausdruck – EmployeeDump.js

Grundfunktion: Die NIU-Tabelle wird durch eine DataTable ersetzt (Sortierung, Filterfeld je Spalte in der Fußzeile, Zeilen per Klick auswählbar). Das Menü „Funktionen“ (reines CSS, Hover am Desktop, Tipp am Touch-Gerät) hängt je Eintrag eine Spalte an und fragt NIU je Zeile ab, mit höchstens 4 gleichzeitigen Requests. Ergebnisse liegen 24 h im PouchDB-Cache. Fehlgeschlagene Abfragen zeigen „Fehler“.

Buttons neben der Überschrift:

| # | Funktion | Was es tut | Datenquelle | Zustand |
|---|---|---|---|---|
| P1 | Alle Zeilen selektieren / Selektion löschen | Zeilenauswahl | DOM | OK |
| P2 | Mailto an alle sichtbaren / an alle selektierten | Öffnet das Mailprogramm mit leerem An-Feld und allen Adressen im BCC | Spalte „Email“ | OK |
| P3 | Memo für alle selektierten | Dialog (Verfasser aus eigenen Dienstnummern, Text, Datum, Erinnerung), schreibt je Person ein Memo. Felder werden als ISO-8859-1 gesendet; Zeichen außerhalb (€, „“, –) werden ersetzt | POST `df/memo/memo_Neu.asp`, `Header.aspx` | OK (ungetestet gegen NIU, Kodierung im Unit-Test) |

Menü „Funktionen“:

| # | Menüpunkt | Spalte / Inhalt | Datenquelle | Zustand |
|---|---|---|---|---|
| P8 | Ausbildungen → Grundkurse prüfen | Das RK, KHD-SD, SAN1-Seminar (das alte Ambulanzseminar zählt als SAN1-Seminar) mit Teilnahmestatus | `SearchCourse.aspx?EmployeeId` Postback | FRAGIL (feste Kursnamen, Cache-Version `grk4`) |
| P10 | Ausbildungen → SAN-Ampeln prüfen | Ampel-Icons aus der Detailseite | `detailEmployee.aspx` | OK (ungetestet) |
| P12 | Berechtigungen → Alle / SAN / FSD / Fahrer | Nicht widerrufene Berechtigungen je Typ; „Fahrer“ findet auch die drei neuen Fahrer-Berechtigungen | `detailEmployee.aspx` | OK (ungetestet) |
| P13 | Verwaltung → Dienstgrade auswerten | Dienstgrad | `detailEmployee.aspx` | OK (ungetestet) |
| P14 | Verwaltung → Gaststatus auswerten | ja/nein | `detailEmployee.aspx` | OK (ungetestet) |
| P15 | Verwaltung → Fehlende MA-Fotos auswerten | ja/nein | `detailEmployee.aspx` | OK (ungetestet) |
| P16 | Verwaltung → Kommando einblenden | 11 Deep-Links je Person (Mitarbeiter, Details, Urlaub, Fahrscheingeld, Uniform, Schlüssel, Memo, Ausbildung, LV Statistik, Statistik, Dokumente), Host wie die aktuelle Seite | `ControlCenterHead.aspx` (IDs) | OK; Fahrscheingeld ungeprüft (keine Berechtigung des Testkontos) |
| P18 | EDV → AD Benutzer auswerten | AD-Benutzername | `detailEmployee.aspx` | OK (ungetestet) |

### 2.10 Memos – memo_last.js, memo_erinnerung.js

| # | Funktion | Was es tut | Datenquelle | Zustand |
|---|---|---|---|---|
| ML1 | Autor-Filter (nur Memo LAST) | Dropdown über den Memos, vergleicht nur die Autor-Zelle | DOM | OK |
| ML2 | Mail-Icon je Memo/Erinnerung | Dienstnummer aus der Kopfzeile → Mailadresse → mailto; ohne hinterlegte Adresse leer | `ControlCenterHead.aspx`, `detailEmployee.aspx` | OK |
| ML3 | Zahnrad je Memo/Erinnerung | Kommando-Links wie P16 | `ControlCenterHead.aspx` | OK |

Auf der Erinnerungsseite bekommen Zeilen mit „erneute“ keine Icons.

### 2.11 Spezialdienste – Spezialdiensteingabe.js, spezialdienstUnterschreiben.js

| # | Funktion | Was es tut | Zustand |
|---|---|---|---|
| SP1 | Eingabeformular vorbefüllen | Datum heute, Endzeit jetzt, Kennziffer „Admin_BS_Funkt“, Listeneingabe angehakt | OK |
| SP2 | Button „OK“ im Tabellenkopf | Hakt alle OK-Checkboxen an | OK |

---

## 3. Gemeinsamer Code

Alle vier Dateien liegen im Userscript immer im gemeinsamen Scope.

| Datei | Inhalt | Genutzt von |
|---|---|---|
| `definitions.js` | Storage-Keys und Standardwerte: Autosuche, Formulare ausblenden, Cache, Dekret-Hinweis, Nummernkreis, PouchDB-Name | SearchCourse, detailEmployee, settings, nur8xxx, staff-lib |
| `lib/var.js` | `department` (Adressen der Dienststellen), `copyImage` | today, detailEmployee |
| `lib/lib.js` | vCard erzeugen, Mitarbeiter und Kontakte von `shortemployee.aspx` lesen, VCF-Link, UID aus URL | shortemployee, summaryemployee |
| `lib/staff-lib.js` | siehe unten | EmployeeDump, memo_*, SearchCourse |

staff-lib.js:

| Funktion | Zweck | NIU-Endpunkt |
|---|---|---|
| `isCacheActive`, `getDB`, `saveToCache`, `getFromCache` | PouchDB-Cache `niuhelperdb1`, 24 h, abschaltbar | – |
| `getOwnDNRs` | Eigene Dienstnummer(n) | `Kripo/Header.aspx` |
| `dnrToIdentifier` | Dienstnummer → EmployeeNumberID (ENID) und EmployeeId (EID) | `Kripo/external/ControlCenterHead.aspx` GET+POST |
| `getEmployeeDataSheet`, `parseEmployeeDataSheet` | Stammdaten, E-Mail, AD-User, Berechtigungen, Ampel | `Kripo/Employee/detailEmployee.aspx` |
| `checkCourseAttendance` | Wurden bestimmte Kurse besucht | `Kripo/Kufer/SearchCourse.aspx?EmployeeId` Postback |
| `writeMemo`, `encodeLatin1` | Memo anlegen, ISO-8859-1-Kodierung | POST `df/memo/memo_Neu.asp` |
| `getNiuDateString` | Datum → `d.M.yyyy` | – |
| `niuBase`, `kommandoLinks` | Basis-URL (aktueller Host), Deep-Links je Mitarbeiter | – |
| `runWithLimit` | Gedrosselte parallele Abfragen | – |

`build.py` schreibt alle `"https://niu.wrk.at/` in staff-lib.js auf den aktuellen Host um und erwartet dabei genau 7 Vorkommen. `lib.js` enthält eine weitere feste URL (shortemployee), die nur als Link dient.

---

## 4. Fremdbibliotheken

| Bibliothek | Gebraucht von |
|---|---|
| jQuery | alle Seiten-Scripts |
| PouchDB | Cache in staff-lib (EmployeeDump, Memo-Seiten) |
| DataTables + datetime-moment, moment | SearchCourse, EmployeeDump |
| ouical (+ CSS) | today, CourseDetail |
| vex (+ Theme) | EmployeeDump (Dialoge) |
| PNotify (+ CSS) | detailEmployee |
| ClipboardJS | detailEmployee |

Bibliotheken werden erst ausgeführt, wenn die Seite sie laut Manifest braucht. Gebaute Datei: ca. 1,1 MB.

---

## 5. NIU-Endpunkte, die im Hintergrund aufgerufen werden

| Endpunkt | Wofür | Genutzt von |
|---|---|---|
| `Kripo/Header.aspx` | eigene Dienstnummern | P3 |
| `Kripo/external/ControlCenterHead.aspx` | Dienstnummer → IDs | EmployeeDump, Memo-Seiten |
| `Kripo/Employee/detailEmployee.aspx` | Datenblatt | EmployeeDump, Memo-Seiten |
| `Kripo/Kufer/SearchCourse.aspx` | Kursbesuch | P8 |
| Foto-URL der Mitarbeiterseite | vCard-Foto | V1, V2 |

Schreibend: nur `df/memo/memo_Neu.asp` (P3, Sammel-Memo).

Die Postback-Parser hängen an WebForms-Feldnamen (`ctl00$main$…`). Layoutänderungen in NIU brechen sie; das fällt beim Benutzen auf, nicht in der CI.

---

## 6. Einstellungen

| Einstellung | Standard | Wirkt auf |
|---|---|---|
| Kurssuche automatisch 12 Monate | an | K2 |
| Cache (24 h) | an | alle staff-lib-Abfragen |
| Hinweis nicht ausgefolgte Dekrete | an | M1 |
| Nummernkreis für „nur Zxxx“ | 8 | H4 |
| intern: Kursauswahl/Kurssuche ausgeblendet | beide ausgeblendet | K1 |

---

## 7. Tests

`python3 build.py --test`, dann in `test/`: `node smoke.js && node behaviour.js && node lvstatistic.js`.

- `smoke.js`: lädt den Test-Build in jsdom für 20 URLs, prüft, welche Module starten, welche Bibliotheken ankommen, und je Seite konkrete DOM-Ergebnisse. Fixtures in `test/fixtures/pages.js` (Startseite, Kursdetails, Memo-Erinnerung) sind nach echten Seiten nachgebaut, ohne Personendaten.
- `behaviour.js`: „nur Zxxx“ inklusive Nummernkreis, Einstellungsseite und Speicherung über Hosts hinweg, `getNiuDateString`, `runWithLimit`, `kommandoLinks`, `parseEmployeeDataSheet`, `encodeLatin1`.
- `lvstatistic.js`: Gruppierung gegen `test/fixtures/lvstatistic.js` (echte, namenlose Tabelle).
- CI (`.github/workflows/ci.yml`): Build, Abgleich `dist/` mit den Quellen, alle Tests bei jedem Push.

---

## 8. Seit 0.58 entfernt

Dienstplanung und Ambulanzen laufen in einem anderen System, Kursan- und -abmeldung machen die Leute selbst. Entfernt wurden:

- **Ganze Module:** Dienstplan (Filter, Kalender-Export, DF-Tabelle, Autocomplete), offene Ambulanz-Positionen, Ambulanz Detail/Bearbeiten (Mail an alle, WhatsApp, Excel-Export), Dienststatistik mit Diagrammen, Mitarbeiter Neu (freie Dienstnummern), Leitstellen-Kopf, beide Confluence-Erweiterungen (Bescheiderstellung, Fahrzeugtagebuch), Hintergrundscript und Optionsseite der Chrome-Extension.
- **Startseite:** Kalender-Export je Dienst und Ambulanz, ICS-Download der nächsten 14 Tage, Wunschmeldung-Styling.
- **Kurssuche:** Anmelde-/Abmelde-Mail an die Ausbildungs-Postfächer.
- **Kursdetails:** Kostenstelle merken, Kürzel eintragen, Mitarbeiter-Suchfeld.
- **Mitarbeiter Detail:** Brief aus Word-Vorlage.
- **Liste/Ausdruck:** Dienststatistik-Spalten (16 Untertypen, RD-Dienste, Dienststunden, letzte Dienstleistung), Pflichtfortbildungen, No-Shows, Schlüssel-Auswertung, automatische freie Dienstnummer.
- **Einstellungen:** Kürzel, Autocomplete im Dienstplan.
- **Bibliotheken:** jQuery UI, ics.js, SheetJS, spin.js, Chartist, docxtemplater, JSZip, FileSaver, jquery-modal.

Das vollständige Inventar von 0.58 mit allen damaligen Funktionen steht in der Git-Historie (`git show v0.58.3.3:FUNKTIONEN.md`).

---

## 9. Offen

- **Fahrscheingeld-Link (P16):** nur prüfbar durch jemanden mit Berechtigung für den Bereich. Meldet sich jemand, dass er nicht geht, wird er wie „Memo“ auf die internen IDs umgestellt.
- **Feste Kursnamen (K4, P8):** nachziehen, falls NIU sie ändert; bei P8 die Cache-Version `grk4` hochzählen.
- **Sammel-Memo (P3):** gegen NIU nicht mit einem echten Memo geprüft, weil das eigene Tagebuch nicht einsehbar ist. Kodierung ist im Unit-Test abgedeckt.
