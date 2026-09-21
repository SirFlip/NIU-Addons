// Kursdetails: Kalender-Export je Kurstermin. Die Hilfen für das Anmeldeformular
// (Kostenstelle, Kürzel, Mitarbeiter-Suchfeld) wurden entfernt, weil die
// Kursanmeldung nicht mehr über NIU läuft.
$(document).ready(function() {

    var scrapeCourse = function() {
      var course = {
        Termine: [],
        Url: window.location.href,
        queryDate: new Date()
      };
      course.titel = $('h5').text();
      course.id = course.titel.split('-')[0].trim();
      $.each($($('table.MessageTable')[0]).find('tr').slice(2), function(key, tr) {
        var mh = $(tr).find('.MessageHeader').text().trim().slice(0, -1);
        var md = $(tr).find('.MessageBodyLeftBorder');
        switch (mh) {
          case '':
          case undefined:
          case null:
            break;

          case 'Kursbeginn':
          case 'Kursende':
          case 'Anmeldeschluss':
            if ($(md).text().trim() != '' && $(md).text().trim() != '-') {
              var datePattern = /(\d{2})\.(\d{2})\.(\d{4})\ (\d{2})\:(\d{2})/;
              course[mh] = new Date($(md).text().trim().split(',')[1].trim().replace(datePattern,'$3-$2-$1T$4:$5:00'));
            }
            break;

          case 'Kursstunden':
            course[mh] = parseInt($(md).text().trim().replace('Stunde(n)', '').trim());
            break;

          case 'Termine':
            var tcount = 0;
            $.each($(tr).find('table.MessageTable').find('tr').slice(1), function(key, t) {
              var termin = {
                id: course.id + '_' + tcount.toString(),
                titel: course.titel,
              };
              $(this).attr('id', 'termin_' + termin.id);
              var tds = $(t).find('td');

              var rawDate = $(tds[0]).text().trim();
              var datePattern = /(\d{2})\.(\d{2})\.(\d{4})/;
              if (rawDate.length == 9) {
                rawDate = '0' + rawDate;
              }
              termin.start = new Date(rawDate.replace(datePattern,'$3-$2-$1') + 'T' + $(tds[1]).text().trim().split('-')[0].trim() + ':00');
              termin.ende = new Date(rawDate.replace(datePattern,'$3-$2-$1') + 'T' + $(tds[1]).text().trim().split('-')[1].trim() + ':00');

              termin.ort = $(tds[2]).text().trim();
              if ($(tds[3]).text().trim() != '') {
                termin.ort += ', ' + $(tds[3]).text().trim();
              }
              if ($(tds[4]).text().trim() != '') {
                termin.ort += ', ' + $(tds[4]).text().trim();
              }
              if ($(tds[5]).text().trim() != '') {
                termin.ort += ' (' + $(tds[5]).text().trim() + ')';
              }
              course['Termine'].push(termin);
              tcount++;
            });
            break;

          case 'Qualifikationen':
            break;

          default:
            if ($(md).text().trim() != '') {
              course[mh] = $(md).text().trim();
            }
        }
      });
      if (course.Termine.length == 0) {
        var termin = {
          id: course.id + '_A',
          titel: course.titel,
          start: course.Kursbeginn,
          ende: course.Kursende,
          ort: course.Kursort
        };
        if (course.Sonstiges) {
          termin.beschreibung = course.Sonstiges;
        }
        course.Termine.push(termin);
      }

      // Termin export unter der Überschrift für single event Termine
      if (course.Termine.length == 1) {
        var headTermin = $.extend({}, course.Termine[0]);
        headTermin.id = course.Termine[0].id + '_head';
        var cal = createCalElement(headTermin);
        $('h1').append('<div id="exportCal_' + headTermin.id + '"></div>');
        $('#exportCal_' + headTermin.id).append(cal);
      }

      $('td.MessageHeaderCenter:contains(\'Bezeichnung\')').after('<td class="MessageHeaderCenter" width="90">&nbsp;</td>')

      // Termin export in die Termintabelle
      course.Termine.forEach(function(termin) {
        if (course.Sonstiges) {
          termin.beschreibung = course.Sonstiges;
        }
        var cal = createCalElement(termin);
        $('#termin_' + termin.id).append('<td id="ttt_' + termin.id + '" class="MessageBodyLeftBorder"></td>');
        $('#ttt_' + termin.id).append(cal);
      });

      return course;
    };

    function createCalElement(termin) {
      var calData = {
        title: termin.titel,
        start: termin.start,
        end: termin.ende,
        address: termin.ort,
      }
      if (termin.beschreibung) {
        calData.description = termin.beschreibung;
      }
      return createCalendar({
        options: {
          class: 'calExport',
          id: termin.id,
          linkText: '<img src="' + chrome.extension.getURL('/img/addCal.png') + '" style="margin-right:0.2em;"><span style="display:table-cell;vertical-align:middle;">Export</span>',
        },
        data: calData
      });
    }

    scrapeCourse();

  });
