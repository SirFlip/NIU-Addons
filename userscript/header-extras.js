// Ergänzt den Hinweis aus Header.js um einen Link zu den Einstellungen
// (die Extension hatte dafür eine eigene Optionsseite).
$(document).ready(function () {
  var helperLink = $('a[href*="NIU-Addons"]').first();
  if (!helperLink.length || $('#niuHelperSettingsLink').length) return;
  helperLink.after(' <a id="niuHelperSettingsLink" target="_blank" title="Einstellungen des NIU-Addons" ' +
    'style="color:white;text-decoration:none;margin-left:.6em;" href="' + NIU_SETTINGS_URL + '">&#9881; Einstellungen</a>');
});
