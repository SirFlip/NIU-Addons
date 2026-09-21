var isCacheActive = function isCacheActive() {
  console.log("isCacheActive --> called");
  var load = {};
  load[STORAGE_KEY_CACHE_ACTIVE] = DEFAULT_CACHE_ACTIVE;
  return new Promise(function (resolve, reject) {
    chrome.storage.sync.get(STORAGE_KEY_CACHE_ACTIVE, function (item) {
      console.log("isCacheActive --> cache is " + item[STORAGE_KEY_CACHE_ACTIVE]);
      //console.log(!item[STORAGE_KEY_CACHE_ACTIVE]);
      resolve(item[STORAGE_KEY_CACHE_ACTIVE]);
    });
  });
}


// Cache-Funktionen und NIU-Abfragen fuer Liste/Ausdruck und Memos.
//maximale cache zeit in millisekunden
MAX_CACHE_TIME = 1000 * 60 * 60 * 24; //24 Stunden cache zeit
//CACHE_ACTIVE = true;
/**
  stellt verbindung zur pouchdb her
*/
function getDB() {
  var db = new PouchDB(POUCHDB_DB_NAME);
  window.PouchDB = PouchDB;
  return db;
}

function saveToCache(prefix, id, object) {
  console.log("saveToCache --> called");
  var db = getDB();

  var dict = {};
  dict['object'] = object;
  dict['lastchange'] = new Date().getTime();
  dict['_id'] = prefix + id;
  var key = prefix + id;
  return db.get(key)
    .catch(function (error) {
      if (error.name === 'not_found') {
        return dict;
      }
    })
    .then(function (olddoc) {
      if (olddoc.hasOwnProperty('_rev')) {
        dict['_rev'] = olddoc['_rev'];
      }

      return db.put(dict)
        .then(function () {
          console.log("saveToCache --> erfolgreich gespeichert: " + JSON.stringify(dict));
          return object;
        }).catch(function (error) {
          console.log("saveToCache --> fehler beim speichern in pouchdb!: " + dict + " error: " + error);
          return object; //auch im fehlerfalle
        });
    })

}

function getFromCache(prefix, id, args, callback, classobject) {
  console.log("getFromCache --> lade vom cache: " + prefix + id);
  var db = getDB();
  var key = prefix + id;

  //promise verkettet
  return isCacheActive()
    .then(function (cache) {
      if (!cache) { return Promise.reject("cache ist ausgeschalten!"); }
    })
    .then(function () {
      return db.get(key);
    })
    .then(function (doc) {

      console.log("getFromCache --> doc: " + JSON.stringify(doc));
      var now = new Date().getTime();
      if (now - doc.lastchange > MAX_CACHE_TIME) {
        console.log("getFromCache --> fail weil cache ablauf!");
        return Promise.reject("maximale cache zeit " + MAX_CACHE_TIME + "ms abgelaufen!");
      }
      if (classobject === undefined) {
        //console.log("just as it is....");
        return doc.object;
      } else {
        //console.log("parse from json string...: " + doc.object);
        return classobject.fromJson(doc.object);
      }
    })
    .catch(function (reason) {  //promise rejected, jetzt lade von niu!
      console.log("getFromCache --> fail: " + reason);
      return callback(args).then(function (object) {
        console.log("getFromCache --> lade von niu: " + JSON.stringify(object));
        var save = object;
        if (classobject != undefined) {
          save = object.toJson();
        }
        isCacheActive().then(function (active) {
          active && saveToCache(prefix, id, save).then(function () { });
        });

        return object;
      });

      //return saveToCache(prefix, id, promise);
    });
}

function getOwnDNRs() {
  return getFromCache("ownDnr", "", "", getOwnDNRsNotCached);
}

function getOwnDNRsNotCached() {
  return $.get("https://niu.wrk.at/Kripo/Header.aspx")
    .then(function (data) {

      var regexp = /\((.*?)\)/g;
      var subStr = $(data).find("#userName").text();
      var foundMatch = regexp.exec(subStr);
      var returnArr = foundMatch[1].split(",");
      console.log(returnArr);
      return returnArr;

    });
}

