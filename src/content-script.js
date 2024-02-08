// As I understand it, content scripts cannot work as modules. This prevents us
// from using async / await. Thus, the settings are retrieved here with a callback
// instead of on demand when needed. If this page changes to need some of the
// settings on initialization, that code will have to be moved into this callback.
// For now, initialization like adding the custom links, lives outside this callback.
let settings = null;

getSettings(s => settings = s);

const ARB_URL = "/search/plays?search=Pinnacle&group=Y&bet=Y&ways=2&ev=0&arb=0&sort=2&max=250&width=&weight=&days=";

/**
 * Returns whether or not the current page is the plays page.
 *
 * @returns {boolean}
 */
const isPlaysPage = () => {
  return window.location.href.includes("/search/plays");
};

/**
 * Returns whether or not the current page is the events page.
 *
 * @returns {boolean}
 */
const isEventsPage = () => {
  return window.location.href.match(/^.*\/events\/?$/);
};

/**
 * Returns whether or not the current page is the books page.
 *
 * @returns {boolean}
 */
const isBooksPage = () => {
  return window.location.href.match(/^.*\/settings\/books\/?$/);
};

/**
 * Returns whether or not the current page is the weightings page.
 *
 * @returns {boolean}
 */
const isWeightingsPage = () => {
  return window.location.href.match(/^.*\/settings\/weightings\/?$/);
};

/**
 * Returns whether or not the current page is the wagers page.
 *
 * @returns {boolean}
 */
const isWagersPage = () => {
  return window.location.href.includes("/wagers/");
};

/**
 * Returns whether or not the current page is the settings page.
 *
 * @returns {boolean}
 */
const isSettingsPage = () => {
  return window.location.href.match(/^.*\/settings\/?$/);
};

/**
 * Returns whether or not the current page is the bet market details page.
 *
 * @returns {boolean}
 */
const isBetMarketDetailsPage = () => {
  return window.location.href.match(/^.*\/events\/.+$/);
}

const getHomeTeam = (elem) => {
  // Plays page.
  const div = walkUp(elem, (e) => e.tagName === "DIV" && e.className === "play");
  if (div) {
    const gdiv = walkDown(div, (e) => e.tagName === "DIV" && e.className === "game_name");
    if (gdiv) {
      const parts = gdiv.innerText.split(" at ");
      if (parts.length === 2) {
        return parts[1];
      }
    }
  }

  // Book Market Details page.
  const divs = document.querySelectorAll("div.event-team");
  if (divs.length === 2) {
    return divs[1].innerText;
  }

  return null;
};

/**
 * Creates and returns a clickable navigation div.
 *
 * @param id {number|string} - The id attribute to apply to the div element.
 * @param href {string} - The href for the link included in the div element.
 * @param text {string} - The text to display within the link in the div element.
 * @returns {HTMLDivElement} - The clickable navigation div.
 */
const navDiv = (id, href, text) => {
  const a = document.createElement("a");
  a.setAttribute("href", href);
  a.appendChild(document.createTextNode(text));

  const div = document.createElement("div");
  div.setAttribute("id", id);
  div.setAttribute("class", "nav enhancer");
  div.appendChild(a);

  return div;
};

/**
 * Returns the minimum +EV URL for the given minimum +EV.
 *
 * @param minEv {number} - The minimum +EV to set in the URL.
 * @returns {string} - The URL for the given minimum +EV.
 */
const minEvUrl = (minEv) => {
  return `/search/plays?search=&group=Y&bet=Y&ways=1&ev=${minEv}&arb=0&sort=1&max=250&width=6.5%25&weight=0&days=7`;
};

/**
 * Creates and returns the clickable navigation div for minimum EV plays.
 *
 * @param minEv {number} - The minimum EV of plays to display.
 * @param text {number|string} - The text to display in the link.
 * @returns {HTMLDivElement} - The clickable navigation div.
 */
const minEvPlaysDiv = (minEv, text) => {
  return navDiv(minEv, minEvUrl(minEv), text);
};

/**
 * Creates and returns the clickable navigation div for arb plays.
 *
 * @returns {HTMLDivElement} - The clickable navigation div.
 */
const arbPlaysDiv = () => {
  return navDiv("arb", ARB_URL, "A");
};

// TODO(dburger: DRY the next two.

/**
 * Creates and returns the clickable div for closing all sportsbook tabs.
 *
 * @returns {HTMLDivElement} - The clickable div to close sportsbook tabs.
 */
const closeTabsDiv = () => {
  const div = navDiv("closer", "", "X");
  div.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const message = {
      action: CLOSE_SPORTSBOOK_TABS,
      settings: settings
    };
    chrome.runtime.sendMessage(message, (resp) => {
      console.log(`${message.action} result ${resp.result}`);
    });
  });
  return div;
};

/**
 * Creates and returns the clickable div for opening the options tab.
 *
 * @returns {HTMLDivElement} - The clickable div to open the options tab.
 */
