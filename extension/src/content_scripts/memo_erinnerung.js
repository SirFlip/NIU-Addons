// Memo-Erinnerungen: Mail-Icon und Kommando-Links je Erinnerung
$(document).ready(function() {

var counter = 0;

$("tbody > tr:first-child > th").each(function( index ) {

  var tableObj = this;

  if($(tableObj).text().indexOf("erneute") != -1) { return; }

  $(tableObj).append(" <a id='mailButton" + counter + "'><img src=" + chrome.extension.getURL('/img/envelope.svg') + " width='12'></a>");
  $(tableObj).append(" <a id='gearButton" + counter + "'><img src=" + chrome.extension.getURL('/img/gear.svg') + " width='12'></a>");

  // Dienstnummer ist das erste Wort der Kopfzeile
  function memoDnr() {
    var m = /(.*?) /.exec($(tableObj).text());
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

});
