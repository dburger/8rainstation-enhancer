// As I understand it, content scripts cannot work as modules. This prevents us
// from using async / await. Thus, the settings are retrieved here with a callback
// instead of on demand when needed. If this page changes to need some of the
// settings on initialization, that code will have to be moved into this callback.
// For now, initialization like adding the custom links, lives outside this callback.
let settings = null;
getSettings((s) => settings = s);

const ARB_URL = "/search/plays?search=Pinnacle&group=Y&bet=Y&ways=2&ev=0&arb=0&sort=2&max=250&width=&weight=&days=";

const isPlaysPage = () => {
  return window.location.href.includes("/search/plays");
};

const isBetMarketDetailsPage = () => {
  // TODO(dburger): This isn't strictly true, the events page will also
  // render with a single slash at the end. Could check for the existence
  // of characters past the slash.
  return window.location.href.includes("/events/");
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

const minEvUrl = (minEv) => {
  return `/search/plays?search=&group=Y&bet=Y&ways=1&ev=${minEv}&arb=0&sort=1&max=250&width=6.5%25&weight=&days=`;
};

const minEvPlaysDiv = (minEv, text) => {
  return navDiv(minEv, minEvUrl(minEv), text);
};

const arbPlaysDiv = () => {
  return navDiv("arb", ARB_URL, "A");
};

const closeTabsDiv = () => {
  const div = navDiv("closer", "", "C");
  div.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const message = {
      action: CLOSE_SPORTSBOOK_TABS,
      settings : settings.settings
    };
    chrome.runtime.sendMessage(message, (resp) => {
      console.log(`${CLOSE_SPORTSBOOK_TABS} result ${resp.result}`);
    });
  });
  return div;
};

const addNav = (anchor) => {
  const div = anchor.parentElement;
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

const highlightCurrentNav = () => {
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

const getUrls = (book) => {
  const bookDetails = settings.settings[book];
  if (bookDetails) {
    return [bookDetails.urlTemplate];
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
        window.open(url, "_blank");
      }
    }
  }
}, true);

const settingsAnchor = document.querySelector('a[href="/settings"]');

if (settingsAnchor) {
  addNav(settingsAnchor);
  highlightCurrentNav();
} else {
  console.log("Settings link not found, navigation not added.");
}
