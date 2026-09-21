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

function getEmployeeDataSheetNotCached(args) {
  var dict = {};
  var empNID = args.empNID;

  return $.get("https://niu.wrk.at/Kripo/Employee/detailEmployee.aspx?EmployeeNumberID=" + empNID)

    .then(function (data) {

      dict["Vorname"] = $(data).find("#ctl00_main_m_Employee_m_ccEmployeeMain__firstName").val();
      dict["Nachname"] = $(data).find("#ctl00_main_m_Employee_m_ccEmployeeMain__lastName").val();
      dict["istGast"] = $(data).find("#ctl00_main_m_Employee_m_ccEmployeeMain__type_3").prop("checked");
      dict["Dienstgrad"] = $(data).find("#ctl00_main_m_Employee_m_ccEmployeeMain__rank option:selected").text();
      dict["FotoURL"] = $(data).find("#ctl00_main_m_Employee_m_ccEmployeeMain__picture").attr("src");
      dict["Geburtstag"] = $(data).find("#ctl00_main_m_Employee_m_ccEmployeeExtention__birthday_m_Textbox").val();
      dict["Ersteintritt"] = $(data).find("#ctl00_main_m_Employee_m_ccEmployeeExtention__firstEntry_m_Textbox").val();
      dict["TelNummer"] = $(data).find("#ctl00_main_m_Employee_m_ccPersonContact_m_ccContact0_m_NumberLabel").text();
      dict["Email"] = $(data).find("a[href*='mailto']").attr("href").replace("mailto:", "");
      dict["ADuser"] = $(data).find("#ctl00_main_m_Employee_m_ccEmployeeExtention_m_Employee > tbody > tr > td:contains('Wrk.at\')").text();

      var permArray = [];

      $(data).find(".PermissionRow").each(function () {

        var permDict = {};

        permDict["typ"] = $(this).find(".PermissionType").text();
        permDict["permission"] = $(this).find(".PermissionName").text();

        permDict["revoked"] = $(this).find(".PermissionCheckbox").find("input").is(':checked');

        permArray.push(permDict);


      });

      dict["PermissionArray"] = permArray;

      dict["AmpelCode"] = "";

      $(data).find(".PermissionQualificationIcon").each(function () {
        var amphtml = this.outerHTML;
        if ($(amphtml).find('img').length) { dict["AmpelCode"] += amphtml; }
      });

      return dict;

    });


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

async function getKeyInfo(eid) {
  var keys = [];
  var baseurl = "https://niu.wrk.at/Kripo/Employee/IssuedKeys.aspx?EmployeeId=";
  var statustable = "<table><thead><tr><th>Typ</th><th>ID</th><th>Ausgegeben am: </th><th>Eingezogen am: </th><th>Ausgegeben durch: </th></tr><thead><tbdoy>";

  var data = await $.ajax(
    {
      url: baseurl + eid,
      type: 'GET'
    }
  );

  var keysarray = [];
  var keytable = $(data).find(".standard");
  var keyrows = $(keytable).find("tr");
  keyrows = keyrows.slice(0);

  for (i = 1; i <= keyrows.length - 1; i++) {

    var keydata = $(keyrows[i]).find("td");
    var keytype = null;
    var keyid = null;
    if (isNaN($(keydata[2]).html())) {
      if ($(keydata[2]).html().includes("BegehCard") === true || $(keydata[2]).html().includes("Begehcard") === true){
        keytype = "BegehCard";
        keyid = $(keydata[2]).html().substr(10);
      }
      else if($(keydata[2]).html().includes("Begeh Card") === true  || $(keydata[2]).html().includes("BEGEH CARD") === true ) {
        keytype = "BegehCard";
        keyid = $(keydata[2]).html().substr(11);
      } else if ($(keydata[2]).html().includes("WEZ2000neu")) {
        keytype = "WEZ Neu";
        keyid = $(keydata[2]).html().substr(11);
      } else if ($(keydata[2]).html().includes("WEZ 2000neu") || $(keydata[2]).html().includes("WEZ 2000NEU") || $(keydata[2]).html().includes("WEZ 2000Neu")) {
        keytype = "WEZ Neu";
        keyid = $(keydata[2]).html().substr(12);
      } else if ($(keydata[2]).html().includes("CHS-Schlüssel") || $(keydata[2]).html().includes("CHS")) {
        keytype = "CHS-Schlüsel";
        keyid = "";  
      } else if ($(keydata[2]).html().includes("Transponder rot KHD")) {
        keytype = "Transponder KHD rot";
        keyid = "";
      } else if ($(keydata[2]).html().includes("Transponder rot ABZ")) {
        keytype = "Transponder ABZ rot";
        keyid = "";
      } else if ($(keydata[2]).html().includes("Spindschlüssel")) {
        keytype = "Spind";
        keyid = $(keydata[2]).html().substr(16);
      } else if ($(keydata[2]).html().includes("Spind")) {
        keytype = "Spind";
        keyid = $(keydata[2]).html().substr(6);
      } else if ($(keydata[2]).html().includes("WEZ2000") && !$(keydata[2]).html().includes("WEZ2000neu") && !$(keydata[2]).html().includes("WEZ 2000neu") ){
        keytype = "WEZ2000";
        keyid = $(keydata[2]).html().substr(8);
      } else if ($(keydata[2]).html().includes("WEZ 2000")  && !$(keydata[2]).html().includes("WEZ2000neu") && !$(keydata[2]).html().includes("WEZ 2000neu") ) {
        keytype = "WEZ2000";
        keyid = $(keydata[2]).html().substr(9);
      } else if ($(keydata[2]).html().includes("2000er")) {
        keytype = "WEZ2000";
        keyid = $(keydata[2]).html().substr(6);
      } else {
        keytype = "Sonstiger";
        keyid = $(keydata[2]).html();
      }
    } else {
      keytype = "Transponder";
      keyid = $(keydata[2]).html();
    }
    var key = {
      "key_type": keytype,
      "key_id": keyid,
      "issued_at": $(keydata[0]).html(),
      "revoked_at": $(keydata[1]).html(),
      "issued_by": $(keydata[3]).html()
    };
    console.log
    keys.push(key);
    statustable += "<tr><td>" + key.key_type + "</td><td>" + key.key_id + "</td><td>" + key.issued_at + "</td><td>" + key.revoked_at + "</td><td>" + key.issued_by + "</td></tr>";
  }
  statustable += "</tbody></table>";
  return statustable;  
}
