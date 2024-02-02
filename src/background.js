importScripts("./common.js");

const closeSportsbookTabs = (settings) => {
    const hosts = [];
    for (const bookDetail of Object.values(settings)) {
        hosts.push(bookDetail.hostname);
    }
    chrome.tabs.query({url: "https://*/*"}, (tabs) => {
        tabs.forEach((tab) => {
            if (!tab.active) {
                for (let i = 0; i < hosts.length; i++) {
                    if (tab.url.includes(hosts[i])) {
                        chrome.tabs.remove(tab.id);
                    }
                }
            }
        });
    });
};

// Closes all sports wagering tabs upon message receipt. This is done here,
// in a background task, as only background tasks and popups can close tabs.
// Note that we currently don't examine the message at all, as the only message
// sent in this system is a message to close all sportsbook tabs.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === CLOSE_SPORTSBOOK_TABS) {
        closeSportsbookTabs(message.settings);
    } else if (message.action === OPEN_OPTIONS_TAB) {
        chrome.runtime.openOptionsPage();
    }
    sendResponse({result: "OK"});
});
