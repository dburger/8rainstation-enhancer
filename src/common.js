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

const CLOSE_SPORTSBOOK_TABS = "closeSportsBookTabs";
const OPEN_OPTIONS_TAB = "openOptionsTab";

/**
 * Returns a playmark detail object.
 *
 * @param position {number} - The sort order position for the playmark.
 * @param playmark {string} - The target URL for the playmark.
 * @returns {{playmark, position}} - The playmark detail object.
 */
const playmarkDetail = (position, playmark) => {
    return {
        position: position,
        playmark: playmark
    };
};

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

/**
 * Creates a playmark details map from the input playmark details.
 *
 * @param playmarkDetails {[[string, string, string]]} - The playmark details
 *     in the form of [text key, sort position, target URL].
 *
 * @returns {{string: {position: number, playmark: string}}} - The created
 *     playmark details map.
 */
const makePlaymarkDetailsMap = (playmarkDetails) => {
    const result = {};
    for (const pd of playmarkDetails) {
        result[pd[0]] = playmarkDetail(pd[1], pd[2]);
    }
    return result;
}

/**
 * Creates a book details map from the input book details.
 *
 * @param bookDetails {[[string, string, string]]} - The book details in the
 * form of [text key, odds group, URL template].
 *
 * @returns {{string: {hostname: string, oddsGroup: string, urlTemplate: string}}} -
 *     The created book details map.
 */
const makeBookDetailsMap = (bookDetails) => {
  const result = {};
  for (const bd of bookDetails) {
    result[bd[0]] = bookDetail(bd[1], bd[2]);
  }
  return result;
};

/**
 * Creates and returns the JSON serializable object used for storing settings.
 *
 * @param playmarkDetailsMap {{string: playmarkDetail}} - The map of playmark names to playmark details to store.
 * @param bookDetailsMap {{string: bookDetail}} - The map of book names to book details to store.
 * @param activeBooksMap {{string: string[]}} - The map of names to active books for that name to store.
 * @param activeBookWeightingsMap {{string: {string: number}}} - The map of names to book weightings maps to store.
 * @returns {{v1: {playmarksMap, activeBooksMap, bookDetailsMap, activeBookWeightingsMap}}} - Serializable JSON
 *     object for settings storage.
 */
const makeVersionedSettings = (playmarkDetailsMap, bookDetailsMap, activeBooksMap, activeBookWeightingsMap) => {
  return {
    v1: {
      playmarkDetailsMap: playmarkDetailsMap,
      bookDetailsMap: bookDetailsMap,
      activeBooksMap: activeBooksMap,
      activeBookWeightingsMap: activeBookWeightingsMap
    }
  };
};

const DEFAULT_PLAYMARK_DETAILS_MAP = makePlaymarkDetailsMap([
    ["5/0", 0, "/search/plays?search=&group=Y&bet=Y&ways=1&ev=5&arb=0&sort=1&max=250&width=6.5%25&weight=0&days=7"],
    ["3/2", 1, "/search/plays?search=&group=Y&bet=Y&ways=1&ev=3&arb=0&sort=1&max=250&width=6.5%25&weight=2&days=7"],
    ["BOA", 2, "/search/plays?search=BetOnline&group=Y&bet=Y&ways=2&ev=0&arb=0&sort=2&max=250&width=&weight=&days=7"],
    ["PYA", 3, "/search/plays?search=Pinnacle&group=Y&bet=Y&ways=2&ev=0&arb=0&sort=2&max=250&width=&weight=&days=7"]
]);

