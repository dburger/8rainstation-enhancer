const playsDiv = (minEv) => {
  const a = document.createElement("a");
  a.setAttribute(
    "href",
    `/search/plays?search=&group=Y&bet=Y&ways=1&ev=${minEv}&arb=0&sort=1&max=250&width=6.5%25`);
  a.appendChild(document.createTextNode(`${minEv}`));

  const div = document.createElement("div");
  div.setAttribute("class", "nav");
  div.appendChild(a);

  return div;
};

const settingsDiv = document.querySelector('a[href="/settings"]').parentElement;
const topNav = settingsDiv.parentElement;
topNav.insertBefore(playsDiv(3), settingsDiv.nextSibling);
topNav.insertBefore(playsDiv(4), settingsDiv.nextSibling);
topNav.insertBefore(playsDiv(5), settingsDiv.nextSibling);
