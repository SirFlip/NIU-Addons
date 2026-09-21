// Startseite: Kalender-Export je Kurs. Dienste und Ambulanzen werden nicht mehr
// in NIU geplant, die entsprechenden Exporte wurden entfernt.
$(document).ready(function() {
  $('#ctl00_main_m_CourseList__CourseTable').find('a').attr('target', 'wrk_todayDetail');
  getCourses();
});

var getCourses = function() {
  var courses = $('#ctl00_main_m_CourseList__CourseTable').find('tr').slice(2);
  if (courses.length) {
    // add blank header row for styling to courses table
    $('#ctl00_main_m_CourseList__CourseTable').find('tr').first()
      .append('<td class="MessageHeaderCenter">&nbsp;</td>');
  }
  courses.each(function(key, course) {
    var cols = $(course).find('td');
    var datePattern = /(\d{2})\.(\d{2})\.(\d{4})\ (\d{2})\:(\d{2})/;

    var courseID = 'course_' + $(cols[0]).text();
    $(course).attr('id', courseID);

    var c = {};
    c.title = $(course).find('.CourseTitel').text();
    c.start = new Date($(cols[2]).text().split(',')[1].trim().replace(datePattern,'$3-$2-$1T$4:$5:00'));
    c.end = new Date($(cols[3]).text().split(',')[1].trim().replace(datePattern,'$3-$2-$1T$4:$5:00'));
    c.address = $(cols[4]).text();
    if (c.address in department) {
      c.address = department[c.address];
    }
    c.description = (new URL($(course).find('a').attr('href'), window.location.href)).href;

    var calDienst = createCalendar({
      options: {
        class: 'calExport',
        id: courseID,
        linkText: '<img src="' + chrome.extension.getURL('/img/addCal.png') + '" style="margin-right:0.2em;"><span style="display:table-cell;vertical-align:middle;">Export</span>',
      },
      data: c
    });
    $('#' + courseID).append('<td class="MessageBodyLeftBorder" style="border-right:1px solid gray;" width="63" id="exportCal_' + courseID + '"></td>');
    $('#exportCal_' + courseID).append(calDienst);
  });
  return courses.length;
};