function writeMemo(MemoObj) {
  var post = {};

  post["Memodate"] = MemoObj["memodate"];
  if (MemoObj["memoreminder"] !== undefined) {
    post["Erinnerung"] = MemoObj["memoreminder"];
  }


  post["Memo_neu"] = "Memo+neu";
  post["DNR"] = MemoObj["dnr"]
  post["verfasser"] = MemoObj["dnrself"];

  var formdatastring = Object.entries(post).map(([k, v]) => `${k}=${v}`).join('&');  //erstelle eine parameterliste param1=etwas&param2=text
  formdatastring = formdatastring + "&Memotext=" + escape(MemoObj["memotext"]); //Verwende nur bei memotext escape und füge den Parameter an
  return $.ajax({
    url: "https://niu.wrk.at/df/memo/memo_Neu.asp",
    data: formdatastring,
    type: "POST",
    contentType: "application/x-www-form-urlencoded"
  });

}

/*
  verwandelt ein javascript Datum: Date in
  den üblicherweise vom Niu verwendeten Datumstring: dd.MM.YYYY
  date - das datum als Date object
  return - der DatumsString
*/
function getNiuDateString(date) {
  var todaysDate = date;
  var todaysDatePlus = todaysDate.getMonth() + 1; // Weil im Datumsobjekt Januar = 0
  var todaysDateString = todaysDate.getDate() + "." + todaysDatePlus + "." + todaysDate.getFullYear();
  return todaysDateString;
}

/*
 * verwandelt die dienstnummer in die EmployeeId von NIU,
 * damit ist es dann möglich direkt auf die Employee Page zuzugreifen
 */
function dnrToIdentifierNotCached(args) {

  var dnr = args.dnr;
  //verkettete promises:
  return $.get("https://niu.wrk.at/Kripo/external/ControlCenterHead.aspx")

    .then(function (data) {
      //console.log("dnrToIdentifier --> first get request promise data: " + data);
      console.log("dnrToIdentifierNotCached --> parse get request data");
      var jData = $(data);

      var keyPostfix = jData.find("#__KeyPostfix").val();
      var eventvalidation = jData.find("#__EVENTVALIDATION").val(); //jData.find("input[name=__EVENTVALIDATION]").val();

      var post = {};
      post["__KeyPostfix"] = keyPostfix;
      post["__EVENTVALIDATION"] = eventvalidation;
      post["__VIEWSTATE"] = "";
      post["__EVENTARGUMENT"] = "";

      post["m_txtEmployeeNumber"] = dnr;
      post["m_btSend"] = "Anfage Senden";
      return post;
    })
    .then(function (post) {
      return $.ajax({
        url: "https://niu.wrk.at/Kripo/external/ControlCenterHead.aspx",
        data: post,
        type: "POST"
      });

    })
    .then(function (data) {
      console.log("dnrToIdentifierNotCached --> parse post req result");
      //console.log("dnrToIdentifier --> post request mit rcv data: " + data);
      // success: function(data, status) {
      var searchString = $(data).find("#m_lbtStatistik").attr("href"); // EmployeeNumberID
      var searchString2 = $(data).find("#m_lbtEducation").attr("href"); // EmployeeId

      var regexpr = /EmployeeNumberID=(.*)/g;
      var regexpr2 = /EmployeeId=(.*)/g;

      var foundIdentA = regexpr.exec(searchString);
      var foundIdentB = regexpr2.exec(searchString2);

      var dict = {};
      dict["ENID"] = foundIdentA[1];
      dict["EID"] = foundIdentB[1];
      return dict;
    });
}

/*
  dnr to identifier pouchdb cached
*/
function dnrToIdentifier(dnr) {
  return getFromCache("empid_", dnr, { 'dnr': dnr }, dnrToIdentifierNotCached);
}

function getEmployeeDataSheet(empNID) {
  return getFromCache("datasheetv5_", empNID, { 'empNID': empNID }, getEmployeeDataSheetNotCached);
}

