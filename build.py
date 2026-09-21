#!/usr/bin/env python3
"""
Baut aus der Chrome-Extension "NIU's little helper" ein einzelnes Userscript
(Tampermonkey / Violentmonkey / Userscripts für Safari).

    python3 build.py            ->  dist/niu-little-helper.user.js

Braucht nur Python 3 (keine Pakete). Quelle ist der Ordner ./extension
(manifest.json + js/ + src/ + img/), dazu die Dateien in ./userscript.

Aufbau des Ergebnisses:
  * Alles steckt in EINER Funktion -> gemeinsamer Scope wie bei den
    Content-Scripts einer Extension.
  * Bibliotheken (jQuery, PouchDB, XLSX, ...) sind in Funktionen verpackt und
    werden erst ausgeführt, wenn eine Seite sie laut manifest.json braucht.
  * Bilder/HTML/CSS der Extension sind eingebettet (keine @require/@resource,
    damit es ohne Internetzugriff und auch in Safari/Userscripts läuft).
"""
import base64
import json
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXT = ROOT / "extension"
US = ROOT / "userscript"
OUT = ROOT / "dist" / "niu-little-helper.user.js"

# Userscript-Version = Extension-Version + eigener Zähler
US_REVISION = 9

# Globale Namen, die die Bibliotheken bereitstellen und die die Content-Scripts
# als nackte Bezeichner verwenden.
EXPORTS = [
    # ermittelt mit test/exports-scan.js
    "jQuery", "$", "moment", "PouchDB", "createCalendar", "PNotify", "ClipboardJS", "vex",
]

# Dateien, die nur Definitionen enthalten und immer im gemeinsamen Scope liegen
SHARED = [
    "src/definitions.js",
    "src/content_scripts/lib/var.js",
    "src/content_scripts/lib/lib.js",
    "src/content_scripts/lib/staff-lib.js",
]

NIU_HOSTS = r"(?:niu|niu\.wrk\.at)"

# Zusätzliche Module, die es in der Extension nicht gab
EXTRA_ENTRIES = [
    {"match_re": [r"^https?://" + NIU_HOSTS + r"/kripo/header\.aspx"],
     "libs": [], "css": [], "scripts": ["userscript/settings.js"]},
    {"match_re": [r"^https?://" + NIU_HOSTS + r"/kripo/header\.aspx$"],
     "libs": ["js/jquery/jquery.js"], "css": [], "scripts": ["userscript/header-extras.js"]},
    {"match_re": [r"^https?://" + NIU_HOSTS + r"/kripo/"],
     "libs": [], "css": [], "scripts": ["userscript/nur8xxx.js"]},
]


def read(rel):
    base = ROOT if rel.startswith("userscript/") else EXT
    text = (base / rel).read_text(encoding="utf-8-sig")
    return text.replace("\r\n", "\n")


def data_uri(path: Path):
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    data = path.read_bytes()
    if mime.startswith("image/svg") or mime.startswith("text/"):
        data = data.replace(b"\r\n", b"\n")  # Git checkt Textdateien je Plattform mit CRLF/LF aus -> gleiches Ergebnis ueberall
    return "data:%s;base64,%s" % (mime, base64.b64encode(data).decode("ascii"))


def js_str(s):
    # JSON ist gültiges JS; U+2028/2029 sicherheitshalber escapen
    return json.dumps(s, ensure_ascii=False).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def match_to_regex(pattern):
    """Chrome-Match-Pattern -> Regex (Gross/Kleinschreibung egal, IIS ist es auch egal)."""
    m = re.match(r"^(\*|https?)://([^/]+)(/.*)$", pattern)
    if not m:
        raise SystemExit("Unbekanntes Match-Pattern: " + pattern)
    scheme, host, path = m.groups()
    scheme_re = "https?" if scheme == "*" else re.escape(scheme)
    # "*" als Host hiess in der Extension "jeder Host" - hier bewusst nur NIU
    host_re = NIU_HOSTS if host == "*" else re.escape(host)
    path_re = "".join(".*" if c == "*" else re.escape(c) for c in path)
    return "^" + scheme_re + "://" + host_re + path_re + "$"


def patch_source(rel, text):
    """Kleine, gezielte Anpassungen am Original-Code."""
    if rel == "src/content_scripts/lib/staff-lib.js":
        n = text.count('"https://niu.wrk.at/')
        if n != 7:
            raise SystemExit("staff-lib.js: %d statt 7 NIU-URLs gefunden - Patch prüfen" % n)
        text = text.replace('"https://niu.wrk.at/', 'NIU_BASE + "/')
    # <img src=" + getURL(..) + " width=..>  ->  Attribut in Hochkommas (data:-URIs!)
    text = re.sub(r"""<img src=" \+ (chrome\.extension\.getURL\('[^']+'\)) \+ " width""",
                  r"""<img src='" + \1 + "' width""", text)
    return text


