# NIU's little helper – Funktionsinventar

Stand: Inventar zu Extension 0.58.3 / Userscript 0.58.3.2 (September 2026).
**Der Rückbau laut Abschnitt 8 ist mit Version 0.59.0.1 umgesetzt.** Alles mit „weg“ ist
aus dem Code entfernt; die Tabellen bleiben als Nachschlagewerk, was es einmal gab.
Zweck: Entscheidungsgrundlage, welche Funktionen beim Umbau bleiben und welche
entfallen, weil NIU schrittweise abgelöst wird. Die Spalte **Entscheidung**
enthält seit 2026-09-21 einen **Vorschlag** (behalten / weg / prüfen), siehe
Abschnitt 8. Bis zur Freigabe ist nichts davon umgesetzt.

Legende
- **Zielgruppe:** MA = alle Mitarbeiter, FU = Funktionäre / Dienstführung / Kommando
- **Zustand:** OK = funktioniert wie beschrieben, FRAGIL = hängt an festen
  Spaltenindizes, alten Dienstart-Namen o. ä., TOT = kein Aufrufer oder
  auskommentiert, KAPUTT = erkennbar fehlerhaft

---

## 1. Überblick nach NIU-Seite

| Seite (URL unter /Kripo bzw. /df) | Script | Zielgruppe | Kurzbeschreibung | Fremdbibliotheken |
|---|---|---|---|---|
| Startseite `Today/Today.aspx` | today.js | MA | Kalender-Export je Dienst/Ambulanz/Kurs, ICS-Download 14 Tage | ouical, ics.js, jQuery UI (ungenutzt) |
| Dienstplan `DutyRosterNH/DutyRoster.aspx` | DutyRoster.js | MA (+FU) | Erweiterte Filter, Kalender-Export eigener Dienste, DF-Tabelle ausblenden, Autocomplete (experimentell) | jQuery UI, moment, ouical, PouchDB |
| Dienststatistik `DutyRoster/EmployeeDutyStatistic.aspx` | EmployeeDutyStatistic.js | MA | Spalte Dauer, Tortendiagramme, Übersicht, Top-Kollegen | Chartist |
| LV-Statistik `Employee/LVStatistic.aspx` | LVStatistic.js | MA | Gruppierte Zusatztabelle nach Dienstart und Funktion | – |
| Kurssuche `Kufer/SearchCourse.aspx` | SearchCourse.js | MA | Autosuche 12 Monate, sortierbare Tabelle mit Volltextsuche, Vorfilter, Anmelde-Mail | DataTables, moment, PouchDB |
| Kursdetails `Kufer/CourseDetail.aspx` | CourseDetail.js | MA/FU | Letzte Kostenstelle merken, Kürzel eintragen, Mitarbeiter-Autocomplete, Kalender-Export | jQuery UI, ouical |
| Offene Ambulanz-Positionen `Ambulances/AmbulancesOpenPositions.aspx` | AmbulancesOpenPositions.js | MA | Filter nach Position, Wochentag, Zeitraum | – |
| Ambulanz Detail/Bearbeiten `Ambulances/AmbulancesEdit.aspx`, `AmbulancesDetail.aspx` | AmbulancesEdit.js | FU (+MA) | Mail an alle, Mail/WhatsApp je Mitarbeiter, Excel-Export, Kalender-Export | jquery-modal, moment, SheetJS, spin.js, ouical |
| Mitarbeiter kurz `Employee/shortemployee.aspx` | shortemployee.js | MA | VCF-Download, Foto-Download | – |
| Mitarbeiter Zusammenfassung `Employee/summaryemployee.aspx` | summaryemployee.js | MA | VCF-Download (mit Dienstnummern, Berechtigungen, Organigramm), Foto-Download | – |
| Mitarbeiter Detail `Employee/detailEmployee.aspx` | detailEmployee.js | FU | Dekret-Hinweis, Adress-Kopierbox, Brief aus Word-Vorlage | PNotify, ClipboardJS, docxtemplater, JSZip, FileSaver, jquery-modal, PouchDB |
| Mitarbeiter Liste/Ausdruck `Employee/EmployeeDump.aspx` | EmployeeDump.js | FU | Sortierbare Tabelle, ca. 20 Auswertungs-Spalten (Statistik, Ausbildung, Berechtigungen, Schlüssel …), Sammel-Mail, Sammel-Memo | DataTables, jQuery UI, vex, PouchDB |
| Mitarbeiter Neu `Employee/newEmployee.aspx` | newEmployee.js | FU | Freie Dienstnummern anzeigen / zuordnen | jQuery UI, PouchDB, DataTables (ungenutzt) |
| Leitstellen-Kopf `external/ControlCenterHead.aspx` | ControlCenter.js | – | leer (Aufruf auskommentiert) | jQuery UI (ungenutzt) |
| Kopfzeile `Header.aspx` | Header.js + header-extras.js + settings.js | MA | Hinweis „aktiv“, Link Einstellungen, Einstellungsseite (Userscript) | – |
| Memo LAST `df/memo/memo_last.asp` | memo_last.js | FU | Autor-Filter, Mail-Icon, Kommando-Links je Memo | PouchDB |
| Memo Erinnerung `df/memo/memo_erinnerung.asp` | memo_erinnerung.js | FU | Mail-Icon, Kommando-Links je Erinnerung | PouchDB |
| Spezialdienst-Eingabe `TNG/SpezialdienstErfassung/Spezialdiensteingabe.asp` | Spezialdiensteingabe.js | FU | Formular vorbefüllen (Datum, Endzeit, Kennziffer Admin_BS_Funkt, Listeneingabe) | – |
| Spezialdienst unterschreiben `df/spezialdiensterfassung/unterschreiben.asp` | spezialdienstUnterschreiben.js | FU | Button „alle OK“ | – |
| Alle `/Kripo/`-Seiten mit Mitarbeiter-Dropdown | nur8xxx.js (nur Userscript) | MA | Häkchen „nur 8xxx“ am Dropdown | – |
| Intranet Confluence `VFM/Bescheiderstellung` | vfm-bescheiderstellung.js | FU | Bescheid aus Word-Vorlage mit Formulardaten | docxtemplater, JSZip, FileSaver, jquery-modal |
| Intranet Confluence `viewpage.action` (Fahrzeugtagebuch) | viewpage.action.js | FU | Status-Filter und Farbcodierung in der Fahrzeugtagebuch-Tabelle | – |