// Datenblatt aus dem HTML von detailEmployee.aspx lesen (reine Funktion, testbar)
function parseEmployeeDataSheet(data) {
  var dict = {};
  var $d = $(data);

  dict["Vorname"] = $d.find("#ctl00_main_m_Employee_m_ccEmployeeMain__firstName").val() || "";
  dict["Nachname"] = $d.find("#ctl00_main_m_Employee_m_ccEmployeeMain__lastName").val() || "";
  dict["istGast"] = $d.find("#ctl00_main_m_Employee_m_ccEmployeeMain__type_3").prop("checked") === true;
  dict["Dienstgrad"] = $d.find("#ctl00_main_m_Employee_m_ccEmployeeMain__rank option:selected").text();
  dict["FotoURL"] = $d.find("#ctl00_main_m_Employee_m_ccEmployeeMain__picture").attr("src") || "";
  dict["Geburtstag"] = $d.find("#ctl00_main_m_Employee_m_ccEmployeeExtention__birthday_m_Textbox").val() || "";
  dict["Ersteintritt"] = $d.find("#ctl00_main_m_Employee_m_ccEmployeeExtention__firstEntry_m_Textbox").val() || "";
  dict["TelNummer"] = $d.find("#ctl00_main_m_Employee_m_ccPersonContact_m_ccContact0_m_NumberLabel").text();
  // nicht jeder Mitarbeiter hat eine E-Mail: dann leer statt Fehler
  var mail = $d.find("a[href*='mailto']").first().attr("href");
  dict["Email"] = mail ? mail.replace(/^mailto:/i, "").trim() : "";
  dict["ADuser"] = $d.find("#ctl00_main_m_Employee_m_ccEmployeeExtention_m_Employee > tbody > tr > td:contains('Wrk.at')").text();

  var permArray = [];
  $d.find(".PermissionRow").each(function () {
    permArray.push({
      typ: $(this).find(".PermissionType").text(),
      permission: $(this).find(".PermissionName").text(),
      revoked: $(this).find(".PermissionCheckbox").find("input").is(':checked')
    });
  });
  dict["PermissionArray"] = permArray;

  dict["AmpelCode"] = "";
  $d.find(".PermissionQualificationIcon").each(function () {
    var amphtml = this.outerHTML;
    if ($(amphtml).find('img').length) { dict["AmpelCode"] += amphtml; }
  });

  return dict;
}

function getEmployeeDataSheetNotCached(args) {
  return $.get("https://niu.wrk.at/Kripo/Employee/detailEmployee.aspx?EmployeeNumberID=" + args.empNID)
    .then(parseEmployeeDataSheet);
}

function checkCourseAttendance(empID, courseDict) {
  return getFromCache("courseattend2_", empID + courseDict.UID, { 'empID': empID, 'courseDict': courseDict }, checkCourseAttendanceNotCached);
}

//TODO: $.get liefert schon ein promise zurück, somit ist das new Promise unnötig
function checkCourseAttendanceNotCached(args) {

  // Function accepts courseDict in format of:
  //var courseDict = {
  //                    UID : "Unique ID for Cache"
  //                    kurs1 : { "Name" : "Main Course Name|Alternative Name|Alternative Name", courseID : "Course Number|Alternative Course Number|Alternative Course Number", "tnStatus" : "nein" },
  //                    kurs2 : { "Name" : "Main Course Name|Alternative Name|Alternative Name", courseID : "Course Number|Alternative Course Number|Alternative Course Number", "tnStatus" : "nein" },
  //                    kurs3 : { "Name" : "Main Course Name|Alternative Name|Alternative Name", courseID : "Course Number|Alternative Course Number|Alternative Course Number", "tnStatus" : "nein" },
  // [... unlimited additions to dictionary possible but format has to remain the same! ]
  //                  };

  var courseDict = args.courseDict;
  var empID = args.empID;

  return new Promise(function (resolve, reject) {
    var post = {};

    $.get("https://niu.wrk.at/Kripo/Kufer/SearchCourse.aspx?EmployeeId=" + empID, function (data) {
      var jData = $(data);

      var keyPostfix = jData.find("#__KeyPostfix").val();
      var eventvalidation = jData.find("#__EVENTVALIDATION").val(); //jData.find("input[name=__EVENTVALIDATION]").val();

      var todaysDate = new Date();
      var todaysDatePlus = todaysDate.getMonth() + 1; // Weil im Datumsobjekt Januar = 0
      var todaysDateString = todaysDate.getDate() + "." + todaysDatePlus + "." + todaysDate.getFullYear();

      post["__KeyPostfix"] = keyPostfix;
      post["__EVENTVALIDATION"] = eventvalidation;
      post["__VIEWSTATE"] = "";
      post["__EVENTARGUMENT"] = "";
      post["__EVENTTARGET"] = "ctl00$main$m_Search";
      post["ctl00$main$m_From$m_Textbox"] = "01.01.1995";
      post["ctl00$main$m_Until$m_Textbox"] = todaysDateString;
      post["ctl00$main$m_Options$3"] = "on"; // Qualifikationen anzeigen
      post["ctl00$main$m_Options$6"] = "on"; // Auch Anrechnungskurse
      post["ctl00$main$m_Options$7"] = "on"; // Auch E-Learning
      post["ctl00$main$m_CourseName"] = "";


      $.ajax({
        url: "https://niu.wrk.at/Kripo/Kufer/SearchCourse.aspx?EmployeeId=" + empID,
        data: post,
        type: "POST",
        success: function (data, status) {

          var registeredCourses = [];

          $(data).find("#ctl00_main_m_CourseList__CourseTable > tbody > tr").each(function (index, element) {

            var singleCourseDict = { abzID: "", titel: "", tnStatus: "" };

            if ($(element).find(".CourseTitel").length > 0) // filtern der nicht-kurs-zeilen
            {

              singleCourseDict.abzID = $('td:eq(0)', element).text().trim();
              singleCourseDict.titel = $('td:eq(1)', element).text().trim();
              singleCourseDict.tnStatus = $('td:eq(6)', element).text().trim();
              registeredCourses.push(singleCourseDict);

            }

          });

          //console.log(registeredCourses);
          //console.log(courseDict);

          for (var course in courseDict) {

            for (var regCourse in registeredCourses) {

              try {

                var RequestedCourseNameArray = courseDict[course].Name.split("|");
                var RequestedCourseIDArray = courseDict[course].courseID.split("|");

                for (i = 0; i < RequestedCourseNameArray.length; i++) {
                  if (registeredCourses[regCourse].titel.includes(RequestedCourseNameArray[i]) && courseDict[course].Name !== "") { courseDict[course].tnStatus = registeredCourses[regCourse].tnStatus; }
                }

                for (i = 0; i < RequestedCourseIDArray.length; i++) {
                  if (registeredCourses[regCourse].abzID === RequestedCourseIDArray[i]) { courseDict[course].tnStatus = registeredCourses[regCourse].tnStatus; }
                }

              }
              catch { }
            }

          }
          resolve(courseDict); //Ausgabe des Ergebnisses

        }
      });
    });
  });
}

