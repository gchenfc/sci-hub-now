// Old and less strict DOI regex.
// const doiRegex = "10.\\d{4,9}/[-._;()/:a-z0-9A-Z]+";
const doiRegex = new RegExp(
  /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/
);
const doiRegexHref = new RegExp(
  /\ba\b[^<]*href\s*=\s*"[^"]*?\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b[^"]*?"/
);
const trueRed = "#BC243C";

// Variable management constants
var sciHubUrl;
var autodownload = false;
var autoname = false;
var openInNewTab = false;
var autoCheckServer = true;
const defaults = {
  "autodownload": false,
  "scihub-url": "https://sci-hub.se/",
  "autoname": false,
  "open-in-new-tab": false,
  "autocheck-server": true
};
// Variable management functions
function printVars() {
  console.log("sciHubUrl: " + sciHubUrl +
    "\nautodownload: " + autodownload +
    "\nautoname: " + autoname +
    "\nopenInNewTab: " + openInNewTab +
    "\nautoCheckServer: " + autoCheckServer);
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      setvariable(key, newValue);
      console.log(`Changed "${key}" from "${oldValue}" to "${newValue}".`);
    }
  }
});
function setvariable(name, value) {
  switch (name) {
    case "scihub-url":
      sciHubUrl = value;
      break;
    case "autodownload":
      autodownload = value;
      break;
    case "autoname":
      autoname = value;
      break;
    case "open-in-new-tab":
      openInNewTab = value;
      break;
    case "autocheck-server":
      autoCheckServer = value;
      break;
  }
  console.log("setvariable called!!!");
  printVars();
}
function initialize(name, value) {
  console.log("initializing " + name + ": " + value);
  setvariable(name, value);
}

// Variable Initialization
chrome.runtime.onInstalled.addListener(function (details) {
  // Set variables to default if they don't already exist
  chrome.storage.local.get(defaults, function (result) {
    console.log("Initializing variables onInstalled: ", result);
    chrome.storage.local.set(result); // for if variables were not set
  });
});
chrome.storage.local.get(defaults, function (result) {
  for (const property in result) {
    initialize(property, result[property]);
  }
});
// Special case: permission revoked:
var tmpPermissions;
chrome.permissions.onRemoved.addListener(function (permissions) {
  console.log("permissions revoked!!!", permissions)
  tmpPermissions = permissions;
  for (var origin of permissions.origins) {
    origin = origin.replaceAll("*", ".*"); // to match regex syntax
    console.log(origin, getApiQueryUrl("", ""));
    if (getApiQueryUrl("", "").match(origin)) {
      alert("You've removed the permission for \"Sci-Hub X Now!\" to access the doi metadata query service by https://doi.crossref.org." +
        "\nThe auto-naming feature will now be disabled but other functionality" + (autodownload ? " (including auto-downloading) " : " ") + "will continue to work." +
        "\nYou may re-enable auto-naming at any time by going to the options page (right click the extension icon and click \"Options\") then selecting the \"Auto-name downloaded pdf's\" checkbox.");
      chrome.storage.local.set({ "autoname": false });
    }
    if (sciHubUrl.match(origin)) {
      alert("You've removed the permission for \"Sci-Hub X Now!\" to access the sci hub url: `" + sciHubUrl + "`." +
        "\nThe auto-download feature will now be disabled but redirecting doi's to sci-hub will continue to work." +
        "\nYou may re-enable auto-downloading at any time by going to the options page (right click the extension icon and click \"Options\") then selecting the \"Auto-download pdf's\" checkbox.");
      chrome.storage.local.set({ "autodownload": false });
    }
  }
  for (const permission of permissions.permissions) {
    if (permission === "downloads") {
      alert("You've removed the permission for \"Sci-Hub X Now!\" to automatically download files." +
        "\nThe auto-download feature will now be disabled but redirecting doi's to sci-hub will continue to work." +
        "\nYou may re-enable auto-downloading at any time by going to the options page (right click the extension icon and click \"Options\") then selecting the \"Auto-download pdf's\" checkbox.");
      chrome.storage.local.set({ "autodownload": false });
    }
  }
});

