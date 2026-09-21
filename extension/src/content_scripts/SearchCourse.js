var kursauswahl;
var kurssuche;
var activeFilters = {}; //ul menüleiste, die wählbare suchfilter enthält
var suchfilter;


function addSuchfilter(table, key, uiname, column_names, callback) {
  suchfilter.append('<li><input  id="suchfilter_' + key + '" type="checkbox" value="value"><label for="suchfilter_' + key + '" style="padding-right:1em;">' + uiname + '</label></li>');
  suchfilter.find('#suchfilter_' + key).change(function() {
      if ($(this).is(':checked')) {
        activeFilters[key] = { "column_names" : column_names, "filter" : callback };
      } else {
        activeFilters[key] = undefined;
      }
      table.draw(); //redraw um suche erneut auszuführen!
  });
}


//verstecke Kursauswahl und speichere status
function hideKursauswahl() {
  var set = {};
  set[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE] = true;
  chrome.storage.sync.set(set, function() {
    kursauswahl.hide();
    var einblenden = $("<h5 class='einblenden'><a>Kursauswahl einblenden</a></h5>");
    $(".Whitebox:eq(0)").prepend(einblenden);
    einblenden.click(function() {
      var set = {};
      set[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE] = false;
      chrome.storage.sync.set(set, function() {
        kursauswahl.show();
        einblenden.remove();
      });
    });
  });
}

//verstecke Kurssuche und speichere status
function hideKurssuche() {
  var set = {};
  set[STORAGE_KEY_SEARCH_COURSE_HIDE_SEARCH] = true;
  chrome.storage.sync.set(set, function() {
    kurssuche.hide();
    var einblenden = $("<h5 class='einblenden'><a>Kurssuche einblenden</a></h5>");
    $(".Whitebox:eq(0)").append(einblenden);
    einblenden.click(function() {
      var set = {};
      set[STORAGE_KEY_SEARCH_COURSE_HIDE_SEARCH] = false;
      chrome.storage.sync.set(set, function() {
        kurssuche.show();
        einblenden.remove();
      });
    });
  });
}

