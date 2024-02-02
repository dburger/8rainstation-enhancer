// NOTE: This is not done as a module (with export, for example) because
// content scripts can't easily import modules. Thus this is done as shared
// Javascript with:
//
// 1) The manifest listing this file as one of the files for content-script.js
// 2) The background.js file importing this file with the importScripts call

// NOTE: We use callbacks instead of async/await within this project because
// content-scripts can't import modules easily and things get a little wonky
// when using async/await from non-module code. Thus instead of mixing
// approaches, we just use callbacks exclusively.

// TODO(dburger): javascript enums or other approach?
const CLOSE_SPORTSBOOK_TABS = "closeSportsBookTabs";

const bookDetail = (urlTemplate) => {
  const url = new URL(urlTemplate);
  return {
    domain: url.hostname,
    urlTemplate: urlTemplate
  };
};

const makeSettings = () => {
  return {
    settings: {
      "BetMGM": bookDetail("https://sports.az.betmgm.com/en/sports"),
      "BetRivers": bookDetail("https://az.betrivers.com"),
      // TODO(dburger): do we need multiple details here?
      // books.push("https://www.playdesertdiamond.com/en/sports#home");
      // books.push("https://az.unibet.com/sports#home");
      "Betway": bookDetail("https://az.betway.com/sports/home"),
      "Caesars": bookDetail("https://sportsbook.caesars.com/us/az/bet/"),
      "ESPN Bet": bookDetail("https://espnbet.com/search?searchTerm=${homeTeam}"),
      "Fliff": bookDetail("https://sports.getfliff.com/"),
      "Hard Rock Bet": bookDetail("https://app.hardrock.bet"),
      "FanDuel": bookDetail("https://sportsbook.fanduel.com/search?q=${homeTeam}"),
      "DraftKings": bookDetail("https://sportsbook.draftkings.com/"),
      "Pinnacle": bookDetail("https://www.pinnacle.com/en/search/${homeTeam}"),
      "SuperBook": bookDetail("https://az.superbook.com/sports"),
      "WynnBET": bookDetail("https://bet.wynnbet.com/sports/us/sports/recommendations")
    }
  };
};

const DEFAULT_SETTINGS = makeSettings();

const getSettings = (callback) => {
  chrome.storage.sync.get(DEFAULT_SETTINGS, callback);
}

const setSettings = (callback) => {
  chrome.storage.sync.set(makeSettings(), callback);
}

const insertAfter = (newElem, elem) => {
  elem.parentElement.insertBefore(newElem, elem.nextSibling);
};

const walkUp = (elem, pred) => {
  if (pred(elem)) {
    return elem;
  }
  return elem.parentElement ? walkUp(elem.parentElement, pred) : null;
}

const walkDown = (elem, pred) => {
  if (pred(elem)) {
    return elem;
  }
  // TODO(dburger): This is depth first, perhaps switch this to breadth first.
  for (child of elem.childNodes) {
    const result = walkDown(child, pred);
    if (result) {
      return result;
    }
  }
  return null;
}