// Check server alive status
function checkServerStatus() {
  var img = document.body.appendChild(document.createElement("img"));
  img.height = 0;
  img.visibility = "hidden";
  img.onerror = function () {
    if (confirm("Looks like the mirror " + sciHubUrl + " is dead.  Would you like to go to the options page to select a different mirror?")) {
      browser.tabs.create({ url: 'chrome://extensions/?options=' + chrome.runtime.id }).then();
    }
  }
  img.src = sciHubUrl + "/misc/img/raven_1.png";
}

// Automatic file name lookup & pdf downloading
function httpGet(theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false); // false for synchronous request
  xmlHttp.send(null);
  return xmlHttp.responseText;
}
function getApiQueryUrl(doi, email) {
  return 'https://doi.crossref.org/servlet/query' + '?pid=' + email + '&id=' + doi;
}
function createFilenameFromMetadata(md) {
  if (!md)
    return undefined;
  return md.authorlastname + md.yearmod100 + md.shortvenue + "_" + md.shorttitle + '.pdf';
}
function downloadPaper(link, fname, scihublink) {
  console.log("Downloading " + link + " as " + fname);
  chrome.downloads.download({
    url: link,
    filename: fname
  }, (downloadId) => {
    if (!downloadId) {
      alert("Download failed - redirecting to sci-hub...");
      redirectToScihub(scihublink);
    } else {
      setTimeout(() => {
        chrome.downloads.search({ id: downloadId }, (results) => {
          console.log(results, results[0].bytesReceived);
          console.log(results, results[0].bytesReceived);
          if (!results || !results[0].bytesReceived) {
            alert("Download is very slow.\nSuspected failure downloading.\nRedirecting to sci-hub...");
            redirectToScihub(scihublink);
          }
        });
      }, 500);
    }
  });
}
function redirectToScihub(destUrl) {
  if (openInNewTab) {
    var creatingTab = browser.tabs.create({ url: destUrl });
    creatingTab.then();
  } else {
    browser.tabs.update(undefined, { url: destUrl });
  }
}

// Primary callback upon icon click
function getHtml(htmlSource) {
  htmlSource = htmlSource[0];
  foundRegex = htmlSource.match(doiRegexHref);
  if (foundRegex) {
    var doi = foundRegex[1].split(";")[0];
    var destUrl = sciHubUrl + doi;
    // console.log("Regex: " + foundRegex);
    if (autodownload) {
      var metadata = undefined;
      if (autoname) {
        const email = 'gchenfc.developer@gmail.com';
        var contents = httpGet(getApiQueryUrl(doi, email));
        console.log(contents);
        metadata = extractMetadata(contents);
        console.log(metadata);
      }
      var pdfLink = '';
      try {
        pdfLink = getPdfDownloadLink(httpGet(destUrl));
      } catch (e) {
        alert("Download failed - redirecting to sci-hub...");
        redirectToScihub(destUrl);
        return;
      }
      console.log(pdfLink);
      downloadPaper(pdfLink, createFilenameFromMetadata(metadata), destUrl);
    } else {
      redirectToScihub(destUrl);
    }
    if (autoCheckServer) {
      checkServerStatus();
    }
  } else {
    // browser.browserAction.setBadgeTextColor({ color: "white" });
    browser.browserAction.setBadgeBackgroundColor({ color: trueRed });
    browser.browserAction.setBadgeText({ text: ":'(" });
  }
}

// Icon click
function executeJs() {
  const executing = browser.tabs.executeScript({
    code: "document.body.innerHTML",
  });
  executing.then(getHtml);
}
browser.browserAction.onClicked.addListener(executeJs);

// Context menus (right click)
browser.contextMenus.create({
  id: "doi-selection",
  title: "Find article by DOI!",
  contexts: ["selection", "link"],
});
browser.contextMenus.onClicked.addListener((info, tab) => {
  // if right-clicked on link, then parse link address first
  var doi = info.linkUrl;
  doi = doi ? doi.match(doiRegex)[0].split(";")[0] : doi;
  // if link not valid, try the highlighted text
  if (!doi) {
    doi = info.selectionText;
  }
  var creatingTab = browser.tabs.create({
    url: sciHubUrl + doi,
  });
});

// Badge stuff
function resetBadgeText() {
  browser.browserAction.setBadgeText({ text: "" });
}
browser.tabs.onUpdated.addListener(resetBadgeText);