---

## 2. Funktionen im Detail

### 2.1 Startseite – today.js (291 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| T1 | Link „Meinen Dienstplan für die nächsten 14 Tage herunterladen“ | ICS-Datei mit allen Diensten und Ambulanzen der Startseite | DOM + ics.js | FRAGIL: wartet nicht auf die Ambulanz-Abfragen, Datei kann unvollständig sein | **weg** (Dienste/Ambulanzen nicht mehr in NIU) |
| T2 | Kalender-Button je Dienst (Google/iCal/Outlook) | Titel = Dienstart, bei RTW/KTW mit Fahrzeug, Adresse aus `department` | DOM, var.js | OK | **weg** |
| T3 | Kalender-Button je Ambulanz | Holt je Ambulanz die Detailseite per AJAX für Webinfo und Ort | AJAX `AmbulancesDetail.aspx` | OK | **weg** |
| T4 | Kalender-Button je Kurs | Aus der Kurstabelle, nicht in der ICS-Datei enthalten | DOM | OK | **behalten** (Startseite zeigt weiterhin Kurse) |
| T5 | Links in Ambulanz-/Kurstabelle öffnen in eigenem Fenster | `target=wrk_todayDetail` | – | OK | **behalten** (nur noch für die Kurstabelle) |
| T6 | Wunschmeldung-Styling | Hellblau/kursiv, Beschriftung „Wunschmeldung“ | DOM | OK | **weg** |
| T7 | Kollegen-Fotos, Mail/WhatsApp je Dienstpartner | Auskommentiert („vorerst deaktiviert“), aber die AJAX-Abfragen an `shortemployee.aspx` laufen noch für jeden Dienstpartner ins Leere | AJAX | TOT + unnötige Last | **weg** (tot) |

### 2.2 Dienstplan – DutyRoster.js (501 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| D1 | Checkbox „Leerzeilen filtern“ | Unbesetzte, nicht meldbare Dienste ausblenden | DOM | OK | **weg** (Dienstplan in anderem System) |
| D2 | Checkbox „nur NKTW“ | Bemerkung enthält NKTW, N-KTW, Notfall-KTW, RKK | DOM | FRAGIL (alte Bezeichnungen) | **weg** |
| D3 | Checkbox „nur Kurzdienste“ | CSS-Klasse `Short` der Zeitzelle | DOM | OK | **weg** |
| D4 | Checkbox „nur eigene Dienste“ | Abgleich mit eigenen Dienstnummern aus dem Vorschlags-Dropdown | DOM | OK | **weg** |
| D5 | Checkbox „nur PAL Dienste“ | Spalte PAL | DOM | OK | **weg** |
| D6 | Radio Tag-/Nacht-/Alle Dienste | CSS-Klasse `Day`/`Night` | DOM | OK | **weg** |
| D7 | Select „nur HA/West/DDL/VS/Nord/BVS Permanenzen“ | Nur sichtbar, wenn Dienstart „RK“ im Namen hat | DOM | FRAGIL (alte Dienstart-Namen RKL/RKS) | **weg** |
| D8 | Checkboxen „Nur meldbare Dienste als: Fahrer/SAN1/SAN2 …“ | Eine Checkbox je Funktionsspalte | DOM | OK | **weg** |
| D9 | Wochentags-Checkboxen Mo–So | Filter über Spalte Tag | DOM | OK | **weg** |
| D10 | Link „DF einblenden/ausblenden“ | Dienstführungs-Tabelle standardmäßig versteckt | DOM | OK | **weg** |
| D11 | Link „Suchoptionen einblenden“ / ✖ | NIU-Suchbox und Filterblock aus-/einblenden | DOM | OK | **weg** |
| D12 | Kalender-Export je eigenem Dienst | ouical-Button in letzter Spalte, nur bei eigenen Diensten sichtbar; nach „Melden“ per MutationObserver nachgezogen | DOM, var.js | OK | **weg** |
| D13 | Autocomplete in DF-Bearbeitungsfeldern | Nur bei Option „Autocomplete-Felder im Dienstplan“ (Standard aus); lädt alle bedienbaren Mitarbeiter aus `ControlCenterHead.aspx` | AJAX, PouchDB | experimentell | **weg** |
| D14 | Checkbox „nur Permanenzen“ | Auskommentiert, `isPermanenz` wird nie gesetzt | – | TOT | **weg** |
| D15 | `readValuefromStorage`/`saveValueToStorage` | Nie aufgerufen, Rückgabe kaputt | – | TOT | **weg** |

### 2.3 Dienststatistik – EmployeeDutyStatistic.js (236 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| S1 | Spalte „Dauer“ je Dienst | Stunden aus Von/Bis | DOM | OK | **weg** (Alt-Statistik; nur behalten, wenn jemand die historischen Dienste noch ansieht) |
| S2 | Tortendiagramm „Dienst auf:“ | Verteilung nach Dienststelle | DOM, Chartist | OK | **weg** |
| S3 | Tortendiagramm „Dienst als:“ | SEF/SAN1/SAN2 über feste Spaltenindizes (geplant 4/5/6, fixiert 5/6/7) | DOM, Chartist | FRAGIL | **weg** |
| S4 | Tabelle „Übersicht“ | Anzahl, Gesamtdauer, Durchschnitt | DOM | OK | **weg** |
| S5 | Tabelle „Top KollegInnen“ | Top 5 Namen aus den Funktionsspalten | DOM | FRAGIL (Kollegen ohne Link fallen raus) | **weg** |
| S6 | `filterTable()` | Kopie aus AmbulancesOpenPositions, nie aufgerufen | – | TOT | **weg** |
| S7 | Wochentag-Diagramm | Auskommentiert | – | TOT | **weg** |

