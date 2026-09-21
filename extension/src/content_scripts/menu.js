// Sidebar (menu.aspx): Eintrag "Kurssuche (NIU)" unter "Ausbildung" wieder einfuegen.
// NIU verlinkt dort nur noch die MPO-Kurssuche; die NIU-Kurssuche (SearchCourse.aspx) gibt es aber weiterhin.
//
// Bevorzugt ueber die Dynatree-API der Seite (Knoten kennen href + target "main"), damit der Eintrag sich wie
// die anderen verhaelt. Faellt das aus (kein Zugriff auf das Seiten-jQuery), wird ein Listeneintrag mit
// target="main" direkt ins Markup gesetzt.
(function () {
  'use strict';

  var TITLE = 'Kurssuche (NIU)';
  var HREF = '/Kripo/Kufer/SearchCourse.aspx';
  var AFTER = 'Kurssuche im MPO';   // dahinter einfuegen
  var SECTION = 'Ausbildung';

  // Im Userscript liegt das jQuery der Seite hinter unsafeWindow, in der Extension hinter window
  var pw = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

  function alreadyThere() {
    return Array.prototype.some.call(document.querySelectorAll('#_Tree a.dynatree-title'), function (a) {
      return a.textContent.trim() === TITLE;
    });
  }

  function viaApi() {
    var $p = pw.jQuery;
    if (!$p || !$p.fn || !$p.fn.dynatree) { return false; }
    var tree;
    try { tree = $p('#_Tree').dynatree('getTree'); } catch (e) { return false; }
    if (!tree || !tree.getRoot) { return false; }
    var section = tree.getRoot().childList.filter(function (n) { return n.data.title === SECTION; })[0];
    if (!section) { return false; }
    var node = section.addChild({ title: TITLE, href: HREF, target: 'main' });
    var before = null;
    section.childList.some(function (n, i) {
      if (n.data.title === AFTER) { before = section.childList[i + 1] || null; return true; }
      return false;
    });
    if (before && before !== node) { try { node.move(before, 'before'); } catch (e) { /* bleibt am Ende */ } }
    return true;
  }

  function viaDom() {
    var anchors = document.querySelectorAll('#_Tree a.dynatree-title');
    var ref = null, sectionLi = null;
    Array.prototype.forEach.call(anchors, function (a) {
      var t = a.textContent.trim();
      if (t === AFTER) { ref = a.closest('li'); }
      if (t === SECTION) { sectionLi = a.closest('li'); }
    });
    var template = ref || (sectionLi && sectionLi.querySelector('ul > li'));
    if (!template) { return false; }
    var li = template.cloneNode(true);
    var a = li.querySelector('a.dynatree-title');
    if (!a) { return false; }
    a.textContent = TITLE;
    a.setAttribute('href', HREF);
    a.setAttribute('target', 'main');
    a.removeAttribute('title');
    li.className = '';
    if (ref) { ref.parentNode.insertBefore(li, ref.nextSibling); }
    else { template.parentNode.appendChild(li); }
    return true;
  }

  var tries = 0;
  (function attempt() {
    if (alreadyThere()) { return; }
    if (viaApi()) { return; }
    if (++tries < 25) { setTimeout(attempt, 200); return; }   // Dynatree wird evtl. erst nach document_end aufgebaut
    viaDom();
  })();
})();
