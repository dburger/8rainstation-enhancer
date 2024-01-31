importScripts("./common.js");

const closeSportsbookTabs = () => {
    chrome.tabs.query({url: "https://*/*"}, (tabs) => {
        tabs.forEach((tab) => {
            // TODO(dburger): add all the sportsbooks. Kind of need shared javascript
            // between this background worker and the content script so that we are
            // not repeating ourselves.
            console.log(tab.url);
            if (tab.url.includes("betrivers.com") ||
                tab.url.includes("betway.com") ||
                tab.url.includes("unibet.com") ||
                tab.url.includes("superbook.com") ||
                tab.url.startsWith("https://bet.wynnbet.com") ||
                tab.url.startsWith("https://espnbet.com") ||
                tab.url.startsWith("https://www.playdesertdiamond.com") ||
                tab.url.startsWith("https://sportsbook.caesars.com") ||
                tab.url.startsWith("https://sportsbook.fanduel.com") ||
                tab.url.startsWith("https://sportsbook.draftkings.com") ||
                tab.url.startsWith("https://app.hardrock.bet")) {
                chrome.tabs.remove(tab.id);
            }
        });
    });
};

const highlightNavLink = () => {
    chrome.tabs.query({active: true}, (tabs) => {
        tabs.forEach((tab) => {
            // TODO(dburger): this is proof of concept. Change this to make it apply a highlight
            // to the active minEv nav link.
            const url = new URL(tab.url);
            const tail = url.pathname + url.search + url.hash;
            if (tail === "/search/plays?search=&group=Y&bet=Y&ways=1&ev=3&arb=0&sort=1&max=250&width=6.5%25") {
                console.log("three");
            } else {
                console.log("not three");
            }
        });
    });
}

// Closes all sports wagering tabs upon message receipt. This is done here,
// in a background task, as only background tasks and popups can close tabs.
// Note that we currently don't examine the message at all, as the only message
// sent in this system is a message to close all sportsbook tabs.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // TODO(dburger): remove proof of concept shared code.
    helloWorld();
    if (message.action === CLOSE_SPORTSBOOK_TABS) {
        closeSportsbookTabs();
    } else if (message.action === HIGHLIGHT_NAV_LINK) {
        highlightNavLink();
    }
    sendResponse({result: "OK"});
});
