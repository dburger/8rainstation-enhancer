importScripts("./common.js");

/**
 * Closes all tabs opened to sportsbook sites per the settings. Runs in a
 * background task as only background tasks can work with tabs.
 *
 * @param bookDetailsMap {Object} - The mapping of book text keys to book
 *     details as stored in the settings. See {@link makeVersionedSettings}.
 */
const closeSportsbookTabs = (bookDetailsMap) => {
    const hosts = Object.values(bookDetailsMap).map(bd => bd.hostname);
    hosts.push("app.8rainstation.com");
    chrome.tabs.query({url: "https://*/*"}, (tabs) => {
        tabs.forEach((tab) => {
            if (!tab.active) {
                for (let i = 0; i < hosts.length; i++) {
                    if (tab.url.includes(hosts[i])) {
                        chrome.tabs.remove(tab.id);
                        break;
                    }
                }
            }
        });
    });
};

/**
 * Hooks into the message bus and responds to messages. Used to dispatch tasks
 * that require a background context.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === CLOSE_SPORTSBOOK_TABS) {
        closeSportsbookTabs(message.settings.bookDetailsMap);
    } else if (message.action === OPEN_OPTIONS_TAB) {
        chrome.runtime.openOptionsPage();
    }
    sendResponse({result: "OK"});
});
