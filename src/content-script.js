// As I understand it, content scripts cannot work as modules. This prevents us
// from using async / await. Thus, the settings are retrieved here with a callback
// instead of on demand when needed.

let settings = null;
let anchorDiv = null;

/** Fetches the settings on page load and finishes setting up the page. */
getSettings(s => {
  settings = s;
  if (!anchorDiv) {
    return;
  }

  if (isBetMarketDetailsPage() || isEventsPage() || isPlaysPage() || isSettingsPage() || isWagersPage()) {
    insertAfter(addPlaymarkDiv(), anchorDiv);
    // We need to reverse here because these are added to the UI after the
    // anchor. Thus, the reverse undos the insert reverse.
    for (const [name, pd] of Object.entries(settings.playmarkDetailsMap).sort(sortPlaymarkEntries).reverse()) {
      insertAfter(navDiv(pd.playmark, name), anchorDiv);
    }
    highlightCurrentPlaymark();
  } else if (isBooksPage()) {
    // NOOP.
  } else if (isWeightingsPage()) {
    // NOOP.
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
  return window.location.href.match(/^.*\/events\/?$/) !== null;
};

/**
 * Returns whether the current page is the books page.
 *
 * @returns {boolean}
 */
const isBooksPage = () => {
  return window.location.href.match(/^.*\/settings\/books\/?$/) !== null;
};

/**
 * Returns whether the current page is the weightings page.
 *
 * @returns {boolean}
 */
const isWeightingsPage = () => {
  return window.location.href.match(/^.*\/settings\/weightings\/?$/) !== null;
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
  return window.location.href.match(/^.*\/settings\/?$/) !== null;
};

/**
 * Returns whether the current page is the bet market details page.
 *
 * @returns {boolean}
 */
const isBetMarketDetailsPage = () => {
  return window.location.href.match(/^.*\/events\/.+$/) !== null;
}

/**
 * Attempts to find the home team on the page and returns it.
 *
 * @param elem {HTMLElement} - The element to start the search from. Depending on
 *     the source page, this may or may not affect the search.
 * @returns {null|string} - The home team or null if not found.
 */
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
 * Creates and returns a clickable navigation anchor. Note that this used
 * to return a div, thus the holdover naming. The reason it returns an
 * anchor instead is that the anchor wraps the div making a larger click
 * area without having to resort to any trickery.
 *
 * @param href {string} - The href for the link included in the div element.
 * @param text {string} - The text to display within the link in the div element.
 * @returns {HTMLDivElement} - The clickable navigation anchor.
 */
const navDiv = (href, text) => {
  const div = document.createElement("div");
  const clazz = href ? "nav enhancer bookmark" : "nav enhancer";
  div.setAttribute("class", clazz);
  div.appendChild(document.createTextNode(text));

  const a = document.createElement("a");
  a.setAttribute("href", href);
  a.appendChild(div);
  return a;
};

/**
 * Adds a new playmark div in edit state. The user then can complete the edit
 * with an <enter> or by changing the focus. The <escape> key will cancel the
 * adding of the playmark.
 *
 * @param div {HTMLElement} - The add div that will be used to position the
 *     new div. It is hidden and then brought back on completion of the edit.
 */
const addEditablePlaymarkDiv = (div) => {
  const prior = div.previousSibling;
  const playmark = navDiv("", "NAME");
  insertAfter(playmark, div);
  const editableDiv = playmark.childNodes[0];
  editableDiv.setAttribute("contenteditable", true);

  const sel = window.getSelection();
  sel.setBaseAndExtent(editableDiv, 0, playmark.childNodes[0], 1);

  const removeEventHandlers = () => {
    editableDiv.removeEventListener("focusout", focusoutHandler);
    editableDiv.removeEventListener("keypress", keypressHandler);
    editableDiv.removeEventListener("keyup", keyupHandler);
  };

  const commitPlaymark = (evt) => {
    evt.target.setAttribute("contenteditable", false);
    evt.target.classList.add("active");
    window.getSelection().removeAllRanges();
    insertAfter(div, playmark);
    addPlaymark(evt.target.innerText, window.location.pathname + window.location.search);
    removeEventHandlers();
  };

  const focusoutHandler = (evt) => {
    commitPlaymark(evt);
  };

  const keypressHandler = (evt) => {
    if (evt.key === "Enter") {
      evt.stopPropagation();
      evt.preventDefault();
      // Allow the "focusout" to commitPlaymark.
      evt.target.blur();
    }
  };

  const keyupHandler = (evt) => {
    if (evt.key === "Escape") {
      evt.stopPropagation();
      evt.preventDefault();
      // Note that event handlers must be removed before removing the target.
      // This prevents a "focusout" event from saving the playmark.
      removeEventHandlers();
      evt.target.remove();
      insertAfter(div, prior);
    }
  };

  editableDiv.addEventListener("focusout", focusoutHandler);
  editableDiv.addEventListener("keypress", keypressHandler);
  editableDiv.addEventListener("keyup", keyupHandler);
};

/**
 * Creates and returns the clickable div to add a playmark.
 *
 * @returns {HTMLDivElement} - The div to add a playmark.
 */
const addPlaymarkDiv = () => {
  const div = navDiv("", "+");
  div.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    addEditablePlaymarkDiv(div);
    div.remove();
    console.log("addPlaymark");
  });
  return div;
};

