// Echte Tabelle "Dienste nach Dienstart und Funktion" (LVStatistic.aspx, Sept 2026)
// Spalten: Dienstart | Funktion | Anz.Dienst | Dauer | Ausfahrten | Nachtausfahrt | Blaulicht
module.exports.rows = [
  ['Ausbildung Teilnehmer ABZ/ÖRK', '', 14, '62 h  30 Min', 0, 0, 0],
  ['Bez. Funktionär', '', 8, '22 h  30 Min', 0, 0, 0],
  ['Bez. Funktionär', 'BS-Referat MA', 20, '60 h  45 Min', 0, 0, 0],
  ['KHD Ambulanz Kurz', 'AMB KuBe', 1, '1 h  45 Min', 0, 0, 0],
  ['KHD Ambulanz Kurz', 'GrpKdt', 1, '4 h  0 Min', 0, 0, 0],
  ['KHD Ambulanz Kurz', 'SAN 1', 1, '5 h  30 Min', 0, 0, 0],
  ['KHD Ambulanz Lang', 'GrpKdt', 1, '13 h  0 Min', 0, 0, 0],
  ['KHD Ambulanz Lang', 'MLS F', 1, '12 h  30 Min', 0, 0, 0],
  ['KHD Ambulanz Lang', 'ZgKdt', 2, '20 h  45 Min', 0, 0, 0],
  ['KHD Ambulanz Mittel', 'GrpKdt', 1, '9 h  0 Min', 0, 0, 0],
  ['KHD Ambulanz Mittel', 'SAN 1', 1, '7 h  30 Min', 0, 0, 0],
  ['KHD Ambulanz Mittel', 'ZgKdt', 1, '6 h  30 Min', 0, 0, 0],
  ['KHD Einsatz', 'UAS PiC', 5, '15 h  0 Min', 0, 0, 0],
  ['KHD Einsatz', 'UAS Spotter', 2, '6 h  0 Min', 0, 0, 0],
  ['KHD Mitarbeit Allgemein', '', 11, '18 h  15 Min', 0, 0, 0],
  ['KHD Mitarbeit Allgemein', 'KHD FMD IT MA', 1, '5 h  30 Min', 0, 0, 0],
  ['KHD Mitarbeit Allgemein', 'KHD FMD KW MA', 1, '4 h  0 Min', 0, 0, 0],
  ['KHD Mitarbeit Allgemein', 'KHD FMD MA', 2, '7 h  30 Min', 0, 0, 0],
  ['KHD Mitarbeit Allgemein', 'KHD FMD MA i.A.', 1, '1 h  30 Min', 0, 0, 0],
  ['KHD Mitarbeit Allgemein', 'KHD MA Allg', 1, '5 h  0 Min', 0, 0, 0],
  ['KTW Supportteam', 'KTW DF MA', 8, '1008 h  59 Min', 0, 0, 0],
  ['Mitarbeit LV', '', 26, '18 h  30 Min', 0, 0, 0],
  ['Öffentlichkeitsarbeit LV', 'KOMMA KTW RS', 1, '6 h  0 Min', 0, 0, 0],
  ['RD DF-KTW Kurz ND', 'AMB KTW F', 1, '1 h  30 Min', 0, 0, 0],
  ['RD KTW Kurz ND', 'SAN 1', 2, '10 h  0 Min', 8, 5, 1],
  ['RD KTW Mittel ND', 'SAN 1', 1, '6 h  0 Min', 5, 3, 3],
  ['RD KTW Mittel TD', 'KTW F', 1, '6 h  30 Min', 4, 0, 2],
  ['RD LS Lang TD', 'LS MA70 Haupt-Dispo MA', 1, '12 h  0 Min', 0, 0, 0],
  ['RD NKTW Mittel ND', 'KTW F', 3, '18 h  0 Min', 16, 13, 16],
  ['RD NKTW Mittel TD', 'KTW F', 2, '14 h  30 Min', 8, 0, 8],
  ['RD NKTW Mittel TD', 'SAN 2', 1, '9 h  0 Min', 7, 0, 7],
  ['RD RDDienstfahrtRTW Kurz ND', 'RTW-NAW F', 1, '4 h  30 Min', 0, 0, 0],
  ['RD RDDienstfahrtRTW Kurz TD', 'RTW-NAW F', 1, '4 h  0 Min', 0, 0, 0],
  ['RD RTW Kurz ND', 'NFR 1', 1, '5 h  0 Min', 3, 3, 3],
  ['RD RTW Kurz ND', 'RTW-NAW F', 5, '22 h  0 Min', 19, 17, 19],
  ['RD RTW Kurz ND', 'SAN 1', 1, '5 h  30 Min', 2, 2, 2],
  ['RD RTW Mittel ND', 'RTW-NAW F', 8, '48 h  0 Min', 33, 28, 33],
  ['RD RTW Mittel ND', 'SAN 1', 4, '24 h  0 Min', 17, 16, 17],
  ['RD RTW Mittel ND', 'SAN 2', 1, '6 h  0 Min', 3, 3, 3],
  ['RD RTW Mittel TD', 'NFR 1', 1, '8 h  0 Min', 4, 0, 4],
  ['RD RTW Mittel TD', 'RTW-NAW F', 1, '8 h  0 Min', 2, 1, 2],
];
// Zusammenfassung laut Seite
module.exports.total = { anz: 147, dauer: '1534 h  59 Min', ausfahrten: 131, nacht: 91, blau: 120 };

module.exports.html = function () {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const tr = (r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>';
  return '<h3>Zusammenfassung:</h3><table><tr><th>Anzahl Dienste</th></tr><tr><td>147</td></tr></table>' +
    '<h3>Dienste nach Dienstart und Funktion:</h3><table class="standard">' +
    '<tr><th>Dienstart</th><th>Funktion</th><th>Anz.Dienst</th><th>Dauer</th><th>Ausfahrten</th><th>Nachtausfahrt</th><th>Blaulicht</th></tr>' +
    module.exports.rows.map(tr).join('') + '</table>';
};