// Basis-URL von NIU: im Userscript der aktuelle Host, in der Extension fest
function niuBase() {
  return (typeof NIU_BASE !== 'undefined') ? NIU_BASE : 'https://niu.wrk.at';
}

// Deep-Links zu den Kommando-Funktionen eines Mitarbeiters (Liste/Ausdruck, Memo-Seiten).
// ids = { EID, ENID } aus dnrToIdentifier; inline = true liefert eine Zeile mit " | " statt einer Liste.
function kommandoLinks(dnr, ids, inline) {
  var b = niuBase();
  var links = [
    ['Mitarbeiter', '/Kripo/Employee/summaryemployee.aspx?EmployeeId=' + ids.EID],
    ['Details', '/Kripo/Employee/detailEmployee.aspx?EmployeeId=' + ids.EID],
    ['Urlaub', '/Kripo/Employee/ListAvailabilities.aspx?EmployeeNumberID=' + ids.ENID],
    ['Fahrscheingeld', '/df/fahrscheingeld/entschaedigung/entschaedigung.asp?DienstNr=' + dnr],
    ['Uniform', '/Kripo/Employee/UniformList.aspx?EmployeeId=' + ids.EID],
    ['Schl&uuml;ssel', '/Kripo/Employee/IssuedKeys.aspx?EmployeeId=' + ids.EID],
    ['Memo', '/df/memo/memo_eingeben.asp?DienstNr=' + dnr],
    ['Ausbildung', '/Kripo/Kufer/SearchCourse.aspx?EmployeeId=' + ids.EID],
    ['LV Statistik', '/Kripo/Employee/LVStatistic.aspx?EmployeeId=' + ids.EID],
    ['Statistik', '/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=' + ids.ENID],
    ['Dokumente', '/Kripo/Employee/Conan/ListDocuments.aspx?EmployeeId=' + ids.EID]
  ];
  var a = links.map(function (l) { return "<a target='_blank' href='" + b + l[1] + "'>" + l[0] + "</a>"; });
  if (inline) { return "<div style='font-size:x-small;'>" + a.join(' | ') + "</div>"; }
  return "<ul><li>" + a.join("</li><li>") + "</li></ul>";
}

// Fuehrt worker(item, index) fuer alle items aus, aber hoechstens `limit` gleichzeitig (schont NIU).
// Liefert ein Promise mit den Ergebnissen in Reihenfolge der items; Fehler ergeben undefined.
function runWithLimit(items, limit, worker) {
  var results = new Array(items.length);
  var next = 0;
  function run() {
    if (next >= items.length) { return Promise.resolve(); }
    var i = next++;
    return Promise.resolve()
      .then(function () { return worker(items[i], i); })
      .then(function (r) { results[i] = r; }, function () { results[i] = undefined; })
      .then(run);
  }
  var lanes = [];
  for (var k = 0; k < Math.max(1, limit || 1); k++) { lanes.push(run()); }
  return Promise.all(lanes).then(function () { return results; });
}
