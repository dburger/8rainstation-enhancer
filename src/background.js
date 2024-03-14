importScripts("./common.js");

// Note that we are manipulating tabs in a background task because
// we wanted to be able to open the same book in the same tab,
// and window.open only opens in new tabs when "noreferrer" is
// specified.

// These were tested with:
// https://www.whatismybrowser.com/detect/what-is-my-referrer
// and so that no referrer is available.

/**
 * Creates or updates tabs as indicated.
 *
 * @param book {string} - The book to create tabs for. Note that all books in
 *     the same odds group will be launched.
 * @param homeTeam {string} - The home team in the contest. Used to create
 *     more specific URLs when possible.
 * @param index {number} - The index of the 8rain Station tab. This will be
 *     used to place new tabs relative to the station tab.
 * @param bookDetailsMap {Object} - The mapping of book text keys to book
 *     details as stored in the settings. See {@link makeVersionedSettings}.
 * @param bookLinkTarget {string} - The indicator of how to open the tabs.
 */
const createOrUpdateTabs = (book, homeTeam, index, bookDetailsMap, bookLinkTarget) => {
    // TODO(dburger): allow strategies, "_blank" versus "book".
    const bookDetails = bookDetailsMap[book];
    if (bookDetails) {
        // From here we'll pass this as an array so this value can be updated in called functions.
        const indexArray = [index + 1];
        for (const [name, bd] of Object.entries(bookDetailsMap)) {
            if (bd.oddsGroup === bookDetails.oddsGroup) {
                let url = bd.urlTemplate;
                if (homeTeam) {
                    url = url.replace("${homeTeam}", homeTeam);
                }
                createOrUpdateTab(bd, url, bookLinkTarget, indexArray);
            }
        }
    }
};

/**
 * Creates or updates a tab for all books in the given book details
 * odds group.
 *
 * @param bookDetails {{string: {string, string, string}}} - The book
 *     details indicating which tabs to handle.
 * @param url {string} - The URL to open for the book.
 * @param bookLinkTarget {string} - The indicator of how to open the tabs.
 * @param indexArray - The array containing the index position to open the tab at, if necessary.
 *     Passed as an array so that we can update the value if we needed to create a tab.
 */
const createOrUpdateTab = (bookDetails, url, bookLinkTarget, indexArray) => {
    if (bookLinkTarget === BOOK_LINK_TARGET_BOOK_TAB) {
        // Try to find the book and update the URL, if not found fall back to create.
        chrome.tabs.query({url: "https://*/*"}, (tabs) => {
            let updated = false;
            for (const tab of tabs) {
                if (tab.url.includes(bookDetails.hostname)) {
                    chrome.tabs.update(tab.id, {url: url, highlighted: true});
                    updated = true;
                    break;
                }
            }
            if (!updated) {
                chrome.tabs.create({url: url, index: indexArray[0]++});
            }
        });
    } else {
        // We assume BOOK_LINK_TARGET_NEW_TAB.
        chrome.tabs.create({url: url, index: indexArray[0]++});
    }
};

/**
 * Opens sportsbook tabs for all sportsbooks in the given book's odds group.
 *
 * @param book {string} - The book key name of the book to open tabs for.
 * @param homeTeam {string} - The home team in the contest. Used to produce more
 *     specific URLs where possible.
 * @param bookDetailsMap {Object} - The mapping of book text keys to book
 *     details as stored in the settings. See {@link makeVersionedSettings}.
 * @param bookLinkTarget {string} - The indicator of how to open the tabs.
 */
const openSportsbookTabs = (book, homeTeam, bookDetailsMap, bookLinkTarget) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        // 8rain Station tab index.
        const index = tabs[0].index;
        createOrUpdateTabs(book, homeTeam, index, bookDetailsMap, bookLinkTarget);
    });
};

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
    if (message.action === OPEN_SPORTSBOOK_TABS) {
        openSportsbookTabs(message.book, message.homeTeam, message.settings.bookDetailsMap, message.settings.bookLinkTarget);
    } else if (message.action === CLOSE_SPORTSBOOK_TABS) {
        closeSportsbookTabs(message.settings.bookDetailsMap);
    } else if (message.action === OPEN_OPTIONS_TAB) {
        chrome.runtime.openOptionsPage();
    }
    sendResponse({result: "OK"});
});
