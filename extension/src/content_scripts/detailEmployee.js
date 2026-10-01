// Mitarbeiter-Detailseite: Hinweis auf nicht ausgefolgte Dekrete, Kopierbox
// für Name und Anschrift, Alter neben dem Geburtstag. Der Brief aus der
// Word-Vorlage wurde entfernt.

// Alter in vollen Jahren aus einem NIU-Datum (dd.mm.yyyy) zum Stichtag; null bei ungültigem Datum
function alterAusDatum(text, stichtag) {
  var m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$/.exec(text || '');
  if (!m) { return null; }
  var tag = parseInt(m[1], 10), monat = parseInt(m[2], 10) - 1, jahr = parseInt(m[3], 10);
  var geb = new Date(jahr, monat, tag);
  if (geb.getFullYear() !== jahr || geb.getMonth() !== monat || geb.getDate() !== tag) { return null; }
  var heute = stichtag || new Date();
  var alter = heute.getFullYear() - jahr;
  if (heute.getMonth() < monat || (heute.getMonth() === monat && heute.getDate() < tag)) { alter--; }
  return (alter < 0 || alter > 130) ? null : alter;
}

$(document).ready(function() {

  // Alter neben dem Geburtstag (Reiter "Sonstiges"); folgt Änderungen im Feld
  var geburtstag = $('#ctl00_main_m_Employee_m_ccEmployeeExtention__birthday_m_Textbox');
  if (geburtstag.length) {
    var alterSpan = $('<span id="niuAlter" style="margin-left:.6em;color:#555;white-space:nowrap;"></span>');
    (geburtstag.closest('span').length ? geburtstag.closest('span') : geburtstag).after(alterSpan);
    var zeigeAlter = function() {
      var a = alterAusDatum(geburtstag.val());
      alterSpan.text(a === null ? '' : '(' + a + ' Jahre)');
    };
    geburtstag.on('change keyup blur', zeigeAlter);
    zeigeAlter();
  }

  // Alarm für noch nicht ausgefolgte Urkunden und Dekrete
  var load = {};
  load[STORAGE_KEY_DEKRET_ALERT] = DEFAULT_DEKRET_ALERT;
  chrome.storage.sync.get(load, function(item) {
    if (item[STORAGE_KEY_DEKRET_ALERT]) {
      var dekretAlarm = [];
      $("span[id$='_m_DescriptionLabel']:contains('nicht ausgefolgt')").each(function() {
        var box = $(this).parent().parent().parent().parent();
        if (!box.find("td").length) {
          // Fallback, falls NIU die Verschachtelung aendert: naechsten Vorfahren mit Name (td) und Datum (input) suchen
          box = $(this).parent();
          for (var k = 0; k < 8 && box.length && !(box.find("td").length && box.find("input").length); k++) { box = box.parent(); }
        }
        var dekretName = box.find("td").first().text().trim();
        var dekretDatum = box.find("input").first().val();
        dekretAlarm.push("<b>" + dekretName + "</b> vom " + dekretDatum);
      });
      if(dekretAlarm.length>0) {
        var modalDiv = '<ul style="margin:10px 0px;list-style-position:inside;padding-left:.5em;">';
        $.each(dekretAlarm, function() {
          modalDiv += '<li style="margin-bottom:10px;">' + this + "</li>";
        });
        modalDiv += '</ul>';
        new PNotify({
          title: 'Dekrete noch nicht ausgefolgt:',
          text: modalDiv,
          type: "info",
          width: "400px",
        });
      }
    }
  });

  var person_data = {};

  person_data.vorname = $('#ctl00_main_m_Employee_m_ccEmployeeMain__firstName').val();
  person_data.nachname = $('#ctl00_main_m_Employee_m_ccEmployeeMain__lastName').val();
  person_data.berufstitel = $('#ctl00_main_m_Employee_m_ccEmployeeMain__professionTitle option:selected').text();
  person_data.titel = $('#ctl00_main_m_Employee_m_ccEmployeeMain__preAcademicTitle option:selected').text();
  person_data.PGtitel = $('#ctl00_main_m_Employee_m_ccEmployeeMain__postAcademicTitle option:selected').text();

  person_data.strasse = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_Street').val();
  person_data.hausnummer = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_StreetNumber').val();
  person_data.plz = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_PostalCode').val();
  person_data.ort = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_City').val();
  person_data.land = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_Country option:selected').text();

  // Volle Anschrift mit Zeilenumbrüchen
  person_data.anschrift = person_data.strasse + " " + person_data.hausnummer + "\n" + person_data.plz + " " + person_data.ort + "\n" + person_data.land;

  // generiert den vollen Namen eg Oberstudienrätin Dr. Mag. Karin Muster, MBA
  person_data.name = "";
  if (person_data.berufstitel != '<Berufstitel>') {
    person_data.name += person_data.berufstitel + " ";
  }
  if (person_data.titel != '<Titel>') {
    person_data.name += person_data.titel + " ";
  }
  person_data.name += person_data.vorname + " ";
  person_data.name += person_data.nachname + " ";
  if (person_data.PGtitel != '<Titel>' && person_data.PGtitel.trim() != "") {
    person_data.name += ", " + person_data.PGtitel;
  }
  person_data.name = person_data.name.trim();

  // Copybox für Adresse
  $('#ctl00_main_m_Employee_m_ccEmployeeMain__employeeMain').after('<span id="copybox" style="float:right;display:inline-flex;"><textarea rows="4" cols="77" style="font-size:80%;" id="copycontent">' + person_data.name + "\n" + person_data.anschrift + '</textarea></span>');
  $('#copybox').append('<a href="#" id="adr_copy" data-clipboard-target="#copycontent">' + copyImage + '</a>');
  new ClipboardJS('#adr_copy');
});