### 2.4 LV-Statistik – LVStatistic.js (125 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| L1 | Zusatztabelle „Gruppiert nach Funktion und Dienstart“ | Summen je Gruppe (Support, KTW, RTW, Leitstelle, KHD, BT-SAN, Ausbildung, Ambulanzen, Sonstiges, Bezirksstelle) und Funktion, mit Gesamtzeile; Spalte „Gruppiert zu“ in der Originaltabelle | DOM | OK, bereits an neue Dienstart-Namen angepasst, durch Test abgedeckt | **behalten** (wird aktiv genutzt, Test vorhanden) |

### 2.5 Kurssuche – SearchCourse.js (424 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| K1 | „Kursauswahl“ und „Kurssuche“ ausblenden | Standard: beide ausgeblendet, Zustand gespeichert | Storage | OK | **behalten** |
| K2 | Autosuche | Beim Aufruf sofort alle Kurse heute bis +12 Monate suchen (Optionen Qualifikationen, Stornos, Anrechnung, E-Learning, Warteliste); abschaltbar in den Einstellungen | DOM, Storage | OK | **behalten** |
| K3 | DataTable statt NIU-Tabelle | Volltextsuche, Sortierung inkl. Datum, kein Paging, Link „öffnen“ in neuem Tab | DOM, DataTables | FRAGIL: bricht hart ab, wenn NIU die Spaltenzahl ändert | **behalten** |
| K4 | Vorfilter-Leiste | Nur freie Plätze, §50, §50 Reanimation, §51 Rezertifizierung, nur/keine Anrechnungskurse, SAN-Basiskurse, keine SAN-Kurse, FSD, KHD, FKR, Pflichtfortbildungen (RD-Fortbildung) | DataTables | FRAGIL (Kursnamen hart kodiert) | **behalten** |
| K5 | Link „anmelden“/„abmelden“ | mailto an Ausbildungs-Postfach je Dienstnummernbereich (west/vs/bvs/ddl/nord/LRK) mit vorausgefülltem Betreff und Text; bei Storno sofort ein `alert` beim Laden | AJAX `Header.aspx` (eigene DNr), PouchDB | FRAGIL (Mailadressen hart kodiert) | **weg** (Kursan-/abmeldung machen die Leute jetzt selbst) |
| K6 | Kalenderansicht | Nur Kommentar „NOCH VIEL ARBEIT“ | – | TOT | **weg** (tot) |

### 2.6 Kursdetails – CourseDetail.js (188 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| C1 | Letzte Kostenstelle merken | Select wird auf zuletzt gewählte Kostenstelle gesetzt | Storage `letzte_kostenstelle` | OK | **weg** (gehört zum Anmeldeformular) |
| C2 | Kürzel automatisch in „Bemerkung“ | Aus Einstellung „Kürzel“ | Storage | OK | **weg** (gehört zum Anmeldeformular) |
| C3 | Mitarbeiter-Autocomplete | Ersetzt das Mitarbeiter-Select durch ein Suchfeld (Name oder Dienstnummer) | DOM, jQuery UI | FRAGIL (Auswahl über Teilstring) | **weg** (gehört zum Anmeldeformular) |
| C4 | Kalender-Export | Unter der Überschrift (bei einem Termin) und je Termin in der Termintabelle | DOM, ouical | OK | **behalten** |
### 2.7 Offene Ambulanz-Positionen – AmbulancesOpenPositions.js (292 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| A1 | Checkboxen je gesuchter Position | Nur Ambulanzen zeigen, die eine der gewählten Positionen suchen | DOM | OK | **weg** (Ambulanzen in anderem System) |
| A2 | Wochentags-Checkboxen | Wochentag wird berechnet und vor die Zeit geschrieben | DOM | OK | **weg** |
| A3 | Zeitraumfilter Einsatzbeginn | Alle oder zwischen zwei Daten, Standard heute bis +1 Monat | DOM | OK | **weg** |
| A4 | Layout | Untertabellen 100 %, Links in neuem Tab | – | OK | **weg** |

### 2.8 Ambulanz Detail/Bearbeiten – AmbulancesEdit.js (323 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| E1 | Kalender-Export der Ambulanz | ouical unter der Überschrift | DOM | OK | **weg** (Ambulanzen in anderem System) |
| E2 | „Email an Alle“ | Lädt je eingeteiltem Mitarbeiter `shortemployee.aspx`, sammelt alle Mailadressen, öffnet mailto mit BCC | AJAX ×N | OK, ohne Fehlerbehandlung (Spinner bleibt bei Fehler stehen) | **weg** |
| E3 | Mail-Icon je Mitarbeiter | mailto mit „Hallo Vorname,“ | AJAX | OK | **weg** |
| E4 | WhatsApp-Icon je Mitarbeiter | Öffnet `api.whatsapp.com/send?phone=` mit Standard-Handynummer | AJAX | OK | **weg** |
| E5 | Excel-Export | Modal mit Auswahl (Einsatzverwendung, SAN, SanG, Fahrer RD, Handy, Email), lädt je Mitarbeiter Berechtigungen und Kontakte, erzeugt XLSX | AJAX ×N, SheetJS | FRAGIL: Datumsformat nur richtig, wenn alle Häkchen gesetzt; keine Häkchen = nichts passiert | **weg** |

### 2.9 Mitarbeiterseiten kurz/Zusammenfassung – shortemployee.js, summaryemployee.js

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| V1 | VCF-Download (shortemployee) | vCard mit Foto, Kontakten, Berechtigungen | DOM + Foto per XHR | OK | **behalten** |
| V2 | VCF-Download (summaryemployee) | Zusätzlich Dienstnummern, Organigramm, Titel | DOM + Foto per XHR | OK | **behalten** |
| V3 | Foto-Download | Foto ist als Download-Link umhüllt | DOM | OK | **behalten** |

