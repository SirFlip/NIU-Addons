/*
  Mitarbeiter Liste/Ausdruck: sortierbare Tabelle mit Filterfeldern und einem
  Menue "Funktionen", das je Menuepunkt eine Auswertungsspalte anhaengt.

  addCalculationHandler(id, names, callback)
    id - id des Menuepunkts, bei Klick wird die Spalte hinzugefuegt und
      fuer jede Zeile das callback mit der Dienstnummer aufgerufen
    names - Array von {calcname, uiname, avg, type} je Spalte
    callback(dnr, name, row) - liefert ein Promise, dessen Ergebnis in die
      Tabellenzelle geschrieben wird
*/
var clicked = {};
vex.defaultOptions.className = 'vex-theme-os';

function addCalculationHandler(id, names, callback) {

  $(id).click(function() {
    $('#menu > li').removeClass('open');
    if (id in clicked) { //verhindern, das eine Spalte mehrmals hinzugefügt wird
      return;
    }
    clicked[id] = true;

    names.forEach( function(name) {
        columns.push({
          data: name.calcname,
          title: name.uiname,
          avg: name.avg,
          defaultContent: ""
        });

        initDataTable();

        //TODO: um das NIU zu schonen sollten die Abfragen hier seriell abgearbeitet werden
        var ready = Promise.resolve();
        for (var index in dataSet) {
          var row = dataSet[index];

          var p = new Promise(function(resolve, raise) {
               var i = index;
               var r = row;
               var c = columns.length - 1;

               r[name.calcname] = "<img id='ajaxloader' src='" + chrome.extension.getURL('/img/ajax-loader.gif') + "'>";
               datatable.cell(i, c).invalidate().draw();

               var res = callback(r.DNR, name, r)
                .then(function(value) {
                  r[name.calcname] = value;
                  datatable.cell(i, c).invalidate().draw();
                })
                .catch(function(error) {
                  console.log("addCalculationHandler -> promise then mit error: " + error);
                });
                resolve(res);
          });
          ready = ready.then(function() {
           return p;
          });

        }
        ready.then(function() { //warte auf die promises...
          console.log("addCalculationHandler --> promises abgearbeitet");
        });
    });
  });

}

var dataSet = new Array;
var columns = new Array;

var datatable = undefined;
function initDataTable() {

  if (datatable !== undefined) {
      datatable.destroy();
      datatable = undefined;
  }

  $('#datatablediv').empty();

  datatable = $('<table id="datatable"></table>');

  var tfoot = $("<tfoot><tr></tr></tfoot>");
  for (let i = 0; i < columns.length; i++) {
    tfoot.find("tr").append("<th></th>");
  }
  datatable.append(tfoot);

  $('#datatablediv').append(datatable);

  datatable = datatable.DataTable({
    footerCallback: function(tfoot, data, start, end, display) {
        var api = this.api();

        for (let i = 0; i < columns.length; i++) {
          var c = api.column(i);
          if (!isNaN([c.data()[0]])) {
            var total = c.data().reduce(function(a,b) {
              return (Number(a) + Number(b));
            }, 0);

            if (!isNaN(total)) {
              $(c.footer()).find(".avg").html("avg: " + (total / data.length).toFixed(1));
            }
          }
        }
    },
    destroy: true,
    data: dataSet,
    columns: columns,
    paging: false
  });

  for (let i = 0; i < columns.length; i++) {
    var html = "";
    html = html + "<span >" + columns[i].title + "</span><br><input type='text' class='footer_input'></input>";
    if (columns[i].avg) {
      html = html + "<span class='avg'></span><br>";
    }
    $(datatable.column(i).footer()).html(html);

    if (activeFilters["input_field_col" + i] !== undefined) {
      $(datatable.column(i).footer()).find(".footer_input").val(activeFilters["input_field_col" + i].search);
    }

    $(datatable.column(i).footer()).find(".footer_input").on('keyup change', function() {
      var val = this.value;
      if (activeFilters["input_field_col" + i] === undefined) { //init des Dictionaries einmal mit einem immer true filter
        activeFilters["input_field_col" + i] = {
            "column_names" : [columns[i].name],
            "filter" : function(searchData, index, rowData, counter) {
              return true;
            },
            "search" : val
        };
      }
      if (activeFilters["input_field_col" + i].search !== val) {
        activeFilters["input_field_col" + i].search = val;
        activeFilters["input_field_col" + i].filter = function(searchData, index, rowData, counter) {
          return String(rowData[columns[i].data]).includes(val);
        }
        datatable.draw();
      }
    });

  }

  //verändere css, damit die sorting images angezeigt werden!
  $("#datatable").find(".sorting").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_both.png") + '")');
  $("#datatable").find(".sorting_asc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_asc.png")  + '")');
  $("#datatable").find(".sorting_desc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_desc.png")  + '")');

  $("#datatable").find("tbody").on("click", "tr", function() {
    if ($(this).hasClass('selected')) {
      $(this).removeClass("selected");
    } else {
      $(this).addClass('selected');
    }
  });

  datatable.draw();
}


