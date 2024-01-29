const insertAfter = (newElem, elem) => {
  elem.parentElement.insertBefore(newElem, elem.nextSibling);
};

const navDiv = (href, text) => {
  const a = document.createElement("a");
  a.setAttribute("href", href);
  a.appendChild(document.createTextNode(text));

  const div = document.createElement("div");
  div.setAttribute("class", "nav enhancer");
  div.appendChild(a);

  return div;
};

const minEvPlaysDiv = (minEv) => {
  return navDiv(
      `/search/plays?search=&group=Y&bet=Y&ways=1&ev=${minEv}&arb=0&sort=1&max=250&width=6.5%25`,
      minEv);
};

const arbPlaysDiv = () => {
  return navDiv(
      "/search/plays?search=Pinnacle&group=Y&bet=Y&ways=2&ev=0&arb=0&sort=2&max=&width=",
      "A");
};

const closeTabsDiv = () => {
  const div = navDiv("", "C");
  div.addEventListener('click', (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    chrome.runtime.sendMessage(null, (resp) => {
    });
  });
  return div;
};

const addNav = (anchor) => {
  const div = anchor.parentElement;
  insertAfter(closeTabsDiv(), div);
  insertAfter(arbPlaysDiv(), div);
  insertAfter(minEvPlaysDiv(3), div);
  insertAfter(minEvPlaysDiv(4), div);
  insertAfter(minEvPlaysDiv(5), div);
};

const settingsAnchor = document.querySelector('a[href="/settings"]');

if (settingsAnchor) {
  addNav(settingsAnchor);
} else {
  console.log("Settings link not found, navigation not added.");
}

const getUrl = (book) => {
  if (book === "BetMGM") {
    return "https://sports.az.betmgm.com/en/sports";
  } else if (book === "BetRivers") {
    return "https://az.betrivers.com";
  } else if (book === "Betway") {
    return "https://az.betway.com/sports/home";
  } else if (book === "Caesars") {
    return "https://sportsbook.caesars.com/us/az/bet/";
  } else if (book === "ESPN Bet") {
    return "https://espnbet.com/";
  } else if (book === "Fliff") {
    return "https://sports.getfliff.com/";
  } else if (book === "Hard Rock Bet") {
    return "https://www.hardrock.bet/az/";
  } else if (book === "FanDuel") {
    return "https://sportsbook.fanduel.com/search";
  } else if (book === "DraftKings") {
    return "https://sportsbook.draftkings.com/";
  } else if (book === "Pinnacle") {
    return "https://www.pinnacle.com/en/";
  } else if (book === "SuperBook") {
    return "https://az.superbook.com/sports";
  } else if (book === "WynnBET") {
    return "https://bet.wynnbet.com/sports/us/sports/recommendations";
  } else {
    return null;
  }
}

window.addEventListener('click', function(evt) {
  if (evt.target.tagName === "DIV" && evt.target.className === "sports_book_name") {
    const url = getUrl(evt.target.innerText);
    if (url) {
      window.open(url, "_blank");
      evt.preventDefault();
      evt.stopPropagation();
    }
  }
}, true);

// TODO(dburger): how to extract the game after click on div.sports_book_name:
//
// 1. Walk up to div.play
// 2. div.play > div.header > div.game_name > a.innerText == A at B
