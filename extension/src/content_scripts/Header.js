// Kopfzeile: Hinweis mit Versionsnummer, verlinkt auf das Repo (Einstellungs-Link kommt aus header-extras.js)
$(document).ready(function() {
  var version = '';
  try { version = chrome.runtime.getManifest().version; } catch (e) { /* ohne Version */ }
  var text = 'NIU-Addon' + (version ? ' ' + version : '') + ' ist derzeit aktiv.';
  $("#pageTitle").after('<b><a target="_blank" style="color:white;border-bottom: 1px white dotted; text-decoration: none;" href="https://github.com/SirFlip/NIU-Addons#readme" title="NIU-Addon: Readme auf GitHub">' + text + '</a></b>');
});