/**
 * Creates and returns a clickable div that operates by sending a message.
 *
 * @param id {number} - The id attribute to apply to the div element.
 * @param text {string} - The text to display within the link in the div element.
 * @param action {string} - The action to send in the message.
 * @returns {HTMLDivElement} - The clickable navigation div.
 */
const sendMessageDiv = (id, text, action) => {
  const div = navDiv("", text);
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

/**
 * Highlights the playmark that matches the current URL, if any.
 */
const highlightCurrentPlaymark = () => {
  const navDivs = document.querySelectorAll(".bookmark");
  for (const div of navDivs) {
    if (div.tagName === "DIV" && div.parentElement.tagName === "A" && div.parentElement.href === window.location.href) {
      div.classList.add("active");
      break;
    }
  }
};

/**
 * Launches the URLs from books in the given book's odds group into tabs.
 *
 * @param book {string} - The sportsbook to launch tab(s) for. All books in the
 *     same odds group will be launched.
 * @param homeTeam - The home team for the event. Used in URL
 *     generation.
 */
const launchUrls = (book, homeTeam) => {
  const message = {
    action: OPEN_SPORTSBOOK_TABS,
    settings: settings,
    book: book,
    homeTeam: homeTeam
  };

  chrome.runtime.sendMessage(message, (resp) => {
    console.log(`${message.action} result ${resp.result}`);
  });
};

const isTotalDiv = (elem) => {
  return elem && (elem.className === "no-total" || elem.className === "market-total");
}

const copyTotal = (elem) => {
  const text = elem.innerText;
  if (text && text.length > 1) {
    navigator.clipboard.writeText(text.substring(1));
  }
}

/** Adds the hook to react to clicks on sportsbook names. */
window.addEventListener("click", function (evt) {
  if (evt.target.tagName !== "DIV") {
    return;
  }
  if (evt.target.className === "sports_book_name") {
    const elem = evt.target.previousElementSibling;
    if (isTotalDiv(elem)) {
      copyTotal(elem);
    }

    const book = evt.target.innerText;
    const homeTeam = getHomeTeam(evt.target);
    launchUrls(book, homeTeam);
  } else if (isTotalDiv(evt.target)) {
    copyTotal(evt.target);
  }
}, true);

const settingsLink = document.querySelector('a[href="/settings"]');

if (settingsLink) {
  anchorDiv = openOptionsDiv();
  insertAfter(anchorDiv, settingsLink.parentElement);
  insertAfter(closeTabsDiv(), settingsLink.parentElement);
} else {
  console.error("Settings link not found, navigation not added.");
}