const openOptionsDiv = () => {
  const div = navDiv("options", "", "O");
  div.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const message = {
      action: OPEN_OPTIONS_TAB,
      settings: settings
    };
    chrome.runtime.sendMessage(message, (resp) => {
      console.log(`${message.action} result ${resp.result}`);
    });
  });
  return div;
};

const loadActiveBooksDiv = () => {
  const loadActiveBooksDiv = navDiv("load-books", "", "Load");
  loadActiveBooksDiv.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    getSettings(settings => {
      const activeBooks = settings.activeBookSets["solid"];
      const books = document.querySelectorAll(".book");
      for (const book of books) {
        const label = book.childNodes[1];
        if (label !== undefined && label.innerText !== "Select All Books") {
          label.childNodes[1].checked = activeBooks.includes(label.innerText);
        }
      }
    });
  });
  return loadActiveBooksDiv;
};

const snapshotActiveBooksDiv = () => {
  const snapshotActiveBooksDiv = navDiv("snapshot-books", "", "Snapshot");
  snapshotActiveBooksDiv.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const activeBooks = [];
    const books = document.querySelectorAll(".book");
    // This is somewhat fragile obviously. For example, extra text nodes in the DOM
    // will throw this off. May need to change to the walk* algorithms instead.
    for (const book of books) {
      const label = book.childNodes[1];
      if (label !== undefined && label.innerText !== "Select All Books" && label.childNodes[1].checked) {
        activeBooks.push(label.innerText);
      }
    }
    setActiveBookSetSettings("solid", activeBooks, (x) => {
      console.log("called back");
    });
  });
  return snapshotActiveBooksDiv;
};

const addPlaysNav = (anchor) => {
  const div = anchor.parentElement;
  insertAfter(openOptionsDiv(), div);
  insertAfter(closeTabsDiv(), div);
  insertAfter(arbPlaysDiv(), div);
  for (let i = 0; i < 6; i++) {
    insertAfter(minEvPlaysDiv(i, i === 3 ? "THREE" : i), div);
  }
};

const highlightNavDiv = (id) => {
  const div = document.getElementById(id);
  if (div) {
    div.classList.add("active");
  }
};

const highlightCurrentPlaysNav = () => {
  const url = new URL(window.location.href);
  const tail = url.pathname + url.search + url.hash;

  const minEv = url.searchParams.get("ev");
  for (let i = 0; i < 6; i++) {
    if (tail === minEvUrl(i)) {
      highlightNavDiv(minEv);
      return;
    }
  }

  if (tail === ARB_URL) {
    highlightNavDiv("arb");
  }
};

const addEventsNav = (anchor) => {
  insertAfter(navDiv("events", "", "events"), anchor.parentElement);
};

const addBooksNav = (anchor) => {
  insertAfter(snapshotActiveBooksDiv(), anchor.parentElement);
  insertAfter(loadActiveBooksDiv(), anchor.parentElement);
};

const addWeightingsNav = (anchor) => {
  insertAfter(navDiv("weightings", "", "weightings"), anchor.parentElement);
};

const addWagersNav = (anchor) => {
  insertAfter(navDiv("wagers", "", "wagers"), anchor.parentElement);
};

const getUrls = (book) => {
  const bookDetails = settings.bookDetails[book];
  if (bookDetails) {
    return Object.values(settings.bookDetails)
        .filter(bd => bd.oddsGroup === bookDetails.oddsGroup)
        .map(bd => bd.urlTemplate);
  } else {
    return [];
  }
}

window.addEventListener("click", function (evt) {
  if (evt.target.tagName === "DIV" && evt.target.className === "sports_book_name") {
    const urls = getUrls(evt.target.innerText);
    const homeTeam = getHomeTeam(evt.target);

    // In the case of the Bet Market Details page we don't want to pop up
    // the save bet dialog if they clicked the book name.
    if (isBetMarketDetailsPage()) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    if (urls.length > 0) {
      for (let url of urls) {
        if (homeTeam) {
          url = url.replace("${homeTeam}", homeTeam);
        }
        window.open(url, "_blank", "noreferrer");
      }
    }
  }
}, true);

const settingsAnchor = document.querySelector('a[href="/settings"]');

if (settingsAnchor) {
  if (isPlaysPage() || isBetMarketDetailsPage()) {
    addPlaysNav(settingsAnchor);
    highlightCurrentPlaysNav();
  } else if (isEventsPage()) {
    console.log("events page");
    addEventsNav(settingsAnchor);
  } else if (isBooksPage()) {
    addBooksNav(settingsAnchor);
  } else if (isWeightingsPage()) {
    addWeightingsNav(settingsAnchor);
  } else if (isWagersPage()) {
    addWagersNav(settingsAnchor);
  } else if (isSettingsPage()) {
    console.log("settings page");
  }
} else {
  console.log("Settings link not found, navigation not added.");
}
