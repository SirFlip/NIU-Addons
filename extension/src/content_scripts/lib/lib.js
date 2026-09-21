// Gemeinsame Funktionen fuer VCF-Download (shortemployee, summaryemployee).

// erstellt die fertige VCard
function createVCard(employee,callback) {

  function toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      var reader = new FileReader();
      reader.onloadend = function() {
        callback(reader.result.split(",").pop());
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  toDataUrl(employee.imageUrl, function(myBase64) {
    function addVCardEntry(k, v) {
      vCard += k + ":" + v + "\n";
    }

    var vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
    vCard += "ORG:WRK\n";
    vCard += "PROFILE:VCARD\n";
    vCard += "TZ:+0100\n";
    vCard += "CATEGORIES:WRK,ÖRK\n";
    addVCardEntry("FN", employee.nameFull);
    addVCardEntry("N", employee.nameLast + ';' + employee.nameFirst + ';;;')
    addVCardEntry("URL", employee.url);
    addVCardEntry("REV", new Date().toISOString());

    //addVCardEntry("PHOTO;TYPE=PNG", employee.imageUrl);

    console.log(myBase64); // myBase64 is the base64 string

    addVCardEntry("PHOTO;TYPE=PNG;ENCODING=b", myBase64);

    addVCardEntry("UID", 'urn:uuid:' + employee.uid);
    addVCardEntry("NOTE", employee.notes);

    $.each(employee.contacts, function() {
      addVCardEntry(this.k, this.v);
    });
    vCard += 'END:VCARD\n'
    callback(vCard);
  });
}

// holt die verfügbaren MitarbeiterInnenDaten
function scrapeEmployee(jqObj, employeeLink) {
  var employee = {};

  if($(jqObj).find("title").first() !== "Error") {
    // Name
    var nameString = $(jqObj).find('#ctl00_main_shortEmpl_EmployeeName').text().trim();
    employee.nameFull = nameString.substring(0, nameString.indexOf('(')).trim();
    var nameArr = employee.nameFull.split(/\s+/);
    employee.nameFirst = nameArr.slice(0, -1).join(' ');
    employee.nameLast = nameArr.pop();
    employee.dienstnummer = nameString.substring(nameString.indexOf('(') + 1, nameString.indexOf(')'));

    // Foto
    employee.imageUrl = new URL($($(jqObj).find('#ctl00_main_shortEmpl_EmployeeImage')[0]).attr('src'), employeeLink).href;
    employee.url = employeeLink;

    employee.uid = getUID(employeeLink);

    employee.permissions = {};
    $(jqObj).find('.PermissionRow').each(function () {
      employee.permissions[$(this).find('.PermissionType').text().trim()] = $(this).find('.PermissionName').text().trim();
    });

    // Funktionen/Berechtigungen Notizen für VCF Export
    employee.notes = 'WRK Dienstnummer: ' + employee.dienstnummer;
    $(jqObj).find('.PermissionRow').each(function () {
      employee.notes += '\\n' + $(this).find('.PermissionType').text().trim() + ': ' + $(this).find('.PermissionName').text().trim();
    });

    employee.contacts = scrapeContactPoint(jqObj, "ctl00_main_shortEmpl_contacts_m_tblPersonContactMain");
  }

  console.log('Scraped: ' + employee.nameFull + ' (' + employee.dienstnummer + ')');
  console.log(employee);

  return employee;
}

function createVCFDownloadLink(employee, vCard) {
  var file = new Blob([vCard]);
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(file);
  $(a).append('<img alt="Download VCF" style="margin:7px;" src="' + chrome.extension.getURL('/img/vcf32.png') + '">');
  a.download = employee.nameFull.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.vcf';  // set a safe file name
  a.id = 'vcfLink';
  return a;
}

// query url for the UID
function getUID(url) {
  url = url.toLowerCase();
  var param = 'employeeid';
  if (url.includes('employeenumberid')) {
    param = 'employeenumberid';
  }
  var u = new URL(url);
  return u.searchParams.get(param);
}

// Kontaktmöglichkeiten
function scrapeContactPoint(jqObj, tid) {
  var contactPoints = [];
  var values = [];
  $(jqObj).find('table#'+ tid + ' tbody tr[id]').each(function () {
    var key;
    switch ($($(this).find('span[id]')[0]).text().split(' ')[0]) {
      case 'Telefon':
        key = 'TEL;';
        break;
      case 'Handy':
      case 'Bereitschaft':
        key = 'TEL;TYPE=cell;'
        break;
      case 'Fax':
        key = 'TEL;TYPE=fax;'
        break;
      case 'e-mail':
        key = 'EMAIL;TYPE=internet;'
        break;
      default:
        break;
    }
    switch ($($(this).find('span[id]')[0]).text().split(' ')[1]) {
      case 'geschäftlich':
      case 'WRK':
        key += 'TYPE=work;';
        break;
      case 'privat':
        key += 'TYPE=home;';
        break;
      default:
        break;
    }
    if (key) {  // ignore Notruf Pager
      var point = {};
      var value = $($(this).find('span[id]')[1]).text().trim();
      if($.inArray(value, values)<0 && (!key.startsWith("TEL") || /\d/.test(value))) {  // deduplication && and very stupid validation
        point['k'] = key.substring(0, key.length - 1);
        point['v'] = value;
        point['default'] = $(this).find('input[type=radio]').first().is(':checked');
        contactPoints.push(point);
        values.push(value);
      }
    }
  });
  return contactPoints;
}