### 2.10 Mitarbeiter Detail – detailEmployee.js (180 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| M1 | Hinweis „Dekrete noch nicht ausgefolgt“ | PNotify-Popup beim Laden, abschaltbar in den Einstellungen | DOM | FRAGIL (DOM-Pfad `parent()` ×4) | **behalten** |
| M2 | Adress-Kopierbox | Textarea mit Name/Titel/Anschrift plus Kopierbutton | DOM, ClipboardJS | OK | **behalten** |
| M3 | Brief aus Word-Vorlage | Nutzer wählt lokale .docx-Vorlage, Platzhalter ({anrede}, {name}, {anschrift}, {konto_iban}, {admin_kuerzel} …, siehe template_help.html) werden aus der Seite gefüllt, Download `JJJJMMTT_DNR_Nachname_Vorname_Vorlage.docx` | DOM, Storage (Kürzel), AJAX `Header.aspx`, docxtemplater | OK, alte docxtemplater-API; Bearbeiterdaten werden asynchron geladen | **weg** (Brief von Hand ist kaum Arbeit) |
### 2.11 Mitarbeiter Liste/Ausdruck – EmployeeDump.js (803 Zeilen, größtes Modul)

Grundfunktion: NIU-Tabelle wird durch eine DataTable ersetzt (Sortierung, Filterfeld je Spalte, Durchschnitt in der Fußzeile, Zeilen per Klick auswählbar). Jeder Menüpunkt hängt eine Spalte an und fragt **je Zeile** NIU ab (alle parallel, bei 100 Mitarbeitern 200 bis 400 Requests). Ergebnisse 24 h im PouchDB-Cache.

Buttons neben der Überschrift:

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| P1 | Alle Zeilen selektieren / Selektion löschen | Zeilenauswahl | DOM | OK | **behalten** |
| P2 | Mailto an alle sichtbaren / an alle selektierten | mailto mit BCC (Empfänger `test@example.com`, TODO im Code) | DOM, Spalte 5 fest | FRAGIL | **behalten** (Platzhalter-Adresse ersetzen) |
| P3 | Memo für alle selektierten | Dialog (Verfasser, Text, Datum, Erinnerung), schreibt je Person ein Memo | POST `df/memo/memo_Neu.asp` | OK, einzige **schreibende** Funktion des ganzen Tools | **behalten** |

Menü „Funktionen“ → Statistik:

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| P4 | Dienststatistik der letzten 6 Monate (16 Untereinträge: AMB_ALL, NFR1, SAN1, SUM_RD, SUM_SAN …) | Je 2 Spalten Stunden und Dienste | `ControlCenterHead` + `EmployeeDutyStatistic` Postback | FRAGIL: Parser kennt nur alte Dienstarten `KTW `, RKS, RKL, RKP; neue Namen wie „RD RTW Mittel ND“ werden vermutlich nicht gezählt | **weg** (Dienstdaten nicht mehr in NIU, Parser kennt nur alte Dienstarten) |
| P5 | RD Dienste der letzten 6 Monate | Spalte plus Mail-Icon „Mitarbeiterdurchsicht“ (Text: Mindestdienstleistung ca. 24 Dienste/Jahr) und Memo-Link | wie P4 | FRAGIL wie P4 | **weg** |
| P6 | Dienststunden SAN der letzten 6 Monate | Zeigt tatsächlich SUM_RD, nicht SUM_SAN | wie P4 | KAPUTT (falscher Schlüssel) | **weg** |
| P7 | Datum letzte Dienstleistung | Letzter Dienst in 12 Monaten, Mail-Icon, Memo-Link | `EmployeeDutyStatistic` Postback | OK | **weg** |

Menü → Ausbildungen:

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| P8 | Grundkurse prüfen | Das RK, KHD-SD-Praxis, SAN1-Seminar, Ambulanzseminar: besucht ja/nein | `SearchCourse.aspx?EmployeeId` Postback | FRAGIL (Kursnamen hart kodiert, Cache-Version `grk4` manuell) | **behalten** |
| P9 | Pflichtfortbildungen prüfen | KÜ (A03241), First Car, TAG-Modul (A04194/A04200/A04477), Hygiene mit Teilnahmestatus | wie P8 | FRAGIL (Kurs-IDs hart kodiert, Cache `pfb7`) | **weg** |
| P10 | SAN-Ampeln prüfen | Ampel-Icons aus detailEmployee | `detailEmployee.aspx` | OK (Stylesheet wird je Zeile neu eingefügt) | **behalten** |
| P11 | No-Shows auswerten | Kurse mit Status „Nicht erschienen“ seit 1900 | wie P8 | KAPUTT (Text wird URL-kodiert angezeigt) | **weg** (kaputt; bei Bedarf neu bauen) |
| P12 | Berechtigungen auswerten: Alle / SAN / FSD / Fahrer | Nicht widerrufene Berechtigungen je Typ; „FSD“ filtert im Code auf „GSD“ | `detailEmployee.aspx` | OK / FSD prüfen | **behalten** (To-do: Fahrer-Berechtigung ist auf drei Berechtigungen aufgeteilt, Filter anpassen) |
Menü → Verwaltung / EDV:

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| P13 | Dienstgrade auswerten | Spalte Dienstgrad | `detailEmployee.aspx` | OK | **behalten** |
| P14 | Gaststatus auswerten | ja/nein | `detailEmployee.aspx` | OK | **behalten** |
| P15 | Fehlende MA-Fotos auswerten | Foto-URL enthält „unknown“ | `detailEmployee.aspx` | OK | **behalten** |
| P16 | Kommando einblenden | 11 Deep-Links je Person (Details, Urlaub, Fahrscheingeld, Uniform, Schlüssel, Memo, Ausbildung, LV-Statistik, Statistik, Dokumente) | `ControlCenterHead` (nur IDs) | OK, Linkliste dreifach dupliziert (auch memo_last, memo_erinnerung) | **behalten** |
| P17 | Ausgegebene/Eingezogene Schlüssel | Tabelle aus `IssuedKeys.aspx`, Klassifizierung per Textheuristik (BegehCard, WEZ, CHS, Transponder, Spind) | `IssuedKeys.aspx` | FRAGIL (feste Substring-Offsets) | **weg** (entfernt in 0.59.0.4) |
| P18 | AD Benutzer auswerten | Zelle mit „Wrk.at“ | `detailEmployee.aspx` | OK | **behalten** |
| P19 | „Die nächste freie Dienstnummer lautet …“ | Läuft automatisch, liest Zeichen 15–18 des Suchparameter-Texts, nur richtig wenn nach DNr sortiert | DOM | FRAGIL, redundant zu N1 | **weg** (fragil, N1 macht dasselbe) |

