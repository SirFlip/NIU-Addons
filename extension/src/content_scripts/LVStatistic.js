$(document).ready(function() {

    console.log('LV Dienststatistik');

    // Reihenfolge = Reihenfolge in der Gruppentabelle. Eine Dienstart kann in
    // mehreren Gruppen landen (Spalte "Gruppiert zu" zeigt alle).
    var dienstAggregate = {};
    dienstAggregate['Support'] = new RegExp('[Ss]upport');
    dienstAggregate['KTW'] = new RegExp('KTW(?! Support)|Tag |Nacht ');
    dienstAggregate['RTW'] = new RegExp('RTW|NAW|RKL|RKS|RKP|RKF|RK3|RKIII');
    dienstAggregate['Leitstelle'] = new RegExp('\\bLS\\b');
    dienstAggregate['KHD'] = new RegExp('KHD Einsatz|KHD Mitarbeit|KAT |KAT-|KHD Übung|Einsatz FlüHi');
    dienstAggregate['BT-SAN'] = new RegExp('KHD Bereitschaft SAN|KHD Rufbereitschaft BT-SAN');
    dienstAggregate['Ausbildung'] = new RegExp('Ausbildung');
    dienstAggregate['Ambulanzen'] = new RegExp('Ambulanz(?!support)');
    dienstAggregate['Sonstiges'] = new RegExp('Mitarbeit LV|Öffentlichkeitsarbeit');
    dienstAggregate['Bezirksstelle'] = new RegExp('Bez\\. ');

    // Gruppe -> Funktion -> { anz, dauer (Minuten), ausfahrten, nacht, blau, row }
    // Die Zeilen werden hier direkt gemerkt statt über IDs gesucht: Funktions-
    // namen wie "KHD FMD MA i.A." oder "SAN 1" sind keine gültigen Selektoren.
    var dienstSum = {};

    function toInt(text) {
        var n = parseInt($.trim(text), 10);
        return isNaN(n) ? 0 : n;
    }

    // "1534 h  59 Min" -> 92099 (Minuten); tolerant gegenüber Leerzeichen
    function parseDauer(text) {
        var m = /(\d+)\s*h(?:\s*(\d+)\s*Min)?/.exec(text || '');
        if (!m) { return 0; }
        return parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0);
    }

    function formatDauer(minuten) {
        return Math.floor(minuten / 60) + " h " + (minuten % 60) + " Min";
    }

    var ztable = $("<table class='standard'><tr><th>Dienstart</th><th>Funktion</th><th>Anz.Dienst</th><th>Dauer</th><th>Ausfahrten</th><th>Nachtausfahrt</th><th>Blaulicht</th></tr></table>");
    var heading = $("h3:contains('Dienste nach Dienstart und Funktion:')");
    heading.before("<h3>Gruppiert nach Funktion und Dienstart:</h3>")
        .before(ztable)
        .before('<br />');

    var table = heading.next("table");

    table.find("tr").first().append("<th>Gruppiert zu</th>");
    table.find("tr").slice(1).append("<td class='gruppiertzu'></td>");

    table.find("tr").slice(1).each(function() {
        var tr = $(this);
        var cells = tr.children("td");
        if (cells.length < 7) { return; }

        var dienstart = $.trim(cells.eq(0).text());
        var funktion = $.trim(cells.eq(1).text().replace(/\u00a0/g, ' '));
        if (funktion == "-") { funktion = ""; }

        var werte = {
            anz: toInt(cells.eq(2).text()),
            dauer: parseDauer(cells.eq(3).text()),
            ausfahrten: toInt(cells.eq(4).text()),
            nacht: toInt(cells.eq(5).text()),
            blau: toInt(cells.eq(6).text())
        };

        var gruppen = [];
        for (var k in dienstAggregate) {
            if (!dienstAggregate[k].test(dienstart)) { continue; }
            gruppen.push(k);

            if (!dienstSum[k]) { dienstSum[k] = {}; }
            var eintrag = dienstSum[k][funktion];
            if (!eintrag) {
                eintrag = { anz: 0, dauer: 0, ausfahrten: 0, nacht: 0, blau: 0 };
                var row = $("<tr></tr>");
                row.append($("<td class='gruppe'></td>").text(k));
                row.append($("<td class='funktion'></td>").text(funktion));
                row.append("<td class='anz'></td><td class='dauer'></td><td class='ausfahrten'></td><td class='nacht'></td><td class='blau'></td>");
                eintrag.row = row;
                ztable.append(row);
                dienstSum[k][funktion] = eintrag;
            }
            eintrag.anz += werte.anz;
            eintrag.dauer += werte.dauer;
            eintrag.ausfahrten += werte.ausfahrten;
            eintrag.nacht += werte.nacht;
            eintrag.blau += werte.blau;

            eintrag.row.find(".anz").text(eintrag.anz);
            eintrag.row.find(".dauer").text(formatDauer(eintrag.dauer));
            eintrag.row.find(".ausfahrten").text(eintrag.ausfahrten);
            eintrag.row.find(".nacht").text(eintrag.nacht);
            eintrag.row.find(".blau").text(eintrag.blau);
        }
        tr.find(".gruppiertzu").text(gruppen.join(", "));
    });

    // Gruppentabelle nach Gruppe sortiert ausgeben (Reihenfolge wie dienstAggregate)
    ztable.find("tr").slice(1).detach();
    for (var g in dienstAggregate) {
        if (!dienstSum[g]) { continue; }
        var funktionen = Object.keys(dienstSum[g]).sort();
        var summe = { anz: 0, dauer: 0, ausfahrten: 0, nacht: 0, blau: 0 };
        for (var i = 0; i < funktionen.length; i++) {
            var e = dienstSum[g][funktionen[i]];
            ztable.append(e.row);
            summe.anz += e.anz; summe.dauer += e.dauer; summe.ausfahrten += e.ausfahrten;
            summe.nacht += e.nacht; summe.blau += e.blau;
        }
        if (funktionen.length > 1) {
            var sumRow = $("<tr class='gruppensumme'></tr>");
            sumRow.append($("<td class='gruppe'></td>").text(g));
            sumRow.append("<td class='funktion'><i>gesamt</i></td>");
            sumRow.append($("<td class='anz'></td>").text(summe.anz));
            sumRow.append($("<td class='dauer'></td>").text(formatDauer(summe.dauer)));
            sumRow.append($("<td class='ausfahrten'></td>").text(summe.ausfahrten));
            sumRow.append($("<td class='nacht'></td>").text(summe.nacht));
            sumRow.append($("<td class='blau'></td>").text(summe.blau));
            sumRow.children().css("font-weight", "bold");
            ztable.append(sumRow);
        }
    }
});