var activeFilters = {};

$.fn.dataTable.ext.search.push(
  function( settings, searchData, index, rowData, counter ) {
    var show = true;
    for (let key in activeFilters) {
      var f = activeFilters[key];
      if (f === undefined) {
        continue;
      }
      show = show && f.filter(searchData, index, rowData, counter); //UND verknüpfung der suchfilter
    }
    return show;
  }
);


// Sammel-Mail: alle Adressen ins BCC, An-Feld bleibt leer (frueher stand hier ein Platzhalter-Empfaenger)
function generateMailLink(bcc) {
  var list = bcc.filter(function (m) { return m && String(m).trim() !== ""; });
  return "mailto:?" + $.param({ bcc: list.join(",") });
}

// Liste mit Deep-Links zu den Kommando-Funktionen eines Mitarbeiters
function kommandoLinks(dnr, result) {
  var base = (typeof NIU_BASE !== 'undefined') ? NIU_BASE : 'https://niu.wrk.at';
  return "<ul>" +
    "<li><a target='_blank' href='" + base + "/Kripo/Employee/summaryemployee.aspx?EmployeeId=" + result.EID + "'>Mitarbeiter</a></li>" +
    "<li><a target='_blank' href='" + base + "/Kripo/Employee/detailEmployee.aspx?EmployeeId=" + result.EID + "'>Details</a></li>" +
    "<li><a target='_blank' href='" + base + "/Kripo/Employee/ListAvailabilities.aspx?EmployeeNumberID=" + result.ENID + "'>Urlaub</a></li>" +
    "<li><a target='_blank' href='" + base + "/df/fahrscheingeld/entschaedigung/entschaedigung.asp?DienstNr=" + dnr + "'>Fahrscheingeld</a></li>" +
    "<li><a target='_blank' href='" + base + "/Kripo/Employee/UniformList.aspx?EmployeeId=" + result.EID + "'>Uniform</a></li>" +
    "<li><a target='_blank' href='" + base + "/Kripo/Employee/IssuedKeys.aspx?EmployeeId=" + result.EID + "'>Schl&uuml;ssel</a></li>" +
    "<li><a target='_blank' href='" + base + "/df/memo/memo_eingeben.asp?DienstNr=" + dnr + "'>Memo</a></li>" +
    "<li><a target='_blank' href='" + base + "/Kripo/Kufer/SearchCourse.aspx?EmployeeId=" + result.EID + "'>Ausbildung</a></li>" +
    "<li><a target='_blank' href='" + base + "/Kripo/Employee/LVStatistic.aspx?EmployeeId=" + result.EID + "'>LV Statistik</a></li>" +
    "<li><a target='_blank' href='" + base + "/Kripo/Employee/Conan/ListDocuments.aspx?EmployeeId=" + result.EID + "'>Dokumente</a></li>" +
    "</ul>";
}

// Hilfsfunktion: Datenblatt eines Mitarbeiters holen und eine Spalte daraus berechnen
function datasheetColumn(id, calcname, uiname, render) {
  addCalculationHandler(id, [{calcname : calcname, uiname : uiname}], function(dnr, name) {
    return dnrToIdentifier(dnr)
      .then(function(result) { return getEmployeeDataSheet(result.ENID); })
      .then(render);
  });
}

// Berechtigungen eines Typs als Liste
function permissionList(result, matcher, withType) {
  var berArray = result.PermissionArray;
  var permString = "";
  for (var i = 0; i < berArray.length; i++) {
    if (!berArray[i].revoked && matcher(berArray[i].typ)) {
      permString += (withType ? berArray[i].typ + " -> " : "") + berArray[i].permission + "<br>";
    }
  }
  return permString;
}