### 2.12 Mitarbeiter Neu – newEmployee.js (42 Zeilen)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| N1 | Alle freien DNr anzeigen | Tabelle freier Nummern im Tausenderbereich um den Durchschnitt aller Nummern im Dropdown | `ControlCenterHead.aspx` | FRAGIL (lexikografische Sortierung, nur ein Nummernbereich) | **weg** |
| N2 | Zufällige freie DNr zuordnen | Trägt eine freie Nummer ins Feld ein | wie N1 | FRAGIL wie N1 | **weg** |
### 2.13 Memos – memo_last.js (79), memo_erinnerung.js (50)

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| ML1 | Autor-Filter (nur memo_last) | Dropdown, blendet Memo-Tabellen anderer Autoren aus | DOM | FRAGIL (Textsuche über ganze Tabelle) | **behalten** |
| ML2 | Mail-Icon je Memo/Erinnerung | DNr aus Überschrift → Mailadresse → mailto | `ControlCenterHead` + `detailEmployee` | OK | **behalten** |
| ML3 | Zahnrad je Memo/Erinnerung | Gleiche 11 Kommando-Links wie P16 | `ControlCenterHead` | OK | **behalten** |

### 2.14 Spezialdienste

| # | Funktion | Was es tut | Datenquelle | Zustand | Entscheidung |
|---|---|---|---|---|---|
| SP1 | Spezialdienst-Eingabe vorbefüllen | Datum heute, Endzeit jetzt, Kennziffer „Admin_BS_Funkt“, Listeneingabe angehakt | DOM | OK, Kennziffer hart kodiert | **behalten** (Spezialdienste werden weiter in NIU erfasst) |
| SP2 | Unterschreiben: Button „OK“ im Tabellenkopf | Hakt alle OK-Checkboxen an | DOM | OK; `spezialdienstUnterschreiben.html` (Menü „alle genehmigen/ablehnen“) wird nie geladen | **behalten** (wie SP1) |
### 2.15 Kopfzeile, Einstellungen, Dropdown

| # | Funktion | Was es tut | Zustand | Entscheidung |
|---|---|---|---|---|
| H1 | Hinweis „NIU's little helper ist derzeit aktiv“ mit Link zum Readme | Header.js | OK | **behalten** (Text auf „NIU-Addon“ ändern) |
| H2 | Link „⚙ Einstellungen“ (Userscript) | header-extras.js | OK | **behalten** |
| H3 | Einstellungsseite unter `Header.aspx#niu-helper-settings` (Userscript) | Kürzel, Autosuche, Cache, Autocomplete, Dekret-Hinweis | OK | **behalten** |
| H4 | Häkchen „nur 8xxx“ am Mitarbeiter-Dropdown (Userscript) | Filtert Dropdown auf Dienstnummern 8000–8999, Zustand in localStorage, überlebt Postbacks | OK, Test vorhanden | **behalten** |
| H5 | ControlCenter.js | Leer, Autocomplete-Aufruf auskommentiert | TOT | **weg** (leer) |
| H6 | background.js (nur Extension) | Willkommensseite bei Install/Update, Dev-Reload | entfällt im Userscript | **weg** (nur Extension) |

### 2.16 Intranet (Confluence)

| # | Funktion | Was es tut | Zustand | Entscheidung |
|---|---|---|---|---|
| I1 | Bescheiderstellung: Word-Vorlage füllen | Liest Feldnamen aus `#i_fieldnames`, `#i_filename`, `#i_dropdowns` der Confluence-Seite, füllt hochgeladene .docx, Download | OK, nur wenn die Confluence-Seite diese Felder noch hat | **weg** (Confluence, nicht mehr gebraucht) |
| I2 | Fahrzeugtagebuch: Status-Filter und Farbcodierung | Checkboxen je Status im Tabellenkopf, Priorität farbig, nicht gewählte Listeneinträge ausgeblendet; Kategorie-/Prioritätsfilter auskommentiert | OK / teilweise TOT | **weg** (Confluence, nicht mehr gebraucht) |
---

## 3. Gemeinsame Bibliotheken (eigener Code)

### staff-lib.js (1195 Zeilen) – wer braucht was

| Funktion | Zweck | NIU-Endpunkt | Genutzt von |
|---|---|---|---|
| getKuerzel | Kürzel aus Einstellungen | – | CourseDetail, detailEmployee |
| expDFActive, getOperableDNRs, convertDFField | Autocomplete Dienstplan (experimentell) | ControlCenterHead | nur DutyRoster D13 |
| makeEmployeeSearchField(+Overlay) | Select → Autocomplete | – | nur CourseDetail C3 |
| getDB, saveToCache, getFromCache, isCacheActive | PouchDB-Cache, 24 h | – | intern |
| getOwnDNRs, getOwnName | Eigene Dienstnummer(n)/Name | Header.aspx | SearchCourse K5, detailEmployee M3, EmployeeDump P3 |
| dnrToIdentifier | Dienstnummer → NIU-IDs (ENID, EID) | ControlCenterHead GET+POST | EmployeeDump, memo_last, memo_erinnerung |
| getEmployeeDataSheet | Stammdaten, Berechtigungen, Ampel, AD-User, Mail | detailEmployee.aspx | EmployeeDump, memo_* |
| calculateDutyStatistic, DutyCount, DUTY_TYPES | 6-Monats-Dienststatistik | EmployeeDutyStatistic Postback | nur EmployeeDump P4–P6 |
| getLastDuty | Letzter Dienst | EmployeeDutyStatistic Postback | nur EmployeeDump P7 |
| getEmployeeCourses, checkCourseAttendance | Kursliste / Kurs besucht? | SearchCourse Postback | nur EmployeeDump P8, P9, P11 |
| getKeyInfo | Schlüsseltabelle | IssuedKeys.aspx | nur EmployeeDump P17 |
| getFreeEmployeeDNRs | Freie Dienstnummern | ControlCenterHead | nur newEmployee |
| writeMemo | Memo anlegen | POST df/memo/memo_Neu.asp | nur EmployeeDump P3 |
| getNiuDateString | Datum → d.M.yyyy | – | SearchCourse, EmployeeDump, intern |

