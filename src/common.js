// NOTE: This is not done as a module (with export, for example) because
// content scripts can't easily import modules. Thus, this is done as shared
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
const OPEN_OPTIONS_TAB = "openOptionsTab";

/**
 * Returns a book detail object. This is used in the serialization of the
 * settings and is the value in the {@link bookDetailsMap}.
 *
 * @param oddsGroup {string} - The odds group the book belongs to. An odds group
 *     has the same odds.
 * @param urlTemplate {string} - The URL template for launching the sportsbook on
 *     a given bet.
 * @returns {{hostname: string, oddsGroup: string, urlTemplate: string}} - The
 *     book detail object.
 */
const bookDetail = (oddsGroup, urlTemplate) => {
  const url = new URL(urlTemplate);
  return {
    hostname: url.hostname,
    oddsGroup: oddsGroup,
    urlTemplate: urlTemplate
  };
};

const makeBookDetailsMap = (bookDetails) => {
  const result = {};
  for (const bd of bookDetails) {
    result[bd[0]] = bookDetail(bd[1], bd[2]);
  }
  return result;
};

const makeVersionedSettings = (bookDetailsMap, activeBooksMap, activeBookWeightingsMap) => {
  return {
    v1: {
      bookDetailsMap: bookDetailsMap,
      activeBooksMap: activeBooksMap,
      activeBookWeightingsMap: activeBookWeightingsMap
    }
  };
};

const DEFAULT_BOOK_DETAILS_MAP = makeBookDetailsMap([
    ["BetMGM", "BetMGM", "https://sports.az.betmgm.com/en/sports"],
    ["BetRivers", "Kambi", "https://az.betrivers.com"],
    ["Bally Bet", "Kambi", "https://play.ballybet.com/sports#sports/a-z"],
    ["Betway", "Betway", "https://az.betway.com/sports/home"],
    ["Bovada", "Bovada", "https://www.bovada.lv/sports"],
    ["Caesars", "Caesars", "https://sportsbook.caesars.com/us/az/bet/"],
    ["Desert Diamond", "Kambi", "https://www.playdesertdiamond.com/en/sports/home"],
    ["ESPN Bet", "ESPN Bet", "https://espnbet.com/search?searchTerm=${homeTeam}"],
    ["Fliff", "Fliff", "https://sports.getfliff.com/"],
    ["Hard Rock Bet", "Hard Rock Bet", "https://app.hardrock.bet"],
    ["FanDuel", "FanDuel", "https://sportsbook.fanduel.com/search?q=${homeTeam}"],
    ["DraftKings", "DraftKings", "https://sportsbook.draftkings.com/"],
    ["Pinnacle", "Pinnacle", "https://www.pinnacle.com/en/search/${homeTeam}"],
    ["SuperBook", "SuperBook", "https://az.superbook.com/sports"],
    ["Unibet", "Kambi", "https://az.unibet.com/sports#home"],
    ["WynnBET", "WynnBET", "https://bet.wynnbet.com/sports/us/sports/recommendations"]
]);

const DEFAULT_ACTIVE_BOOKS_MAP = {};
const DEFAULT_ACTIVE_BOOK_WEIGHTINGS_MAP = {};

const DEFAULT_SETTINGS = makeVersionedSettings(
    DEFAULT_BOOK_DETAILS_MAP,
    DEFAULT_ACTIVE_BOOKS_MAP,
    DEFAULT_ACTIVE_BOOK_WEIGHTINGS_MAP);

const getSettings = (callback) => {
  chrome.storage.sync.get({v1: {}}, (s) => {
    const settings = Object.keys(s.v1).length === 0 ? DEFAULT_SETTINGS.v1 : s.v1;
    callback(settings);
  });
}

const setVersionedSettings = (bookDetailsMap, activeBooksMap, activeBookWeightingsMap, callback) => {
  const settings = makeVersionedSettings(bookDetailsMap, activeBooksMap, activeBookWeightingsMap);
  chrome.storage.sync.set(settings, callback);
}

const setSettings = (bookDetails, activeBooksNames, activeBookWeightingsNames, callback) => {
  getSettings(settings => {
    const bookDetailsMap = makeBookDetailsMap(bookDetails);
    const activeBooksMap = keepKeys2(settings.activeBooksMap, activeBooksNames);
    const activeBookWeightingsMap = keepKeys2(settings.activeBookWeightingsMap, activeBookWeightingsNames);
    setVersionedSettings(bookDetailsMap, activeBooksMap, activeBookWeightingsMap, callback);
  });
}

const setActiveBooks = (name, activeBooks, callback) => {
  getSettings(settings => {
    settings.activeBooksMap[name] = activeBooks;
    setVersionedSettings(settings.bookDetailsMap, settings.activeBooksMap, settings.activeBookWeightingsMap, callback);
  });
};

const setBookWeightings = (name, weightings, callback) => {
    getSettings(settings => {
        settings.activeBookWeightingsMap[name] = weightings;
        setVersionedSettings(settings.bookDetailsMap, settings.activeBooksMap, settings.activeBookWeightingsMap, callback);
    });
};

const keepKeys1 = (obj, keys) => {
  for (const key of Object.keys(obj)) {
    if (!keys.includes(key)) {
      delete obj[key];
    }
  }
  return obj;
};

const keepKeys2 = (obj, keys) => {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
};

const objectToString = (obj) => {
    const parts = [];
    for (const [key, value] of Object.entries(obj)) {
        parts.push(`${key}: ${value}`);
    }
    return parts.join(", ");
};

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
  for (const child of elem.childNodes) {
    const result = walkDown(child, pred);
    if (result) {
      return result;
    }
  }
  return null;
}

/**
 * Takes the given id and returns a uniqueified id. The intention here is
 * to avoid all DOM id collisions as to not disrupt any existing page
 * Javascript.
 *
 * @param id {string} - The id to uniqueify.
 * @returns {string} - The uniqueified id.
 */
const idgen = (id) => {
  // 8rain Station Enhancer.
  return "8rse-" + id;
};
