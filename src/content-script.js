// As I understand it, content scripts cannot work as modules. This prevents us
// from using async / await. Thus, the settings are retrieved here with a callback
// instead of on demand when needed.

let settings = null;
let anchorDiv = null;

const hookBetSlipOps = () => {
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "m" && evt.ctrlKey) {
      const amount = getNthByName("amount", 2);
      const odds = getNthByName("odds", 2);
      const notes = getNthBySelector(".notes input", 2);
      if (amount && odds && notes) {
        amount.value = "0.01";
        notes.value = "make";
        odds.focus();
      }
    } else if (evt.key === "Escape") {
      for (const button of document.querySelectorAll("button")) {
        if (button.innerText === "Clear") {
          button.click();
          break;
        }
      }
    }
  });
};

/** Fetches the settings on page load and finishes setting up the page. */
getSettings(s => {
  settings = s;
  if (!anchorDiv) {
    return;
  }

  insertAfter(addPlaymarkDiv(), anchorDiv);
  // We need to reverse here because these are added to the UI after the
  // anchor. Thus, the reverse undos the insert reverse.
  for (const [name, pd] of Object.entries(settings.playmarkDetailsMap).sort(sortPlaymarkEntries).reverse()) {
    insertAfter(navDiv(pd.playmark, name), anchorDiv);
  }
  highlightCurrentPlaymark();

  if (isPlaysPage()) {
    if (settings.showMeg) {
      addMeg("line");
    }

    addTimer();

    if (settings.notifyPlays) {
      // The intention here is to not play the notification on back button navigation, however,
      // wonkiness has been noted about when this fires page load events.
      if (window.performance.getEntriesByType("navigation")[0].entryType !== "back_forward") {
        notifyPlays();
      }
    }

    hookBetSlipOps();
  } else if (isBetMarketDetailsPage()) {
    if (settings.showMeg) {
      addMeg("odds");
    }

    hookBetSlipOps();
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

const parseSportLeague = (text) => {
  const parts = text.split(" ");
  let league = parts[0].toLowerCase();
  const sport = parts[1].toLowerCase();
  if (sport === "basketball" && league === "ncaam") {
    league = "ncaab";
  }
  return [sport, league];
};

const extractSportLeaguePlaysPage = (text) => {
  return parseSportLeague(text.split(" - ")[0]);
};

const extractSportLeagueDetailsPage = (text) => {
  return parseSportLeague(text.split(" - ")[1]);
}

/**
 * Attempts to find the game info on the page and returns it.
 *
 * @param elem {HTMLElement} - The element to start the search from. Depending on
 *     the source page, this may or may not affect the search.
 * @returns {null|GameInfo} - The game info or null if not found.
 */
const getGameInfo = (elem) => {
  if (isPlaysPage()) {
    const div = walkUp(elem, (e) => e.tagName === "DIV" && e.className === "play");
    if (div) {
      const gameDiv = walkDown(div, (e) => e.tagName === "DIV" && e.className === "game_name");
      const sportDiv = walkDown(div, (e) => e.tagName === "DIV" && e.className === "sport_league");
      if (gameDiv && sportDiv) {
        const homeTeam = gameDiv.innerText.split(" at ")[1];
        const [sport, league] = extractSportLeaguePlaysPage(sportDiv.innerText);
        return new GameInfo(homeTeam, sport, league);
      }
    }
  } else if (isBetMarketDetailsPage()) {
    const divs = document.querySelectorAll("div.event-team");
    const h1 = document.querySelector("h1");
    if (divs.length > 1 && h1) {
      // Split off the record they add after the team name: "Kansas City Chiefs (0-0-0)"
      const homeTeam = divs[1].innerText.split(" (")[0];
      const [sport, league] = extractSportLeagueDetailsPage(h1.innerText);
      return new GameInfo(homeTeam, sport, league);
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
 * Adds the Maximum Expected Growth (MEG) calculation to each displayed
 * play. This calculation is explained in Dan Abram's book "But How Much
 * Did You Lose". The value is added in the units of basis points and is
 * identified with a "b" suffix.
 *
 * @param clazz {string} - The class name that identify the divs that contain
 *     a play. Note that it will be expected to have sub divs with class names
 *     "positive_ev" and "price".
 */
const addMeg = (clazz) => {
  const selector = `div.${clazz}`;
  for (const play of document.querySelectorAll(selector)) {
    const pevDiv = play.querySelector(".positive_ev");
    const priceDiv = play.querySelector(".price");
    if (!pevDiv || !priceDiv) {
      continue;
    }
    const percent = pevDiv.innerText;
    const edge = parseFloat(percent) / 100.0;
    const americanPrice = parseInt(priceDiv.innerText);
    const fractionalOdds = (americanPrice >= 100) ? americanPrice / 100.0 : -100.0 / americanPrice;
    const meg = (edge ** 2) / (2 * fractionalOdds);
    const basisPoints = (meg * 10000).toFixed(2);
    pevDiv.innerText = `${percent} ${basisPoints}b`;
  }
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
 * @param gameInfo - The game info for the event. Used in URL generation.
 */
const launchUrls = (book, gameInfo) => {
  const message = {
    action: OPEN_SPORTSBOOK_TABS,
    settings: settings,
    book: book,
    gameInfo: gameInfo,
  };

  chrome.runtime.sendMessage(message, (resp) => {
    console.log(`${message.action} result ${resp.result}`);
  });
};

/** Adds the hook to react to clicks on sportsbook names. */
window.addEventListener("click", function (evt) {
  // Lower case "text", really? Yes, looks like that is the case.
  if (evt.target.tagName !== "DIV" && evt.target.tagName !== "text") {
    return;
  }
  // Second one actually is instance of SVGAnimatedString.
  if (evt.target.className === "sports_book_name" || evt.target.className.baseVal === "book") {
    const book = evt.target.innerText || evt.target.childNodes[0].textContent;
    const gameInfo = getGameInfo(evt.target);
    launchUrls(book, gameInfo);
  }
}, true);

const addTimer = () => {
  const memberNoElem = document.querySelector(".member-no");
  if (memberNoElem) {
    const startTime = Date.now();
    const updateTime = () => {
      const currTime = Date.now();
      const secs = `${Math.round((currTime - startTime) / 1000)} secs`;
      memberNoElem.innerText = secs;
      document.title = `8rs ${secs}`;
    }
    setInterval(updateTime, 1000);
  }
};

const getVisiblePlaysCount = () => {
  let count = 0;
  for (const play of document.querySelectorAll(".play")) {
    if (play.style.display !== "none") {
      count++;
    }
  }
  return count;
};

const notifyPlays = () => {
  if (getVisiblePlaysCount() > 0) {
    // --autoplay-policy=no-user-gesture-required
    // or site settings -> allow sound
    const myAudio = new Audio(chrome.runtime.getURL("ticker.wav"));
    myAudio.play();
  }
};

const settingsLink = document.querySelector('a[href="/settings"]');

if (settingsLink) {
  anchorDiv = openOptionsDiv();
  insertAfter(anchorDiv, settingsLink.parentElement);
  insertAfter(closeTabsDiv(), settingsLink.parentElement);
} else {
  console.log("Settings link not found, navigation not added.");
}
