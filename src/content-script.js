const ARB_URL = "/search/plays?search=Pinnacle&group=Y&bet=Y&ways=2&ev=0&arb=0&sort=2&max=250&width=&weight=&days=";

// As I understand it, content scripts cannot work as modules. This prevents us
// from using async / await. Thus, the settings are retrieved here with a callback
// instead of on demand when needed.
let settings = null;

getSettings(s => {
  settings = s;
  if (isBooksPage()) {
    // TODO(dburger): DRY this and the next.
    const datalist = document.getElementById("activeBooksNamesDatalist");
    if (datalist) {
      for (const name of Object.keys(settings.activeBooksMap)) {
        const option = document.createElement("option");
        option.setAttribute("value", name);
        datalist.appendChild(option);
      }
    } else {
      // TODO(dburger): drop an error log.
    }
  } else if (isWeightingsPage()) {
    const datalist = document.getElementById("activeBookWeightingsNamesDatalist");
    if (datalist) {
      for (const name of Object.keys(settings.activeBookWeightingsMap)) {
        const option = document.createElement("option");
        option.setAttribute("value", name);
        datalist.appendChild(option);
      }
    } else {
      // TODO(dburger): drop an error log.
    }
  }
});

/**
 * Returns whether the current page is the plays page.
 *
 * @returns {boolean}
 */
const isPlaysPage = () => {
  return window.location.href.includes("/search/plays");
};

/**
 * Returns whether the current page is the events page.
 *
 * @returns {boolean}
 */
const isEventsPage = () => {
  return window.location.href.match(/^.*\/events\/?$/);
};

/**
 * Returns whether the current page is the books page.
 *
 * @returns {boolean}
 */
const isBooksPage = () => {
  return window.location.href.match(/^.*\/settings\/books\/?$/);
};

/**
 * Returns whether the current page is the weightings page.
 *
 * @returns {boolean}
 */
const isWeightingsPage = () => {
  return window.location.href.match(/^.*\/settings\/weightings\/?$/);
};

/**
 * Returns whether the current page is the wagers page.
 *
 * @returns {boolean}
 */
const isWagersPage = () => {
  return window.location.href.includes("/wagers/");
};

/**
 * Returns whether the current page is the settings page.
 *
 * @returns {boolean}
 */
const isSettingsPage = () => {
  return window.location.href.match(/^.*\/settings\/?$/);
};

/**
 * Returns whether the current page is the bet market details page.
 *
 * @returns {boolean}
 */
const isBetMarketDetailsPage = () => {
  return window.location.href.match(/^.*\/events\/.+$/);
}

const getHomeTeam = (elem) => {
  if (isPlaysPage()) {
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
  } else if (isBetMarketDetailsPage()) {
    const divs = document.querySelectorAll("div.event-team");
    if (divs.length === 2) {
      return divs[1].innerText;
    }
  }

  return null;
};

/**
 * Creates and returns a clickable navigation div.
 *
 * @param id {string} - The id attribute to apply to the div element.
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
  const clazz = href ? "nav enhancer bookmark" : "nav enhancer";
  div.setAttribute("class", clazz);
  div.appendChild(a);

  return div;
};

/**
 * Returns the minimum +EV URL for the given minimum +EV.
 *
 * @param minEv {number} - The minimum +EV to set in the URL.
 * @param minWeight {number} - The minimum weight to set in the URL.
 * @returns {string} - The URL for the given minimum +EV.
 */
const minEvUrl = (minEv, minWeight) => {
  return `/search/plays?search=&group=Y&bet=Y&ways=1&ev=${minEv}&arb=0&sort=1&max=250&width=6.5%25&weight=${minWeight}&days=7`;
};

/**
 * Creates and returns the clickable navigation div for minimum EV plays.
 *
 * @param id {string} - The id attribute to apply to the div element.
 * @param minEv {number} - The minimum EV of plays to display.
 * @param minWeight {number} - The minimum weight of plays to display.
 * @param text {string} - The text to display in the link.
 * @returns {HTMLDivElement} - The clickable navigation div.
 */
const minEvPlaysDiv = (id, minEv, minWeight, text) => {
  return navDiv(id, minEvUrl(minEv, minWeight), text);
};

/**
 * Creates and returns the clickable navigation div for arb plays.
 *
 * @returns {HTMLDivElement} - The clickable navigation div.
 */
const arbPlaysDiv = () => {
  return navDiv("arb", ARB_URL, "A");
};