const DEFAULT_BOOK_DETAILS_MAP = makeBookDetailsMap([
    ["BetMGM", "BetMGM", "https://sports.az.betmgm.com/en/sports"],
    ["BetRivers", "Kambi", "https://az.betrivers.com"],
    ["Bally Bet", "Kambi", "https://play.ballybet.com/sports#sports/a-z"],
    ["BetUS", "BetUS", "https://www.betus.com.pa/sportsbook/search/?search=${homeTeam}"],
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
    DEFAULT_PLAYMARK_DETAILS_MAP,
    DEFAULT_BOOK_DETAILS_MAP,
    DEFAULT_ACTIVE_BOOKS_MAP,
    DEFAULT_ACTIVE_BOOK_WEIGHTINGS_MAP);

/**
 * Fetches the settings and returns them in the callback.
 *
 * @param callback {function(settings)} - The callback to invoke with the settings.
 */
const getSettings = (callback) => {
  chrome.storage.sync.get({v1: {}}, (s) => {
    const settings = Object.keys(s.v1).length === 0 ? DEFAULT_SETTINGS.v1 : s.v1;
    callback(settings);
  });
}

/**
 * Stores the settings and indicates the result via the callback.
 *
 * @param playmarkDetailsMap {{string: playmarkDetail}} - The map of playmark names to playmark details to store.
 * @param bookDetailsMap {{string: bookDetail}} - The map of book names to book details to store.
 * @param activeBooksMap {{string: string[]}} - The map of names to active books for that name to store.
 * @param activeBookWeightingsMap {{string: {string: number}}} - The map of names to book weightings maps to store.
 * @param callback {() => void} - The callback invoked after the settings have been set.
 */
const setVersionedSettings = (playmarkDetailsMap, bookDetailsMap, activeBooksMap, activeBookWeightingsMap, callback) => {
  const settings = makeVersionedSettings(playmarkDetailsMap, bookDetailsMap, activeBooksMap, activeBookWeightingsMap);
  chrome.storage.sync.set(settings, callback);
}

/**
 * Translates and stores the given settings as called from the settings page.
 *
 * @param playmarksNames {string[]} - The names of the playmarks to keep. All others will be removed.
 * @param bookDetails {[string, string, string]} - The name, odds group, URL template details to store
 *     in the book details map.
 * @param activeBooksNames {string[]} - The names of the active book groupings to keep.
 * @param activeBookWeightingsNames {string[]} - The names of the book weightings to keep.
 * @param callback {() => void} - The callback invoked after the settings have been set.
 */
const setSettings = (playmarkDetails, bookDetails, activeBooksNames, activeBookWeightingsNames, callback) => {
  getSettings(settings => {
    const playmarkDetailsMap = makePlaymarkDetailsMap(playmarkDetails);
    const bookDetailsMap = makeBookDetailsMap(bookDetails);
    const activeBooksMap = keepKeys2(settings.activeBooksMap, activeBooksNames);
    const activeBookWeightingsMap = keepKeys2(settings.activeBookWeightingsMap, activeBookWeightingsNames);
    setVersionedSettings(playmarkDetailsMap, bookDetailsMap, activeBooksMap, activeBookWeightingsMap, callback);
  });
}

/**
 * Stores the given name to active books mapping into the settings.
 *
 * @param name {string} - The name to give the mapping.
 * @param activeBooks {string[]} - The array of active books for the name.
 * @param callback {() => void} - The callback invoked after the settings have been set.
 */
const setActiveBooks = (name, activeBooks, callback) => {
  getSettings(settings => {
    settings.activeBooksMap[name] = activeBooks;
    setVersionedSettings(settings.playmarkDetailsMap, settings.bookDetailsMap, settings.activeBooksMap, settings.activeBookWeightingsMap, callback);
  });
};

/**
 * Stores the given name to book weightings mapping into the settings.
 *
 * @param name {string} - The name to give the mapping.
 * @param weightings {{string: number}} - The mapping of book names to
 *     weightings to store for the name.
 * @param callback {() => void} - The callback invoked after the settings have been set.
 */
const setBookWeightings = (name, weightings, callback) => {
    getSettings(settings => {
        settings.activeBookWeightingsMap[name] = weightings;
        setVersionedSettings(settings.playmarkDetailsMap, settings.bookDetailsMap, settings.activeBooksMap, settings.activeBookWeightingsMap, callback);
    });
};

/**
 * Stores the given name to playmark into the settings.
 *
 * @param name {string} - The name to give the playmark.
 * @param playmark {string} - The playmark to store for the name.
 * @param callback {() => void} - The callback invoked after the settings have been set.
 */
const addPlaymark = (name, playmark, callback) => {
    getSettings(settings => {
        const details = playmarkDetail(Object.keys(settings.playmarkDetailsMap).length, playmark);
        settings.playmarkDetailsMap[name] = details;
        setVersionedSettings(settings.playmarkDetailsMap, settings.bookDetailsMap, settings.activeBooksMap, settings.activeBookWeightingsMap, callback);
    });
};

/**
 * Sort function to play playmark entries in position order.
 *
 * @param a {object} - The playmarkDetailsMap entry a.
 * @param b {object} - The playmarkDetailsMap entry b.
 * @returns {number} - The value indicating the sort order.
 */
const sortPlaymarkEntries = (a, b) => {
    return a[1].position - b[1].position;
};

/**
 * Modifies and returns the given object keeping only the indicated keys.
 *
 * @param obj {object} - The object to modify.
 * @param keys {string[]} - The keys to keep.
 * @returns {object} - The modified object.
 */
const keepKeys1 = (obj, keys) => {
  for (const key of Object.keys(obj)) {
    if (!keys.includes(key)) {
      delete obj[key];
    }
  }
  return obj;
};

/**
 * Creates and returns a copy of the given object keeping only the
 * indicated keys.
 *
 * @param obj {object} - The source object to copy.
 * @param keys {string[]} - The keys to keep.
 * @returns {{string: any}} - The copied object.
 */
const keepKeys2 = (obj, keys) => {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
};

/**
 * Creates and returns a string representation of the given object. The
 * form of the output is "key: value, ..." The output is "flat." That is
 * there is no recursion down to attempt to render nested keys.
 *
 * @param obj {object} - The object to return a string representation of.
 * @returns {string} - The string representation of object.
 */
const objectToString = (obj) => {
    const parts = [];
    for (const [key, value] of Object.entries(obj)) {
        parts.push(`${key}: ${value}`);
    }
    return parts.join(", ");
};

/**
 * Inserts the new element after the existing element.
 *
 * @param newElem {HTMLElement} - The new element to insert.
 * @param elem {HTMLElement} - The existing element to insert after.
 */
const insertAfter = (newElem, elem) => {
  elem.parentElement.insertBefore(newElem, elem.nextSibling);
};

/**
 * Inserts the new element before the existing element.
 *
 * @param newElem {HTMLElement} - The new element to insert.
 * @param elem {HTMLElement} - The existing element to insert before.
 */
const insertBefore = (newElem, elem) => {
    elem.parentElement.insertBefore(newElem, elem);
}

/**
 * Walks up the dom tree starting at elem looking for the first element that
 * satisfies the predicate.
 *
 * @param elem {HTMLElement} - The DOM element to start the search at.
 * @param pred {function(HTMLElement)} - The predicate that checks for a matching element.
 * @returns {HTMLElement|null} - The matching element, or null if no such element is found.
 */
const walkUp = (elem, pred) => {
  if (pred(elem)) {
    return elem;
  }
  return elem.parentElement ? walkUp(elem.parentElement, pred) : null;
}

/**
 * Walks down the dom tree starting at elem looking for the first element that
 * satisfies the predicate.
 *
 * @param elem {HTMLElement} - The DOM element to start the search at.
 * @param pred {function(HTMLElement)} - The predicate that checks for a matching element.
 * @returns {HTMLElement|null} - The matching element, or null if no such element is found.
 */
const walkDown = (elem, pred) => {
  if (pred(elem)) {
    return elem;
  }
  // This is depth first, breadth first might be nice but would a nice queue
  // implementation. This is shallow enough probably doesn't matter.
  for (const child of elem.childNodes) {
    const result = walkDown(child, pred);
    if (result) {
      return result;
    }
  }
  return null;
}