Fällt EmployeeDump weg, bleiben von staff-lib nur getKuerzel, getOwnDNRs, dnrToIdentifier, getEmployeeDataSheet, getFreeEmployeeDNRs, makeEmployeeSearchField und der Cache übrig.

**Achtung beim Kürzen:** build.py bricht ab, wenn in staff-lib.js nicht genau 17 Vorkommen von `"https://niu.wrk.at/` stehen (Zähler in `patch_source` anpassen).

### lib.js (296 Zeilen)

Alles genutzt: Kalender-Element, Dauer aus Zeitstring, Dienstplan-Header lesen, vCard erzeugen, Mitarbeiter/Kontakte von `shortemployee.aspx` scrapen, VCF-Link. Hinweis: `https://niu.wrk.at/Kripo/Employee/shortemployee.aspx` steht dort fest und wird von build.py **nicht** auf den aktuellen Host umgeschrieben (betrifft AmbulancesEdit und today auf `http://niu`).

### var.js (62 Zeilen)

| Konstante | Genutzt von | Zustand |
|---|---|---|
| department (Adressen LV, DDL, West, Nord, KSS, VS, BVS, RD) | DutyRoster, today | OK, KSS = Nord, RD = LV doppelt |
| dienstTypen (RKS Arsenal, RKP Penzing, BT-SAN) | DutyRoster, today | FRAGIL, alte Namen |
| dienstgrade (RKJ1 … PRÄS) | detailEmployee, EmployeeDump | OK |
| mailImage, whatsappImage, xlsxImage, copyImage, helpImage | AmbulancesEdit, today, detailEmployee | OK |
| dienststellenKuerzel, docImage | – | TOT |

---

## 4. Eingebettete Fremdbibliotheken – was mit welchem Feature entfällt

Das Userscript ist 3 MB groß, davon ist fast alles Bibliothekscode. Nur wenn **alle** Nutzer einer Bibliothek wegfallen, kann sie raus.

| Bibliothek | Gebraucht von | Entfällt wenn |
|---|---|---|
| jQuery | alle | nie |
| jQuery UI | DutyRoster D13 (nur experimentell), CourseDetail C3, EmployeeDump/newEmployee (Menü) | D13, C3, EmployeeDump, newEmployee weg |
| PouchDB (Cache) | staff-lib-Funktionen mit Cache | EmployeeDump, memo_*, K5, D13 weg |
| DataTables (+ datetime-moment) | SearchCourse K3, EmployeeDump | beide weg |
| moment (+ de) | DutyRoster D12, AmbulancesEdit, SearchCourse | alle drei weg |
| ouical (Kalender-Buttons) | today, DutyRoster, AmbulancesEdit, CourseDetail | alle Kalender-Exporte weg |
| ics.js (+ deps) | nur today T1 | T1 weg |
| SheetJS (xlsx, ca. 1 MB) | nur AmbulancesEdit E5 | E5 weg |
| jquery-modal | AmbulancesEdit E5, detailEmployee M3, vfm-bescheiderstellung | alle drei weg |
| spin.js | nur AmbulancesEdit | AmbulancesEdit weg |
| Chartist | nur EmployeeDutyStatistic S2/S3 | S2, S3 weg |
| vex | nur EmployeeDump | EmployeeDump weg |
| PNotify | nur detailEmployee M1 | M1 weg |
| ClipboardJS | nur detailEmployee M2 | M2 weg |
| docxtemplater, JSZip, JSZip-Utils, FileSaver | detailEmployee M3, vfm-bescheiderstellung I1 | beide weg |

Unnötig geladen (kein Aufruf): staff-lib bei today, ControlCenter, spezialdienstUnterschreiben; lib.js bei newEmployee, spezialdienstUnterschreiben; var.js bei vfm-bescheiderstellung; jQuery UI bei today; DataTables bei newEmployee.

---

## 5. NIU-Endpunkte, die das Tool im Hintergrund aufruft

Lesend (GET bzw. ASP.NET-Postback mit gescrapten Tokens):

| Endpunkt | Wofür | Genutzt von |
|---|---|---|
| `Kripo/Header.aspx` | eigene Dienstnummer/Name | K5, M3, P3 |
| `Kripo/external/ControlCenterHead.aspx` | Dienstnummer → IDs, Mitarbeiterliste, freie Nummern | EmployeeDump, memo_*, newEmployee, D13 |
| `Kripo/Employee/detailEmployee.aspx` | Stammdatenblatt | EmployeeDump, memo_* |
| `Kripo/Employee/shortemployee.aspx` | Kontakte, Berechtigungen | AmbulancesEdit, today (ins Leere) |
| `Kripo/DutyRoster/EmployeeDutyStatistic.aspx` | Dienststatistik | P4–P7 |
| `Kripo/Kufer/SearchCourse.aspx` | Kursbesuch | P8, P9, P11 |
| `Kripo/Employee/IssuedKeys.aspx` | Schlüssel | P17 |
| `Kripo/Ambulances/AmbulancesDetail.aspx` | Webinfo/Ort | today T3 |

