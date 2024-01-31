const insertAfter = (newElem, elem) => {
  elem.parentElement.insertBefore(newElem, elem.nextSibling);
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

const minEvPlaysDiv = (minEv, text) => {
  return navDiv(
      minEv,
      `/search/plays?search=&group=Y&bet=Y&ways=1&ev=${minEv}&arb=0&sort=1&max=250&width=6.5%25`,
      text);
};

const arbPlaysDiv = () => {
  return navDiv(
      "arb",
      "/search/plays?search=Pinnacle&group=Y&bet=Y&ways=2&ev=0&arb=0&sort=2&max=250&width=&weight=",
      "A");
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

const settingsAnchor = document.querySelector('a[href="/settings"]');

if (settingsAnchor) {
  addNav(settingsAnchor);
} else {
  console.log("Settings link not found, navigation not added.");
}

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
    books.push("https://www.hardrock.bet/az/");
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
    // TODO(dburger): what do we want to do if we don't
    // have URLs?
    if (urls.length > 0) {
      evt.preventDefault();
      evt.stopPropagation();
      for (url of urls) {
        window.open(url, "_blank");
      }
    }
  }
}, true);

// TODO(dburger): how to extract the game after click on div.sports_book_name:
//
// 1. Walk up to div.play
// 2. div.play > div.header > div.game_name > a.innerText == A at B
//
// On Bet Market Details page opponents can be found in:
//
// <div class="event-box event-team">Illinois St Redbirds</div>

// TODO(dburger): remove proof of concept shared code.
helloWorld();

const url = new URL(window.location.href);
const tail = url.pathname + url.search + url.hash;
const minEv = url.searchParams.get("ev");
if (tail === "/search/plays?search=&group=Y&bet=Y&ways=1&ev=3&arb=0&sort=1&max=250&width=6.5%25") {
  const div = document.getElementById(minEv);
  if (div) {
    div.classList.add("active");
    console.log("three");
  } else {
    console.log("not found");
  }
} else {
  console.log("not three");
}
