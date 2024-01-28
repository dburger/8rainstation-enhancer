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
}

const addNav = (anchor) => {
  const div = anchor.parentElement;
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
  if (book === "FanDuel") {
    return "https://sportsbook.fanduel.com/search";
  } else if (book === "DraftKings") {
    return "https://sportsbook.draftkings.com/";
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