Schreibend: nur `df/memo/memo_Neu.asp` (P3, Sammel-Memo).

Alle Postback-Parser hängen an WebForms-Feldnamen (`ctl00$main$…`, Options-Indizes `$0…$8`). Jede Layoutänderung in NIU bricht sie. Bekannter Fehler: der Parameter „Dienste zusammenfassen“ wird mit führendem `&` im Schlüssel gesendet und kommt vermutlich nie an.

---

## 6. Einstellungen

| Einstellung | Wirkt auf |
|---|---|
| Kürzel | C2, M3 |
| Kurssuche automatisch 12 Monate | K2 |
| Cache (24 h, PouchDB `niuhelperdb1`) | alle staff-lib-Abfragen |
| Autocomplete-Felder im Dienstplan (Standard aus) | D13 |
| Hinweis nicht ausgefolgte Dekrete | M1 |
| intern: Kursauswahl/Kurssuche ausgeblendet, letzte Kostenstelle, „nur 8xxx“ | K1, C1, H4 |

`STORAGE_KEY_MAX_CACHE_TIME` / `DEFAULT_MAX_CACHE_TIME` in definitions.js sind ungenutzt (und rechnerisch falsch, 2,4 h statt 24 h); wirksam ist die feste Konstante in staff-lib.

---

## 7. Toter Code, Duplikate, technische Schulden (Kurzliste)

- Tot: D14, D15, S6, S7, K6, T7 (mit nutzlosen AJAX-Aufrufen), H5, `dienststellenKuerzel`, `docImage`, `spezialdienstUnterschreiben.html`, `_queryEmployee` in today, `_getEmailsfromEmployeeData` in AmbulancesEdit (Duplikat von `getAllEmails`).
- Duplikate: `createCalElement` (lib.js und CourseDetail), Kommando-Linkliste (EmployeeDump, memo_last, memo_erinnerung), Wochentagsfilter (DutyRoster, AmbulancesOpenPositions).
- Alte Dienstart-Namen (RKL/RKS/RKP, `KTW `) in staff-lib `calculateDutyStatistic`, DutyRoster D2/D7, var.js `dienstTypen`. LVStatistic.js ist bereits angepasst.
- Hart kodierte Fachdaten: Kurs-IDs und -namen (P8, P9, K4), Ausbildungs-Mailadressen je Dienstnummernbereich (K5), Mindestdienstzahl 24 (P5), Kennziffer Admin_BS_Funkt (SP1), Berechtigungstypen (E5), Ampel-CSS `/Kripo/Shares/tooltip.css`, Platzhalter `test@example.com` (P2).
- Manifest V2 mit `chrome.extension.getURL`, `webRequestBlocking`; in Chrome nicht mehr installierbar, im Userscript durch den Shim abgefangen.
- Durchgehend implizite globale Variablen, fehlende Fehlerbehandlung bei AJAX, viele `console.log`.
- Sensibel: M3 übernimmt IBAN/BIC in die Word-Vorlage; P3 schreibt Memos für viele Personen auf einmal.

---

## 8. Vorsortierung (Stand 2026-09-21, umgesetzt in 0.59.0.1)

Ausgangslage laut Besitzer: Dienstplanung (Dienstplan **und** Ambulanzen) läuft
in einem anderen System. Kurse und Kurssuche bleiben in NIU, die Startseite zeigt
die Kurstabelle weiterhin. Kursan- und -abmeldung erledigen die Leute inzwischen
selbst, alles dazu kann weg. Die Mitarbeiter-Erfassung und die
Spezialdiensterfassung bleiben in NIU. Die Confluence-Erweiterungen werden nicht
mehr gebraucht.

### Weg

| Modul / IDs | Begründung |
|---|---|
| DutyRoster.js (D1–D15) komplett | Dienstplan ist nicht mehr in NIU |
| AmbulancesOpenPositions.js (A1–A4), AmbulancesEdit.js (E1–E5) komplett | Ambulanzen sind nicht mehr in NIU |
| today.js: T1, T2, T3, T6, T7 | ICS-Download und Kalender-Export betreffen Dienste und Ambulanzen; T4/T5 bleiben |
| EmployeeDutyStatistic.js (S1–S7) komplett | Statistik der alten Dienstplandaten |
| SearchCourse.js: K5, K6 | Anmelde-/Abmelde-Mail nicht mehr nötig (Self-Service); K6 tot |
| CourseDetail.js: C1, C2, C3 | Kostenstelle, Kürzel und Mitarbeiter-Autocomplete gehören zum Anmeldeformular |
| EmployeeDump.js: P4–P7, P9, P11, P19 | Dienststatistik-Spalten (Dienstdaten nicht mehr in NIU), Pflichtfortbildungen, No-Shows kaputt, freie DNr |
| detailEmployee.js: M3 | Brief aus Word-Vorlage; von Hand kaum Arbeit |
| newEmployee.js (N1, N2) komplett | freie Dienstnummern nicht mehr nötig |
| vfm-bescheiderstellung.js (I1), viewpage.action.js (I2) komplett | Confluence-Erweiterungen nicht mehr gebraucht |
| ControlCenter.js (H5), background.js (H6) | leer bzw. nur Extension |
| Einstellung „Autocomplete-Felder im Dienstplan“ | hängt nur an D13 |
| Toter Code | `dienststellenKuerzel`, `docImage`, `spezialdienstUnterschreiben.html`, `_queryEmployee`, `_getEmailsfromEmployeeData`, Duplikate aus Abschnitt 7 |

### Behalten

