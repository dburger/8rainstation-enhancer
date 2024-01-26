const insertAfter = (newElem, elem) => {
  elem.parentElement.insertBefore(newElem, elem.nextSibling);
};

const navDiv = (href, text) => {
  const a = document.createElement("a");
  a.setAttribute("href", href);
  a.appendChild(document.createTextNode(text));

  const div = document.createElement("div");
  div.setAttribute("class", "nav");
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

const settingsDiv = document.querySelector('a[href="/settings"]').parentElement;

insertAfter(arbPlaysDiv(), settingsDiv);
insertAfter(minEvPlaysDiv(3), settingsDiv);
insertAfter(minEvPlaysDiv(4), settingsDiv);
insertAfter(minEvPlaysDiv(5), settingsDiv);
