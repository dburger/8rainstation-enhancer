const ARB_URL = "/search/plays?search=Pinnacle&group=Y&bet=Y&ways=2&ev=0&arb=0&sort=2&max=250&width=&weight=&days=";

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
    chrome.runtime.sendMessage({action: CLOSE_SPORTSBOOK_TABS}, (resp) => {
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
  const books = [];
  if (book === "BetMGM") {
    books.push("https://sports.az.betmgm.com/en/sports");
  } else if (book === "BetRivers") {
    books.push("https://az.betrivers.com");
    books.push("https://www.playdesertdiamond.com/en/sports#home");
    books.push("https://az.unibet.com/sports#home");
  } else if (book === "Betway") {
    books.push("https://az.betway.com/sports/home");
  } else if (book === "Caesars") {
    books.push("https://sportsbook.caesars.com/us/az/bet/");
  } else if (book === "ESPN Bet") {
    books.push("https://espnbet.com/");
  } else if (book === "Fliff") {
    books.push("https://sports.getfliff.com/");
  } else if (book === "Hard Rock Bet") {
    books.push("https://app.hardrock.bet");
  } else if (book === "FanDuel") {
    books.push("https://sportsbook.fanduel.com/search");
  } else if (book === "DraftKings") {
    books.push("https://sportsbook.draftkings.com/");
  } else if (book === "Pinnacle") {
    books.push("https://www.pinnacle.com/en/");
  } else if (book === "SuperBook") {
    books.push("https://az.superbook.com/sports");
  } else if (book === "WynnBET") {
    books.push("https://bet.wynnbet.com/sports/us/sports/recommendations");
  }
  return books;
}

window.addEventListener('click', function (evt) {
  if (evt.target.tagName === "DIV" && evt.target.className === "sports_book_name") {
    const urls = getUrls(evt.target.innerText);
    const homeTeam = getHomeTeam(evt.target);
    console.log("found home team", homeTeam);
    // TODO(dburger): use homeTeam for deep linking.

    // TODO(dburger): what do we want to do if we don't
    // have URLs?

    // Note that we aren't preventing default or stopping propagation.
    // That is, the details page will still open while the book is
    // spawned in a new tab.
    if (urls.length > 0) {
      for (let url of urls) {
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
