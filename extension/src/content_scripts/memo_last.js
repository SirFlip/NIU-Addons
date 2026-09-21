// Memo LAST: Autor-Filter, Mail-Icon und Kommando-Links je Memo
$(document).ready(function() {

var counter = 0;
var MemoAuthorsNames = [];

$("body > form").after("<b>Memos f&uuml;r den ausgew&auml;hlten Zeitraum nach Autor filtern:</b> <select id='authorfilter'><option value='0'></option></select><br />");

$("th:contains('Memo über')").each(function( index ) {

  var tableObj = this;

  var MemoAuthorName = memoAuthor($(this).closest("table"));

  var MemoAuthorOption = new Option(MemoAuthorName, MemoAuthorName);
  $(MemoAuthorOption).html(MemoAuthorName);

  if(!MemoAuthorsNames.includes(MemoAuthorName)) { MemoAuthorsNames.push(MemoAuthorName); $("#authorfilter").append(MemoAuthorOption); };

  $(tableObj).append(" <a id='mailButton" + counter + "'><img src=" + chrome.extension.getURL('/img/envelope.svg') + " width='12'></a>");
  $(tableObj).append(" <a id='gearButton" + counter + "'><img src=" + chrome.extension.getURL('/img/gear.svg') + " width='12'></a>");

  // Dienstnummer aus "Memo über Name (DNR)" lesen
  function memoDnr() {
    var m = /.*?\((.*?)\)/.exec($(tableObj).text());
    return m ? m[1].split(",")[0].trim() : null;
  }

  $("#gearButton" + counter).click(function() {
    var buttonObj = this;
    var dnr = memoDnr();
    if (!dnr) { return; }
    $(buttonObj).find("img").attr("src", chrome.extension.getURL('/img/ajax-loader.gif'));
    dnrToIdentifier(dnr).then(function(result) {
      $(buttonObj).hide();
      $(tableObj).append("<br />" + kommandoLinks(dnr, result, true));
    });
  });

  $("#mailButton" + counter).click(function() {
    var buttonObj = this;
    var dnr = memoDnr();
    if (!dnr) { return; }
    $(buttonObj).find("img").attr("src", chrome.extension.getURL('/img/ajax-loader.gif'));
    dnrToIdentifier(dnr).then(function(result) {
      return getEmployeeDataSheet(result.ENID);
    }).then(function(result) {
      window.open("mailto:" + result.Email);
    }).finally(function() {
      $(buttonObj).find("img").attr("src", chrome.extension.getURL('/img/envelope.svg'));
    });
  });
  counter++;
});

var select = $('#authorfilter');
select.html(select.find('option').sort(function(x, y) {
  return $(x).text() > $(y).text() ? 1 : -1;
}))
select.val(0);

// Autor eines Memo-Blocks = erste Zelle der zweiten Kopfzeile (nicht der ganze Text, sonst trifft ein
// Autorname auch, wenn er nur im Memotext oder als betroffene Person vorkommt)
function memoAuthor(table) {
  return $(table).find("tbody > tr:nth-child(2) > th:nth-child(1)").first().text().trim();
}

$("#authorfilter").change(function () {
  var selVal = $(this).val();
  $("body > table").each(function () {
    var show = (selVal == "0") || memoAuthor(this) === selVal;
    $(this).toggle(show);
    $(this).next("br").toggle(show);
  });
});

});