| Modul / IDs | Begründung |
|---|---|
| today.js: T4, T5 | Kalender-Export je Kurs und Kurslinks in eigenem Fenster |
| SearchCourse.js: K1–K4 | Kurssuche mit Autosuche, Tabelle und Vorfiltern |
| CourseDetail.js: C4 | Kalender-Export je Kurstermin |
| LVStatistic.js (L1) | wird aktiv genutzt, im September 2026 angepasst, Test vorhanden |
| EmployeeDump.js: P1–P3, P8, P10, P12–P16, P18 | Mitarbeiter-Verwaltung: Grundkurse, Ampel, Berechtigungen, Stammdaten, Sammel-Mail/-Memo (P17 Schlüssel seit 0.59.0.4 weg) |
| detailEmployee.js: M1, M2 | Dekret-Hinweis und Adress-Kopierbox |
| shortemployee.js, summaryemployee.js (V1–V3) | VCF-Download der Mitarbeiterseiten |
| memo_last.js, memo_erinnerung.js (ML1–ML3) | Memos gehören zur Mitarbeiter-Verwaltung |
| Spezialdiensteingabe.js (SP1), spezialdienstUnterschreiben.js (SP2) | Spezialdienste werden weiter in NIU erfasst |
| Header.js, header-extras.js, settings.js, nur8xxx.js (H1–H4) | Grundgerüst des Userscripts; H1-Text wird „NIU-Addon“ |

### Folgen für Bibliotheken und gemeinsamen Code

Entfallen komplett: **ics.js**, **SheetJS** (ca. 1 MB), **spin.js**, **Chartist**, **docxtemplater**, **JSZip**,
**JSZip-Utils**, **FileSaver**, **jquery-modal** (letzte Nutzer M3 und I1), **jQuery UI** (letzte echte Nutzer C3 und
newEmployee; das jQuery-UI-Menü in EmployeeDump muss dann durch ein einfaches Menü ersetzt werden, sonst bleibt jQuery UI).
Bleiben: jQuery, PouchDB, DataTables + datetime-moment, moment (SearchCourse), ouical (T4, C4), vex (EmployeeDump),
PNotify (M1), ClipboardJS (M2).

staff-lib.js: `calculateDutyStatistic`, `DutyCount`, `DUTY_TYPES`, `getLastDuty`, `expDFActive`, `getOperableDNRs`,
`convertDFField`, `makeEmployeeSearchField(+Overlay)`, `getEmployeeCourses` (nur P11), `getFreeEmployeeDNRs`,
`getKuerzel`, `getOwnName` entfallen; `getOwnDNRs` nur noch für P3; `checkCourseAttendance` nur noch für P8.
Die Zahl der `niu.wrk.at`-URLs sinkt, Zähler in `build.py` anpassen.
lib.js: `getDuties`, `getHeaderNumber`, `getEmployeeDataFromLink`, `getDurationFromTimeString`, `getDefaultPhone`,
`getDefaultEmail`, `getAllEmails`, `parseHTMLOnly`, `createCalElement` entfallen (T4 hat eine eigene Variante,
CourseDetail ebenfalls; eine davon nach lib.js ziehen).
var.js: `dienstTypen`, `mailImage`, `whatsappImage`, `xlsxImage`, `helpImage`, `dienstgrade` (nur M3 und P13; P13
liest den Dienstgrad direkt) prüfen; `department` bleibt für T4, `copyImage` für M2.
definitions.js/settings.js: Optionen „Kürzel“ und „Autocomplete-Felder im Dienstplan“ sowie die ungenutzten
Cache-Zeit-Konstanten entfernen. Es bleiben: Autosuche Kurssuche, Cache, Dekret-Hinweis.
webcontent: `template_help.html`, `newemployee_menu.html`, `spezialdienstUnterschreiben.html`, Welcome-Seiten entfallen.
manifest.json: Einträge DutyRoster, Ambulances*, EmployeeDutyStatistic, newEmployee, ControlCenterHead und beide
Intranet-Einträge streichen; `@match`-Zeilen für intranet.wrk.at in build.py entfernen; überflüssige Lib-Ladungen
aus Abschnitt 4 bereinigen.
Tests: smoke.js-Fälle für AmbulancesEdit, detailEmployee (Vorlagen-Box), EmployeeDutyStatistic, newEmployee und
Confluence anpassen bzw. auf „kein Modul startet“ umstellen.

---

## 9. Offene To-dos (unabhängig vom Rückbau)

- ~~„nur 8xxx“ für andere Nummernkreise~~ erledigt in 0.59.0.2: Tausenderziffer in den Einstellungen wählbar (1 bis 9), weiterhin nur vierstellige Nummern.
- ~~P12 Fahrer-Berechtigung~~ geprüft 2026-09-21: Filter findet die drei neuen Berechtigungen, weil er auf „Fahrer“ im Typ matcht. Keine Änderung nötig.
- ~~Menü in Liste/Ausdruck~~ auf NIU geprüft 2026-09-21, funktioniert.
- ~~P2 Platzhalter-Empfänger~~ erledigt in 0.59.0.3: An-Feld bleibt leer, Adressen nur im BCC.
- P8: Kursnamen der Grundkurse und die Cache-Version `grk4` beim Ändern hochzählen.
- Erledigt in 0.59.0.4: Kommando-Links auf den Memo-Seiten nutzen den aktuellen Host und teilen sich den Code mit
  Liste/Ausdruck; Auswertungsspalten in Liste/Ausdruck fragen NIU mit höchstens 4 gleichzeitigen Requests ab;
  Dekret-Hinweis hat einen Fallback für geänderte Verschachtelung; Kurssuche bricht bei unerwarteter Spaltenzahl nicht
  mehr ab; GitHub-Workflow baut und testet bei jedem Push.
- Neu in 0.59.0.5: Sidebar-Eintrag „Kurssuche (NIU)“ unter „Ausbildung“ (`menu.js`, über die Dynatree-API der Seite,
  Fallback DOM-Eintrag mit `target="main"`); Kurssuche wählt „Nur abgeschlossene Kurse“ beim ersten Aufruf ab.
- 0.59.0.6: Datenblatt-Abfrage wirft bei Mitarbeitern ohne E-Mail/Foto keinen Fehler mehr (ML2, P10, P12–P15, P18);
  Autor-Filter in Memo LAST (ML1) vergleicht nur die Autor-Zelle; `extension/` auf den Build-Bedarf reduziert.