def inline_css(rel):
    css = read(rel)
    css_dir = (EXT / rel).parent

    def repl(m):
        url = m.group(1).strip().strip("'\"")
        if url.startswith("data:"):
            return m.group(0)
        name = Path(url).name
        for cand in (css_dir / url, EXT / "img" / name):
            if cand.is_file():
                return 'url("%s")' % data_uri(cand)
        return "none"  # Bild fehlte schon in der Extension -> keine 404-Anfragen an NIU

    return re.sub(r"url\(([^)]*)\)", repl, css)


def main():
    manifest = json.loads(read("manifest.json"))
    version = "%s.%d" % (manifest["version"], US_REVISION)

    entries, lib_order, script_order, css_order = [], [], [], []
    for cs in manifest["content_scripts"]:
        libs, scripts = [], []
        for f in cs.get("js", []):
            f = f.lstrip("/")
            if f in SHARED:
                continue
            (libs if f.startswith("js/") else scripts).append(f)
        css = [c.lstrip("/") for c in cs.get("css", [])]
        entries.append({"match_re": [match_to_regex(p) for p in cs["matches"]],
                        "libs": libs, "css": css, "scripts": scripts})
    # der normale Aufruf der Unterschreiben-Seite war nur für niu.wrk.at eingetragen
    for e in entries:
        if "src/content_scripts/spezialdienstUnterschreiben.js" in e["scripts"]:
            e["match_re"].append(r"^https?://" + NIU_HOSTS + r"/df/spezialdiensterfassung/unterschreiben\.asp.*$")
    entries += EXTRA_ENTRIES

    for e in entries:
        for f in e["libs"]:
            if f not in lib_order:
                lib_order.append(f)
        for f in e["scripts"]:
            if f not in script_order:
                script_order.append(f)
        for f in e["css"]:
            if f not in css_order:
                css_order.append(f)

    # ---- Ressourcen -------------------------------------------------------
    res = {}
    for p in sorted((EXT / "img").iterdir()):
        if p.is_file():
            res["img/" + p.name] = data_uri(p)
    for p in sorted((EXT / "src" / "webcontent").iterdir()):
        if p.suffix == ".html" and not p.name.startswith("welcome"):
            res["src/webcontent/" + p.name] = read("src/webcontent/" + p.name)

    out = []
    w = out.append

    w("// ==UserScript==")
    meta = [
        ("name", "NIU's little helper (Userscript)"),
        ("namespace", "niu.hannes"),
        ("version", version),
        ("description", "NIU-Addon: Userscript-Portierung von NIU's little helper (Wiener Rotes Kreuz, NIU), reduziert auf Kurse, Mitarbeiter-Verwaltung, Memos und Spezialdienste, plus Filter 'nur 8xxx' im Mitarbeiter-Dropdown."),
        ("author", "Gerald Baeck und Mitwirkende; Userscript-Portierung: Hannes"),
        ("homepageURL", "https://github.com/SirFlip/NIU-Addons"),
        ("supportURL", "https://github.com/SirFlip/NIU-Addons/issues"),
        ("updateURL", "https://github.com/SirFlip/NIU-Addons/releases/latest/download/niu-little-helper.meta.js"),
        ("downloadURL", "https://github.com/SirFlip/NIU-Addons/releases/latest/download/niu-little-helper.user.js"),
        ("match", "*://niu/*"),
        ("match", "*://niu.wrk.at/*"),
        ("run-at", "document-end"),
        ("grant", "GM.getValue"),
        ("grant", "GM.setValue"),
        ("grant", "GM_getValue"),
        ("grant", "GM_setValue"),
        ("grant", "GM_addStyle"),
        ("grant", "GM_registerMenuCommand"),
        ("grant", "GM_openInTab"),
        ("grant", "unsafeWindow"),
    ]
    for k, v in meta:
        w("// @%-12s %s" % (k, v))
    w("// ==/UserScript==")
    header = "\n".join(out) + "\n"
    w("")
    w("// AUTOMATISCH ERZEUGT von build.py - nicht von Hand ändern, sondern die")
    w("// Quellen in extension/ bzw. userscript/ anpassen und neu bauen.")
    w("// Original-Extension \"NIU's little helper\" von Gerald Baeck, Sebastian Kuttnig,")
    w("// Stephan Spindler, Daniel Steiner et al.: https://github.com/geraldbaeck/NIUsLittleHelper")
    w("// Lizenz des Originals und dieser Portierung: public domain (Unlicense), siehe UNLICENSE im Repo.")
    w("// Eingebettete Bibliotheken unterliegen ihren jeweiligen Lizenzen (Header bleiben erhalten).")
    w("")
    w("(function () {")
    w("var __VERSION = %s;" % js_str(version))
    w("var " + ", ".join(EXPORTS) + ";")
    w("var __RES = {")
    w(",\n".join("  %s: %s" % (js_str(k), js_str(v)) for k, v in res.items()))
    w("};")
    w("")
    w(read("userscript/shim.js"))

    # ---- gemeinsame Definitionen -------------------------------------------
    for f in SHARED:
        w("\n// ===== " + f + " =====")
        w(patch_source(f, read(f)))

    # ---- CSS ---------------------------------------------------------------
    w("\nvar __CSS = {")
    w(",\n".join("  %s: %s" % (js_str(f), js_str(inline_css(f))) for f in css_order))
    w("};")

    # ---- Bibliotheken (lazy) -------------------------------------------------
    collect = "\n".join(
        "    try { __e[%s] = (typeof %s !== 'undefined' && %s) || window[%s]; } catch (_) {}" % (js_str(n), n, n, js_str(n))
        for n in EXPORTS)
    w("\nvar __LIBS = {};")
    for f in lib_order:
        w("\n// ===== " + f + " =====")
        w("__LIBS[%s] = function () {" % js_str(f))
        w("  var __e = {};")
        w("  (function () {")
        w(read(f))
        w("    ;")
        w(collect)
        w("  }).call(window);")
        w("  return __e;")
        w("};")

    adopt = "\n".join("  if (e[%s]) %s = e[%s];" % (js_str(n), n, js_str(n)) for n in EXPORTS)
    w("\nfunction __adopt(e) {\n" + adopt + "\n}")

    # ---- Seiten-Skripte ------------------------------------------------------
    w("\nvar __SCRIPTS = {};")
    for f in script_order:
        w("\n// ===== " + f + " =====")
        w("__SCRIPTS[%s] = function () {" % js_str(f))
        w(patch_source(f, read(f)))
        w("};")

    # ---- Dispatcher ----------------------------------------------------------
    w("\nvar __ENTRIES = [")
    lines = []
    for e in entries:
        lines.append("  { re: [%s], libs: %s, css: %s, scripts: %s }" % (
            ", ".join("new RegExp(%s, 'i')" % js_str(r) for r in e["match_re"]),
            json.dumps(e["libs"]), json.dumps(e["css"]), json.dumps(e["scripts"])))
    w(",\n".join(lines))
    w("];")
    w(r"""
(function __dispatch() {
  var url = location.protocol + '//' + location.host + location.pathname + location.search;
  var libs = [], css = [], scripts = [];
  function addAll(target, list) { list.forEach(function (x) { if (target.indexOf(x) < 0) target.push(x); }); }

  __ENTRIES.forEach(function (e) {
    if (!e.re.some(function (r) { return r.test(url); })) return;
    addAll(libs, e.libs); addAll(css, e.css); addAll(scripts, e.scripts);
  });

  if (window.top === window.self && typeof GM_registerMenuCommand === 'function') {
    try {
      GM_registerMenuCommand("NIU's little helper: Einstellungen", function () {
        if (typeof GM_openInTab === 'function') GM_openInTab(NIU_SETTINGS_URL, { active: true });
        else window.open(NIU_SETTINGS_URL, '_blank');
      });
    } catch (e) { /* Menü ist optional */ }
  }

  if (!scripts.length) return;
  console.log(__LOG + 'v' + __VERSION + ' aktiv: ' + scripts.map(function (s) { return s.replace(/^.*\//, ''); }).join(', '));

  css.forEach(function (f) { __addStyle(__CSS[f]); });

  libs.forEach(function (f) {
    try {
      __adopt(__LIBS[f]());
      if (f === 'js/jquery/jquery.js' && jQuery) __installResTransport(jQuery);
    } catch (err) {
      console.error(__LOG + 'Bibliothek konnte nicht geladen werden: ' + f, err);
    }
  });

  scripts.forEach(function (f) {
    try { __SCRIPTS[f](); }
    catch (err) { console.error(__LOG + 'Fehler in ' + f, err); }
  });
})();
""")
    if "--test" in sys.argv:  # nur für test/smoke.js: Zugriff auf den inneren Scope
        w("if (typeof window.__NIU_HELPER_TEST__ === 'function') window.__NIU_HELPER_TEST__(function (n) { return eval(n); });")
    w("})();")

    out_path = ROOT / "test" / "build-test.user.js" if "--test" in sys.argv else OUT
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text("\n".join(out) + "\n", encoding="utf-8")
    if "--test" not in sys.argv:
        meta_path = out_path.with_name("niu-little-helper.meta.js")
        meta_path.write_text(header, encoding="utf-8")
        print("OK  %s  (nur Metadaten, fuer @updateURL)" % meta_path.relative_to(ROOT))
    print("OK  %s  (%.2f MB, Version %s)" % (out_path.relative_to(ROOT), out_path.stat().st_size / 1e6, version))
    print("    %d Bibliotheken, %d Seiten-Skripte, %d CSS, %d Ressourcen, %d Regeln"
          % (len(lib_order), len(script_order), len(css_order), len(res), len(entries)))
    return 0

if __name__ == "__main__":
    sys.exit(main())