/**
 * Creates and returns a clickable div that operates by sending a message.
 *
 * @param id {number|string} - The id attribute to apply to the div element.
 * @param text {string} - The text to display within the link in the div element.
 * @param action {string} - The action to send in the message.
 * @returns {HTMLDivElement} - The clickable navigation div.
 */
const sendMessageDiv = (id, text, action) => {
  const div = navDiv(id, "", text);
  div.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const message = {
      action: action,
      settings: settings
    };
    chrome.runtime.sendMessage(message, (resp) => {
      console.log(`${message.action} result ${resp.result}`);
    });
  });
  return div;
};

/**
 * Creates and returns the clickable div for closing all sportsbook tabs.
 *
 * @returns {HTMLDivElement} - The clickable div to close sportsbook tabs.
 */
const closeTabsDiv = () => {
  return sendMessageDiv("closer", "X", CLOSE_SPORTSBOOK_TABS);
};

/**
 * Creates and returns the clickable div for opening the options tab.
 *
 * @returns {HTMLDivElement} - The clickable div to open the options tab.
 */
const openOptionsDiv = () => {
  return sendMessageDiv("options", "O", OPEN_OPTIONS_TAB);
};

const loadActiveBooksDiv = () => {
  const loadActiveBooksDiv = navDiv("load-books", "", "Load");
  loadActiveBooksDiv.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const activeBooksName = document.getElementById("activeBooksNameTextBox").value;
    getSettings(settings => {
      // TODO(dburger): convert to Set for speed up below?
      const activeBooks = settings.activeBooksMap[activeBooksName];
      if (!activeBooks) {
        return;
      }
      const bookDivs = document.querySelectorAll(".book");
      for (const bookDiv of bookDivs) {
        const label = bookDiv.childNodes[1];
        if (label !== undefined && label.innerText !== "Select All Books") {
          label.childNodes[1].checked = activeBooks.includes(label.innerText);
        }
      }
    });
  });
  return loadActiveBooksDiv;
};

const loadActiveBookWeightingsDiv = () => {
  const loadActiveBookWeightingsDiv = navDiv("load-weightings", "", "Load");
  loadActiveBookWeightingsDiv.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const activeWeightingsName = document.getElementById("activeBookWeightingsNameTextBox").value;
    getSettings(settings => {
      const activeWeightings = settings.activeBookWeightingsMap[activeWeightingsName];
      if (!activeWeightings) {
        return;
      }
      const bookDivs = document.querySelectorAll(".book");
      for (const bookDiv of bookDivs) {
        const input = bookDiv.childNodes[1];
        const label = bookDiv.childNodes[3];
        const book = label.innerText;
        const weight = activeWeightings[book];
        input.value = weight ? weight : "";
      }
    });
  });
  return loadActiveBookWeightingsDiv;
};

const storeActiveBooksDiv = () => {
  const storeActiveBooksDiv = navDiv("store-books", "", "Store");
  storeActiveBooksDiv.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const activeBooks = [];
    const bookDivs = document.querySelectorAll(".book");
    // This is somewhat fragile obviously. For example, extra text nodes in the DOM
    // will throw this off. May need to change to the walk* algorithms instead.
    for (const bookDiv of bookDivs) {
      const label = bookDiv.childNodes[1];
      if (label !== undefined && label.innerText !== "Select All Books" && label.childNodes[1].checked) {
        activeBooks.push(label.innerText);
      }
    }
    const activeBooksName = document.getElementById("activeBooksNameTextBox").value;
    setActiveBooks(activeBooksName, activeBooks, (x) => {
      // TODO(dburger): Drop a better log.
      console.log("called back");
    });
  });
  return storeActiveBooksDiv;
};

const storeActiveBookWeightingsDiv = () => {
  const storeActiveBookWeightingsDiv = navDiv("store-weightings", "", "Store");
  storeActiveBookWeightingsDiv.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const activeWeightings = {};
    const bookDivs = document.querySelectorAll(".book");
    // This is somewhat fragile obviously. For example, extra text nodes in the DOM
    // will throw this off. May need to change to the walk* algorithms instead.
    for (const bookDiv of bookDivs) {
      const input = bookDiv.childNodes[1];
      const label = bookDiv.childNodes[3];
      if (input.value) {
        const book = label.innerText;
        const weight = parseFloat(input.value);
        activeWeightings[book] = weight;
      }
    }
    const activeBookWeightingsName = document.getElementById("activeBookWeightingsNameTextBox").value;
    setBookWeightings(activeBookWeightingsName, activeWeightings, (x) => {
      // TODO(dburger): Drop a better log.
      console.log("called back");
    });
  });
  return storeActiveBookWeightingsDiv;
};