$(document).ready(function() {
  var tabelle = $("#ctl00_main_m_CourseList__CourseTable");

  kursauswahl = $("tr:contains('Kursauswahl')").nextUntil("tr:has('#ctl00_main_m_Select')").addBack().next("tr").addBack();
  kurssuche = $("tr:contains('Kurssuche')").nextUntil("tr:has('#ctl00_main_m_Search')").addBack().next("tr").addBack();

  $(".Whitebox table h4").append("<span class='ausblenden'><a>ausblenden</a></span>");
  $(".Whitebox .ausblenden").click(function() {
      if ($(this).parent().text().includes("Kursauswahl")) {
          hideKursauswahl();
      }
      if ($(this).parent().text().includes("Kurssuche")) {
          hideKurssuche();
      }
  });

  var load = {};
  load[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE] = true;
  chrome.storage.sync.get(load, function(item) {
        if(item[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE]) {
            hideKursauswahl();
        }
  });

  load = {};
  load[STORAGE_KEY_SEARCH_COURSE_HIDE_SEARCH] = true;
  chrome.storage.sync.get(load, function(item) {
      if(item[STORAGE_KEY_SEARCH_COURSE_HIDE_SEARCH]) {
        hideKurssuche();
      }
  });

  if (tabelle.length == 0) {
    load = {};
    load[STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH] = DEFAULT_SEARCH_COURSE_ALWAYS_SEARCH;
    chrome.storage.sync.get(load, function(item) {
        if (item[STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH]) {
            var todaysDateString = getNiuDateString(new Date());
            var tillDate = new Date();
            tillDate.setMonth(tillDate.getMonth() + 12);
            var tillDateString = getNiuDateString(tillDate);

            $('#ctl00_main_m_From_m_Textbox').val(todaysDateString);
            $("#ctl00_main_m_To_m_Textbox").val(tillDateString);

            $("#ctl00_main_m_Options input[type=checkbox]").prop("checked", false); //alle checkboxen uncheck
            $("#ctl00_main_m_Options_3").prop("checked", true); // Qualifikationen anzeigen
            $("#ctl00_main_m_Options_5").prop("checked", true); // Auch Stornos
            $("#ctl00_main_m_Options_6").prop("checked", true); // Auch Anrechnungskurse
            $("#ctl00_main_m_Options_7").prop("checked", true); // Auch E-Learning
            $("#ctl00_main_m_Options_8").prop("checked", true); // Auch Warteliste

            $("#ctl00_main_m_Search").click();
        }
    });
  }

  //suchfilterleiste erzeugen
  tabelle.before("<div class='Whitebox suchfilter'><ul id='suchfilter'></ul></div>");
  suchfilter = $('#suchfilter');

  //DATATABLE
  var dataSet = new Array;
  var columns = new Array;

  //Unterscheidung, wenn Ausbildungstabelle für User abgefragt wird, gibt es eine
  //Spalte mehr, den Anmeldestatus!
  var maausbheaders = ["abznr", "kurs", "von", "bis", "ort",
  "kursstatus", "anmeldestatus", "qualifikation", "fortbildungsstunden"];
  var ausbheaders = ["abznr", "kurs", "von", "bis", "ort",
  "kursstatus", "qualifikation", "fortbildungsstunden"];

  var col_anmeldestatus = {
    data: "anmeldestatus",
    title: "Anmeldestatus"
  }

  columns = [
    {
      data: "abznr",
      targets : -1,
      render: function(data, type, full, meta) {
        return '<a class="open_course_link" href="/Kripo/Kufer/CourseDetail.aspx?CourseID=' + data + '">&ouml;ffnen</a>';
      }
    },
    {
      data: "abznr",
      title: "ABZ Nr",
      name: "abznr",
      defaultContent: "LEER"
    },{
      data: "kurs",
      title: "Kurs",
      name: "kurs"
    },{
      data: "von",
      title: "Von"
    },{
      data: "bis",
      title: "Bis"
    },{
      data: "ort",
      title: "Ort"
    },{
      data: "kursstatus",
      title: "Kursstatus (freie Plätze)",
      name: "kursstatus"
    },{
      data: "qualifikation",
      title: "Qualifikation",
      name: "qualifikation",
      defaultContent: ""
    },{
      data: "fortbildungsstunden",
      title: "Fortbildungsstunden",
      defaultContent: ""
    }
  ];

  var tds = tabelle.find("tr:first").find("td");

  var headers;
  if (tds.length == 10) {
    //es handelt sich um die Ausbildungen eines Users
    headers = maausbheaders;
    columns.push(col_anmeldestatus);
  } else if (tds.length == 9){
    //Ausbildungen ganz normal als Suche nach Ausbildungen
    headers = ausbheaders;
  } else {
    throw "ungültige anzahl an spalten!";
  }

  tabelle.find("tr").slice(1).each(function(index) {
    var row = {};
    if ($(this).find("td").length == 1) {

    } else {
      $(this).find("td").each(function (index) {
        var val = $(this).text();
        if (index == 0 && !(new RegExp("^.[0-9]+$").test(val))) { //ABZNR
          return;
        }
        row[headers[index]] = val;
      });
      dataSet.push(row);
    }
  });

  tabelle.after("<table id='datatable'></table>");
  tabelle.hide();

 //füge date format String für die Spalten Von und Bis hinzu siehe auch: https://datatables.net/blog/2014-12-18
  $.fn.dataTable.moment('dd, D.MM.YYYY HH:mm');

  var datatable = $("#datatable").DataTable({
    data: dataSet,
    columns: columns,
    paging: false
  });
  var table = $("#datatable");
  //verändere css, damit die sorting images angezeigt werden!
  table.find(".sorting").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_both.png") + '")');
  table.find(".sorting_asc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_asc.png")  + '")');
  table.find(".sorting_desc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_desc.png")  + '")');

  table.find("tr").on("click", "a.open_course_link", function(event) {
    window.open($(this).attr("href"), '_blank');
    return false;
  })

  $.fn.dataTable.ext.search.push(
    function( settings, searchData, index, rowData, counter ) {
      var show = true;
      for (let key in activeFilters) {
        var f = activeFilters[key];
        if (f === undefined) {
          continue;
        }
        var data = {};
        for (let c of f.column_names) {
            var idx = datatable.column(c + ":name").index("visible");
            data[c] = searchData[idx];
        }
        show = show && f.filter(data, index, rowData, counter); //UND verknüpfung der suchfilter
      }
      return show;
    }
  );

  addSuchfilter(datatable, "frei", "Nur Kurse mit freien Plätzen", ["kursstatus"], function(searchData, index, rowData, counter) {
      const regex = /Offen(?! \(0)/g;
      return regex.test(searchData.kursstatus);
  });

  addSuchfilter(datatable, "qualifikation_par_50", "Nur §50 Kurse", ["qualifikation"], function(searchData, index, rowData, counter) {
      return searchData.qualifikation.includes("§50");
  });

  addSuchfilter(datatable, "qualifikation_rea", "Nur §50 Reanimationstraining", ["qualifikation"], function(searchData, index, rowData, counter) {
      return searchData.qualifikation.includes("Reanimationstraining");
  });

  addSuchfilter(datatable, "qualifikation_rez", "Nur §51 Rezertifizierung", ["qualifikation"], function(searchData, index, rowData, counter) {
      return searchData.qualifikation.includes("Rezertifizierung");
  });

  addSuchfilter(datatable, "abznr_anrechnung", "Nur Anrechnungskurse", ["abznr"], function(searchData, index, rowData, counter) {
      return searchData.abznr.includes("A");
  });

  addSuchfilter(datatable, "abznr_keine_anrechnung", "Keine Anrechnungskurse", ["abznr"], function(searchData, index, rowData, counter) {
      return !(searchData.abznr.includes("A"));
  });

  addSuchfilter(datatable, "kurs_san_basis", "Nur SAN Basiskurse", ["kurs"], function(searchData, index, rowData, counter) {
      return  searchData.kurs.includes("BAS - Ausbildung - Das Rote Kreuz") ||
              searchData.kurs.includes("KHD-Praxistag") ||
              searchData.kurs.includes("KHD-SD-Praxis") ||
              searchData.kurs.includes("Ambulanzseminar") ||
              searchData.kurs.includes("San1-Seminar") ||
              searchData.kurs.includes("RS-Startmodul");
  });

  addSuchfilter(datatable, "kurs_kein_san", "Keine SAN Kurse", ["kurs", "qualifikation"], function(searchData, index, rowData, counter) {
      return !(searchData.qualifikation.includes("§50") || searchData.kurs.includes("SAN"));
  });

  addSuchfilter(datatable, "kurs_nur_gsd", "Nur FSD", ["kurs"], function(searchData, index, rowData, counter) {
      return searchData.kurs.includes("FSD");
  });

  addSuchfilter(datatable, "kurs_nur_khd", "Nur KHD", ["kurs"], function(searchData, index, rowData, counter) {
      return searchData.kurs.includes("KHD");
  });

  addSuchfilter(datatable, "kurs_nur_fkr", "Nur FKR", ["kurs"], function(searchData, index, rowData, counter) {
      return searchData.kurs.includes("FKR");
  });

  addSuchfilter(datatable, "kurs_pflichtf", "Nur Pflichtfortbildungen", ["kurs"], function(searchData, index, rowData, counter) {
      return  searchData.kurs.includes("RD-Fortbildung");
  });

});