$(document).ready(function() {

  var exportTable = $(".export");

  var headers = [];
  //parse first column also die headers...
  exportTable.find("tr:first th").each( function(index) {
      headers.push($(this).text());
      columns.push( {
        data: $(this).text(),
        title: $(this).text(),
        name: $(this).text()
      });
  });

  //parse data
  exportTable.find("tr:gt(0)").each( function(index) {
      var row = {};
      $(this).find("td").each(function(index) {
        row[headers[index]] = $(this).text();
      });
      dataSet.push(row);
  });

  exportTable.after("<div id='datatablediv'></div>");
  exportTable.hide();
  initDataTable();

  var header = $("#ctl00_m_Header");

  // Menue mit den moeglichen Berechnungen laden; nicht alle sofort ausfuehren,
  // das waeren zu viele Requests und nicht jeder braucht alle Spalten.
  var path = chrome.extension.getURL("src/webcontent/employee_dump_menu.html");
  $.get(path, function(data) {

    header.after(data);
    $('#menu .menu-title').click(function() {
      $(this).parent().toggleClass('open');
    });

    header.after("<button type='button' class='niu-btn' id='select_all_button'>Alle Zeilen selektieren</button>");
    header.after("<button type='button' class='niu-btn' id='clear_selection'>Selektion löschen</button>");
    $('#select_all_button').click(function() {
      $("#datatable").find("tbody tr").addClass("selected");
    });
    $('#clear_selection').click(function() {
      $("#datatable").find("tbody tr").removeClass("selected");
    });

    header.after("<button type='button' class='niu-btn' id='mailto_alle_sichtbaren'>Mailto an alle sichtbaren</button>");
    $('#mailto_alle_sichtbaren').click(function() {
      var mails = datatable.rows({filter: 'applied'}).column("Email:name").data().toArray();
      window.open(generateMailLink(mails));
    });

    header.after("<button type='button' class='niu-btn' id='mailto_alle_selektiert'>Mailto an alle selektierten</button>");
    $('#mailto_alle_selektiert').click(function() {
      if(datatable.rows('.selected').count() < 1) {
        vex.dialog.alert('Es wurde keine Auswahl getroffen, Funktion wird beendet.');
        return;
      }
      var mails = [];
      $.each($(datatable.rows('.selected').data()),function(key,value){
         mails.push(value.Email);
      });
      window.open(generateMailLink(mails));
    });

    header.after("<button type='button' class='niu-btn' id='memo_alle_selektiert'>Memo f&uuml;r alle selektierten</button>");
    $('#memo_alle_selektiert').click(function() {

       if(datatable.rows('.selected').count() < 1) {
        vex.dialog.alert('Es wurde keine Auswahl getroffen, Funktion wird beendet.');
        return;
       }
       $("#memo_alle_selektiert").html("<img id='ajaxloader' src='" + chrome.extension.getURL('/img/ajax-loader.gif') + "'>");

       return getOwnDNRs()
       .then(function(returnDNrs) {

       $("#memo_alle_selektiert").html("Memo f&uuml;r alle selektierten");

       var composeStr = 'Verfasser: <select name="memoverfasser" style="margin-bottom:5px;">';
       $.each($(returnDNrs),function(key,value){
         composeStr += '<option>' + value.trim() + '</option>';
       });
       composeStr += '</select>';

       var selDnrsObj = datatable.rows('.selected').data();
       var selDnrsArr = [];
       $.each($(selDnrsObj),function(key,value){
         selDnrsArr.push(value.DNR);
       });

       vex.dialog.open({
       message: 'Memo wird angelegt bei: ' + selDnrsArr.toString(),
       input: [
         composeStr,
        '<textarea name="memo" placeholder="Hallo, ich bin ein Memo." style="width:98%"></textarea>',
        '<input type="textbox" name="memodate" placeholder="Datum" value="' + getNiuDateString(new Date()) + '" style="border:0px;"> ',
        '<input type="textbox" name="memoreminder" placeholder="Erinnerungsdatum" style="border:0px;">'
       ].join(''),
       buttons: [
        $.extend({}, vex.dialog.buttons.YES, { text: 'Anlegen' }),
        $.extend({}, vex.dialog.buttons.NO, { text: 'Abbrechen' })
       ],
       callback: function (data) {
        if (!data) {
          return;
        }
        var promises = [];
        $.each( selDnrsObj, function( key, value ) {
          var MemoObj = {};
          MemoObj["memotext"] = data.memo;
          MemoObj["dnr"] = value.DNR;
          MemoObj["dnrself"] = data.memoverfasser;
          MemoObj["memodate"] = data.memodate;
          MemoObj["memoreminder"] = data.memoreminder;
          promises.push(writeMemo(MemoObj));
        });

        $.when.apply($, promises).then(function() {
          vex.dialog.alert('Memos wurden erfolgreich angelegt!')
        }, function() {
          vex.dialog.alert('Zumindest ein Memo konnte nicht erfolgreich angelegt werden!')
        });
       }
       });
       });
    });

    // ---- Ausbildungen
    // TODO (P8): Kursnamen und Cache-Version "grk4" beim Aendern hochzaehlen
    addCalculationHandler("#grundkurse", [{calcname : "grundkurse", uiname : "Grundkurse"}], function(dnr, name) {
       var grundkurse = {
         UID : "grk4",
         kurs1 : { "Name" : "Das Rote Kreuz", "courseID" : "", "tnStatus" : "nein" },
         kurs2 : { "Name" : "SAN - Ausbildung - RS Ambulanzseminar", "courseID" : "", "tnStatus" : "nein" },
         kurs3 : { "Name" : "BAS - Ausbildung - KHD-SD-Praxis|BAS - Ausbildung - KHD-Praxistag", "courseID" : "", "tnStatus" : "nein" },
         kurs4 : { "Name" : "SAN - Ausbildung - San1-Seminar|SAN - Ausbildung - SAN1-Seminar", "courseID" : "", "tnStatus" : "nein" }
       };
       return dnrToIdentifier(dnr)
        .then(function(result) { return checkCourseAttendance(result.EID, grundkurse); })
        .then(function(resultDict) {
          return ("Das RK: " + resultDict.kurs1.tnStatus + "<br />KHD-SD: " + resultDict.kurs3.tnStatus + "<br />SAN1-Seminar: " + resultDict.kurs4.tnStatus + "<br />AmbSem (alt): " + resultDict.kurs2.tnStatus);
        });
    });

    var tooltipCssAdded = false;
    datasheetColumn("#ampel", "ampel", "SAN-Ampel", function(result) {
      if (!tooltipCssAdded) {
        $("head").append("<link rel=\"stylesheet\" type=\"text/css\" href=\"/Kripo/Shares/tooltip.css\">");
        tooltipCssAdded = true;
      }
      return result.AmpelCode;
    });

    // ---- Berechtigungen
    datasheetColumn("#alleber", "alleber", "Berechtigungen", function(result) {
      return permissionList(result, function() { return true; }, true);
    });
    datasheetColumn("#sanber", "sanber", "SAN-Berechtigung", function(result) {
      return permissionList(result, function(typ) { return typ === "SAN" || typ === "SanG"; }, true);
    });
    datasheetColumn("#fsdber", "fsdber", "FSD-Berechtigung", function(result) {
      return permissionList(result, function(typ) { return typ.includes("GSD") || typ.includes("FSD"); }, false);
    });
    // TODO (P12): "Fahrer" wurde in NIU auf drei Berechtigungen aufgeteilt, Filter pruefen
    datasheetColumn("#fahrber", "fahrber", "Fahrer-Berechtigung", function(result) {
      return permissionList(result, function(typ) { return typ.includes("Fahrer"); }, true);
    });

    // ---- Verwaltung
    datasheetColumn("#dienstgrade", "dienstgrade", "Dienstgrad", function(result) { return result.Dienstgrad; });
    datasheetColumn("#gaststatus", "gaststatus", "Gaststatus", function(result) { return result.istGast ? "ja" : "nein"; });
    datasheetColumn("#fotofehlt", "fotofehlt", "Foto fehlt?", function(result) { return result.FotoURL.includes("unknown") ? "ja" : "nein"; });

    addCalculationHandler("#shortcuts", [{calcname : "shortcuts", uiname : "Kommando"}], function(dnr, name) {
        return dnrToIdentifier(dnr).then(function(result) { return kommandoLinks(dnr, result); });
    });

    addCalculationHandler("#keys", [{calcname: "keys", uiname: "Ausgegebene / Eingezogene Schlüssel"}], function(dnr, name){
      return dnrToIdentifier(dnr).then(function(result) { return getKeyInfo(result.EID); });
    });

    // ---- EDV
    datasheetColumn("#niuzugang", "niuzugang", "AD-Benutzer", function(result) { return result.ADuser; });
  });
});
