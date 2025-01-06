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
const OPEN_SPORTSBOOK_TABS = "openSportsBookTabs";
const OPEN_OPTIONS_TAB = "openOptionsTab";

class GameInfo {
    constructor(homeTeam, sport, league) {
        this.homeTeam = homeTeam;
        this.sport = sport;
        this.league = league;
    }
}

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
 * @param showMeg {boolean} - Whether to show Maximum Expected Growth calculations next to Expected Value calculations.
 * @param notifyPlays {boolean} - Whether to do audio notifications on the existence of plays on the plays page.
 * @param playmarkDetailsMap {{string: playmarkDetail}} - The map of playmark names to playmark details to store.
 * @param bookDetailsMap {{string: bookDetail}} - The map of book names to book details to store.

 * @param bookLinkTarget {string} - The indicator of how to load a book link.
 * @returns {{v2: {showMeg, notifyPlays, playmarksMap, bookDetailsMap, bookLinkTarget}}} - Serializable JSON
 *     object for settings storage.
 */
const makeVersionedSettings = (showMeg, notifyPlays, playmarkDetailsMap, bookDetailsMap, bookLinkTarget) => {
  return {
    v2: {
      showMeg: showMeg,
      notifyPlays: notifyPlays,
      playmarkDetailsMap: playmarkDetailsMap,
      bookDetailsMap: bookDetailsMap,
      bookLinkTarget: bookLinkTarget
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
    ["Betfred", "Betfred", "https://az.betfredsports.com/"],
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
    ["WynnBET", "WynnBET", "https://bet.wynnbet.com/sports/us/sports/recommendations"]
]);

const BOOK_LINK_TARGET_NEW_TAB = "new tab";
const BOOK_LINK_TARGET_BOOK_TAB = "book tab";
// TODO(dburger): oh Javascript freeze me.
const BOOK_LINK_TARGET_OPTIONS = [BOOK_LINK_TARGET_NEW_TAB, BOOK_LINK_TARGET_BOOK_TAB];

const DEFAULT_BOOK_LINK_TARGET = BOOK_LINK_TARGET_NEW_TAB;

const DEFAULT_SETTINGS = makeVersionedSettings(
    false,
    false,
    DEFAULT_PLAYMARK_DETAILS_MAP,
    DEFAULT_BOOK_DETAILS_MAP,
    DEFAULT_BOOK_LINK_TARGET);

/**
 * Fetches the settings and returns them in the callback.
 *
 * @param callback {function(settings)} - The callback to invoke with the settings.
 */
const getSettings = (callback) => {
  chrome.storage.sync.get({v1: {}, v2: {}}, (settings) => {
    settings = migrateSettings(settings);
    callback(settings.v2);
  });
};

/**
 * Examines settings and returns the equivalent for the current version. If settings
 * is already in the current version form, it is returned unchanged.
 *
 * @param settings {Object} - settings object, possibly of a prior version
 * @returns {{v2: {playmarksMap, bookDetailsMap, bookLinkTarget}}}
 */
const migrateSettings = (settings) => {
  if (Object.keys(settings.v2).length > 0) {
      // settings is already what we want.
  } else if (Object.keys(settings.v1).length > 0) {
      // Transition from v1 to v2. We'll continue to do this translation until they save new settings.
      // At that time we'll delete settings.v1 and store settings.v2.
      settings = makeVersionedSettings(false, false, settings.v1.playmarkDetailsMap, settings.v1.bookDetailsMap, DEFAULT_BOOK_LINK_TARGET);
  } else {
      settings = DEFAULT_SETTINGS;
  }
  return settings;
};

/**
 * Stores the settings and indicates the result via the callback.
 *
 * @param showMeg {boolean} - Whether to show Maximum Expected Growth calculations next to Expected Value calculations.
 * @param notifyPlays {boolean} - Whether to do audio notifications on the existence of plays on the plays page.
 * @param playmarkDetailsMap {{string: playmarkDetail}} - The map of playmark names to playmark details to store.
 * @param bookDetailsMap {{string: bookDetail}} - The map of book names to book details to store.
 * @param bookLinkTarget {string} - The indicator of how to load a book link.
 * @param callback {() => void} - The callback invoked after the settings have been set.
 */
const setVersionedSettings = (showMeg, notifyPlays, playmarkDetailsMap, bookDetailsMap, bookLinkTarget, callback) => {
  const settings = makeVersionedSettings(showMeg, notifyPlays, playmarkDetailsMap, bookDetailsMap, bookLinkTarget);
  chrome.storage.sync.remove("v1", () => {
      if (chrome.runtime.lastError) {
          console.error("Failed to delete settings version v1.");
          console.error(chrome.runtime.lastError.message);
      }
  });
  syncSettings(settings, callback);
};

/**
 * Syncs fully realized settings to storage.
 *
 * @param settings {{v2: {playmarksMap, bookDetailsMap, bookLinkTarget}}} - Fully realized settings
 * @param callback {() => void} - The callback invoked after the settings have been set.
 */
const syncSettings = (settings, callback) => {
  chrome.storage.sync.set(settings, callback);
};

/**
 * Translates and stores the given settings as called from the settings page.
 *
 * @param showMeg {boolean} - Whether to show Maximum Expected Growth calculations next to Expected Value calculations.
 * @param notifyPlays {boolean} - Whether to do audio notifications on the existence of plays on the plays page.
 * @param playmarkDetails {[[string, string, string]]} - The playmark details
 *     in the form of [text key, sort position, target URL].
 * @param bookDetails {[string, string, string]} - The name, odds group, URL template details to store
 *     in the book details map.
 * @param bookLinkTarget {string} - The indicator of how to load a book link.
 * @param callback {() => void} - The callback invoked after the settings have been set.
 */
const setSettings = (showMeg, notifyPlays, playmarkDetails, bookDetails, bookLinkTarget, callback) => {
  // TODO(dburger): why is settings fetched here? This is obviously not right. It doesn't appear this is necessary.
  // Need to research and remove this fetch.
  getSettings(settings => {
    const playmarkDetailsMap = makePlaymarkDetailsMap(playmarkDetails);
    const bookDetailsMap = makeBookDetailsMap(bookDetails);
    setVersionedSettings(showMeg, notifyPlays, playmarkDetailsMap, bookDetailsMap, bookLinkTarget, callback);
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
        settings.playmarkDetailsMap[name] = playmarkDetail(Object.keys(settings.playmarkDetailsMap).length, playmark);
        setVersionedSettings(settings.playmarkDetailsMap, settings.bookDetailsMap, settings.bookLinkTarget, callback);
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