const activeBooksNameTextBox = () => {
  const input = document.createElement("input");
  input.setAttribute("id", "activeBooksNameTextBox");
  input.setAttribute("type", "text");
  input.setAttribute("list", "activeBooksNamesDatalist");
  input.setAttribute("size", "10");

  const datalist = document.createElement("datalist");
  datalist.setAttribute("id", "activeBooksNamesDatalist");

  const div = document.createElement("div");
  div.setAttribute("class", "nav unclickable");
  div.appendChild(input);
  div.appendChild(datalist);

  return div;
};

const activeBookWeightingsNameTextBox = () => {
  const input = document.createElement("input");
  input.setAttribute("id", "activeBookWeightingsNameTextBox");
  input.setAttribute("type", "text");
  input.setAttribute("list", "activeBookWeightingsNamesDatalist");
  input.setAttribute("size", "10");

  const datalist = document.createElement("datalist");
  datalist.setAttribute("id", "activeBookWeightingsNamesDatalist");

  const div = document.createElement("div");
  div.setAttribute("class", "nav unclickable");
  div.appendChild(input);
  div.appendChild(datalist);

  return div;
};

const addCommonNav = (div) => {
  insertAfter(openOptionsDiv(), div);
  insertAfter(closeTabsDiv(), div);
};

const addPlaysNav = (anchor) => {
  const div = anchor.parentElement;
  addCommonNav(div);
  insertAfter(arbPlaysDiv(), div);
  insertAfter(minEvPlaysDiv("3/2", 3, 2, "3/2"), div);
  insertAfter(minEvPlaysDiv("5/0", 5, 0, "5/0"), div);
};

const highlightCurrentPlaysNav = () => {
  const navDivs = document.querySelectorAll(".bookmark");
  for (const div of navDivs) {
    if (div.tagName === "DIV" && div.childNodes[0] && div.childNodes[0].tagName === "A" && div.childNodes[0].href === window.location.href) {
      div.classList.add("active");
      break;
    }
  }
};

const addEventsNav = (anchor) => {
  const div = anchor.parentElement;
  addCommonNav(div);
};

const addBooksNav = (anchor) => {
  const div = anchor.parentElement;
  addCommonNav(div);
  insertAfter(storeActiveBooksDiv(), div);
  insertAfter(loadActiveBooksDiv(), div);
  insertAfter(activeBooksNameTextBox(), div);
};

const addWeightingsNav = (anchor) => {
  const div = anchor.parentElement;
  addCommonNav(div);
  insertAfter(storeActiveBookWeightingsDiv(), div);
  insertAfter(loadActiveBookWeightingsDiv(), div);
  insertAfter(activeBookWeightingsNameTextBox(), div);
};

const addWagersNav = (anchor) => {
  const div = anchor.parentElement;
  addCommonNav(div);
};

const addSettingsNav = (anchor) => {
  const div = anchor.parentElement;
  addCommonNav(div);
};

const getUrls = (book) => {
  const bookDetails = settings.bookDetailsMap[book];
  if (bookDetails) {
    return Object.values(settings.bookDetailsMap)
        .filter(bd => bd.oddsGroup === bookDetails.oddsGroup)
        .map(bd => bd.urlTemplate);
  } else {
    return [];
  }
}

const launchUrls = (urls, homeTeam) => {
  if (urls.length > 0) {
    for (let url of urls) {
      if (homeTeam) {
        url = url.replace("${homeTeam}", homeTeam);
      }
      // TODO(dburger): noopener?
      window.open(url, "_blank", "noopener,noreferrer");
    }
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

    launchUrls(urls, homeTeam);
  }
}, true);

const settingsAnchor = document.querySelector('a[href="/settings"]');

if (settingsAnchor) {
  if (isPlaysPage() || isBetMarketDetailsPage()) {
    addPlaysNav(settingsAnchor);
    highlightCurrentPlaysNav();
  } else if (isEventsPage()) {
    addEventsNav(settingsAnchor);
  } else if (isBooksPage()) {
    addBooksNav(settingsAnchor);
  } else if (isWeightingsPage()) {
    addWeightingsNav(settingsAnchor);
  } else if (isWagersPage()) {
    addWagersNav(settingsAnchor);
  } else if (isSettingsPage()) {
    addSettingsNav(settingsAnchor);
  }
} else {
  console.log("Settings link not found, navigation not added.");
}
