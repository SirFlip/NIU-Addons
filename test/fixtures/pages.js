// Seitenausschnitte für den Smoke-Test, nachgebaut nach dem Markup der echten NIU-Seiten (Stand Sept. 2026).
// Keine echten Personen: Namen und Dienstnummern sind Platzhalter, Kursnummern erfunden.

// Kursdetails (CourseDetail.aspx): erste MessageTable mit Termintabelle (Spalten Tag, Zeit, Ort, Stock, Raum, Bezeichnung)
module.exports.courseDetail = function (termine) {
  var rows = termine.map(function (t) {
    return '<tr><td class="MessageBody">' + t.tag + '</td><td class="MessageBodyLeftBorder">' + t.zeit + '</td>' +
      '<td class="MessageBodyLeftBorderRightAlign">' + t.ort + '</td><td class="MessageBodyLeftBorderRightAlign">' + (t.stock || '') + '</td>' +
      '<td class="MessageBodyLeftBorderRightAlign">' + (t.raum || '') + '</td><td class="MessageBodyLeftBorder">' + (t.bez || '') + '</td></tr>';
  }).join('');
  return '<h1>Kursdetails</h1>' +
    '<table width="890" cellpadding="0" cellspacing="0" class="MessageTable"><tbody>' +
    '<tr><td class="MessageHeader"></td><td class="MessageHeader"><h5>26999001 - SAN - Fortbildung - § 50 - Testkurs</h5></td><td class="MessageHeader" width="30"></td></tr>' +
    '<tr><td class="MessageHeader"></td><td colspan="2" class="MessageBodyLeftBorder"></td></tr>' +
    '<tr><td width="160" class="MessageHeader">Status:</td><td colspan="2" class="MessageBodyLeftBorder">Offen (1/16)</td></tr>' +
    '<tr><td width="160" class="MessageHeader">Kursbeginn:</td><td colspan="2" class="MessageBodyLeftBorder">Di, 22.09.2026 18:00</td></tr>' +
    '<tr><td class="MessageHeader">Kursende:</td><td colspan="2" class="MessageBodyLeftBorder">Di, 22.09.2026 22:00</td></tr>' +
    '<tr><td class="MessageHeader">Anmeldeschluss:</td><td colspan="2" class="MessageBodyLeftBorder">Mo, 21.09.2026 12:00</td></tr>' +
    '<tr><td class="MessageHeader">Kursort:</td><td colspan="2" class="MessageBodyLeftBorder">ABZ</td></tr>' +
    '<tr><td class="MessageHeader">Vortragende:</td><td colspan="2" class="MessageBodyLeftBorder"><a>Name Platzhalter (8123)</a><br></td></tr>' +
    '<tr><td class="MessageHeader">Termine:</td><td colspan="2" class="MessageBodyLeftBorder"><table width="650" class="MessageTable"><tbody>' +
    '<tr><td width="90" class="MessageHeaderCenter">Tag</td><td width="90" class="MessageHeaderCenter">Zeit</td><td width="50" class="MessageHeaderCenter">Ort</td>' +
    '<td width="50" class="MessageHeaderCenter">Stock</td><td width="50" class="MessageHeaderCenter">Raum</td><td class="MessageHeaderCenter">Bezeichnung</td></tr>' +
    rows + '</tbody></table></td></tr>' +
    '<tr><td class="MessageHeader">Kursstunden:</td><td colspan="2" class="MessageBodyLeftBorder">4 Stunde(n)</td></tr>' +
    '<tr><td class="MessageHeader">Sonstiges:</td><td colspan="2" class="MessageBodyLeftBorder"><p>Inhalte des Testkurses</p></td></tr>' +
    '</tbody></table>';
};

// Startseite (Today.aspx): Kurstabelle. Zeile 1 und 2 sind Kopfzeilen, danach je Kurs: Nr, Titel (Link), Von, Bis, Ort
module.exports.todayCourses = function (kurse) {
  var rows = kurse.map(function (k) {
    return '<tr><td class="MessageBody">' + k.nr + '</td><td class="MessageBodyLeftBorder"><a class="CourseTitel" href="/Kripo/Kufer/CourseDetail.aspx?CourseID=' + k.nr + '">' + k.titel + '</a></td>' +
      '<td class="MessageBodyLeftBorder">' + k.von + '</td><td class="MessageBodyLeftBorder">' + k.bis + '</td><td class="MessageBodyLeftBorder">' + k.ort + '</td></tr>';
  }).join('');
  return '<div class="MultiDutyRoster"><table id="ctl00_main_m_CourseList__CourseTable" class="MessageTable">' +
    '<tr><td class="MessageHeader" colspan="5">Meine Kurse</td></tr>' +
    '<tr><td class="MessageHeaderCenter">Nr</td><td class="MessageHeaderCenter">Kurs</td><td class="MessageHeaderCenter">Von</td><td class="MessageHeaderCenter">Bis</td><td class="MessageHeaderCenter">Ort</td></tr>' +
    rows + '</table></div>';
};

// Memo-Erinnerungen (memo_erinnerung.asp): je Erinnerung eine Tabelle, Kopfzeile beginnt mit der Dienstnummer;
// Zeilen mit "erneute" (erneute Erinnerung) bekommen keine Icons
module.exports.memoErinnerung =
  '<table id="e1"><tbody><tr><th>8123 Name Platzhalter - Erinnerung am 21.09.2026</th></tr><tr><td>Bitte Dekret abholen.</td></tr></tbody></table><br>' +
  '<table id="e2"><tbody><tr><th>8124 Name Zwei - erneute Erinnerung am 22.09.2026</th></tr><tr><td>Nochmal.</td></tr></tbody></table><br>';
