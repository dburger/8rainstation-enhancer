/**
 * Removes all the children of an element.
 *
 * @param elem {HTMLElement} - The element to remove the children of.
 */
const removeChildren = (elem) => {
    while (elem.lastChild) {
        elem.removeChild(elem.lastChild);
    }
}

/**
 * Creates and returns an input of type text with the given value.
 *
 * @param value {string} - The value to give the text input.
 * @returns {HTMLInputElement} - The created text input.
 */
const createInputText = (value) => {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.value = value;
    return input;
};

/**
 * Creates and returns a table cell td element with the given text.
 *
 * @param text {string} - The text to give the element.
 * @returns {HTMLTableCellElement} - The created td element.
 */
const createTextTd = (text) => {
    const td = document.createElement("td");
    td.innerText = text;
    return td;
}

/**
 * Creates and returns a td element with text "X" to be used to
 * delete the row.
 *
 * @returns {HTMLTableCellElement} - The created td element.
 */
const createDeleteRowTd = () => {
  const td = createTextTd("X");
  td.className = "deleter";
  return td;
};

/**
 * Creates and returns a td element with an up arrow to be used to
 * move the row up.
 *
 * @returns {HTMLTableCellElement} - The created td element.
 */
const createUpRowTd = () => {
    const td = createTextTd("\u2191");
    td.className = "upper";
    return td;
};

/**
 * Creates and returns a td element with a down arrow to be used to
 * move the row down.
 *
 * @returns {HTMLTableCellElement} - The created td element.
 */
const createDownRowTd = () => {
    const td = createTextTd("\u2193");
    td.className = "downer";
    return td;
};

/**
 * Creates and returns a td element containing a text input element with
 * the given value.
 *
 * @param value {string} - The value to give the text input element.
 * @param className {string} - The class name to give the td, if any.
 * @returns {HTMLTableCellElement} - The created td element.
 */
const createInputTd = (value, className) => {
    const td = document.createElement("td");
    td.appendChild(createInputText(value));
    if (className) {
        td.className = className;
    }
    return td;
}

/**
 * Creates and returns a book details row.
 *
 * @param key {string} - The book text key.
 * @param oddsGroup {string} - The odds group the book belongs to.
 * @param urlTemplate {string} - The URL template for link generation.
 * @returns {HTMLTableRowElement} - The created book details row.
 */
const createBookDetailsRow = (key, oddsGroup, urlTemplate) => {
    const tr = document.createElement("tr");
    tr.appendChild(createDeleteRowTd());
    tr.appendChild(createInputTd(key));
    tr.appendChild(createInputTd(oddsGroup));
    tr.appendChild(createInputTd(urlTemplate, "url"));
    return tr;
};

const createPlaymarkDetailsRow = (name, playmark) => {
    const tr = document.createElement("tr");
    tr.appendChild(createDeleteRowTd());
    tr.appendChild(createTextTd(name));
    tr.appendChild(createUpRowTd());
    tr.appendChild(createDownRowTd());
    tr.appendChild(createTextTd(playmark));
    return tr;
};

/**
 * Creates and returns a deletable key value row.
 *
 * @param key {string} - The key to use for the row.
 * @param value {string} - The value to use for the row.
 * @returns {HTMLTableRowElement} - The created key value row.
 */
const createKeyValueRow = (key, value) => {
    const tr = document.createElement("tr");
    tr.appendChild(createDeleteRowTd());
    tr.appendChild(createTextTd(key));
    tr.appendChild(createTextTd(value));
    return tr;
}

/**
 * Adds a new book details row.
 *
 * @param tbody {HTMLElement} - HTML tbody to add the row to.
 * @param key {string} - The book name for the row.
 * @param oddsGroup {string} - The odds group for the row.
 * @param urlTemplate {string} - The URL template for the row.
 */
const addBookDetailsRow = (tbody, key, oddsGroup, urlTemplate) => {
    tbody.appendChild(createBookDetailsRow(key, oddsGroup, urlTemplate));
};

/**
 * Adds a new key value row.
 *
 * @param tbody {HTMLElement} - HTML tbody to add the row to.
 * @param key {string} - The key for the row.
 * @param value {string} - The value for the row.
 */
const addKeyValueRow = (tbody, key, value) => {
    tbody.appendChild(createKeyValueRow(key, value));
};

const addPlaymarkDetailsRow = (tbody, name, playmark) => {
    tbody.appendChild(createPlaymarkDetailsRow(name, playmark));
};

/**
 * Loads the given playmarks into the playmarks table.
 *
 * @param playmarksMap {{string: string}} - The map of playmarks to load.
 */
const loadPlaymarks = (playmarkDetailsMap) => {
    const tbody = document.getElementById("playmarksBody");
    removeChildren(tbody);

    for (const [name, pd] of Object.entries(playmarkDetailsMap).sort(sortPlaymarkEntries)) {
        addPlaymarkDetailsRow(tbody, name, pd.playmark);
    }
};

/**
 * Loads the given book details into the book details table.
 *
 * @param bookDetails {{string: {string, string, string}}} - The book
 *     details to load.
 */
const loadBookDetails = (bookDetails) => {
    const tbody = document.getElementById("bookDetailsBody");
    removeChildren(tbody);

    for (const [key, bd] of Object.entries(bookDetails)) {
        addBookDetailsRow(tbody, key, bd.oddsGroup, bd.urlTemplate);
    }
};

/**
 * Loads the given active books into the active books table.
 *
 * @param activeBooksMap {{string: string[]}} - The mapping of names to
 *     active books for that name to load.
 */
const loadActiveBooks = (activeBooksMap) => {
    const tbody = document.getElementById("activeBooksBody");
    removeChildren(tbody);

    for (const [key, value] of Object.entries(activeBooksMap)) {
        addKeyValueRow(tbody, key, value);
    }
};

/**
 * Loads the given active book weightings into the active book weightings table.
 *
 * @param activeBookWeightingsMap {{string: {string: number}}} - The mapping of
 *     names to book weightings to load.
 */
const loadActiveBookWeightings = (activeBookWeightingsMap) => {
    const tbody = document.getElementById("activeBookWeightingsBody");
    removeChildren(tbody);

    for (const [key, value] of Object.entries(activeBookWeightingsMap)) {
        addKeyValueRow(tbody, key, objectToString(value));
    }
};

/**
 * Loads the given settings into the page.
 *
 * @param settings {@see makeVersionedSettings}
 */
const loadSettings = (settings) => {
    loadPlaymarks(settings.playmarkDetailsMap);
    loadBookDetails(settings.bookDetailsMap);
    loadActiveBooks(settings.activeBooksMap);
    loadActiveBookWeightings(settings.activeBookWeightingsMap);
};

/** Initial page configuration, loads settings into the page. */
document.addEventListener("DOMContentLoaded", (evt) => {
    getSettings(loadSettings);

    const playmarksBody = document.getElementById("playmarksBody");
    const bookDetailsBody = document.getElementById("bookDetailsBody");
    const activeBooksBody = document.getElementById("activeBooksBody");
    const activeBookWeightingsBody = document.getElementById("activeBookWeightingsBody");

    const saveButton = document.getElementById("save");
    const reloadButton = document.getElementById("reload");
    const defaultsButton = document.getElementById("defaults");
    const addButton = document.getElementById("add");

    saveButton.addEventListener("click", (evt) => {
        const playmarkDetails = [];
        for (let i = 0; i < playmarksBody.childNodes.length; i++) {
            const row = playmarksBody.childNodes[i];
            playmarkDetails.push([row.childNodes[1].innerText, i, row.childNodes[4].innerText]);
        }

        const bookDetails = [];
        for (const tr of bookDetailsBody.childNodes) {
            const key = tr.childNodes[1].childNodes[0].value;
            const oddsGroup = tr.childNodes[2].childNodes[0].value;
            const urlTemplate = tr.childNodes[3].childNodes[0].value;
            bookDetails.push([key, oddsGroup, urlTemplate]);
        }

        const activeBooksNames = [];
        for (const tr of activeBooksBody.childNodes) {
            activeBooksNames.push(tr.childNodes[1].innerText);
        }

        const activeBookWeightingsNames = [];
        for (const tr of activeBookWeightingsBody.childNodes) {
            activeBookWeightingsNames.push(tr.childNodes[1].innerText);
        }

        setSettings(playmarkDetails, bookDetails, activeBooksNames, activeBookWeightingsNames, () => {
            if (chrome.runtime.lastError) {
                window.alert(chrome.runtime.lastError.message);
            }
        });
    });

    reloadButton.addEventListener("click", (evt) => {
        getSettings(loadSettings);
    });

    defaultsButton.addEventListener("click", (evt) => {
        chrome.storage.sync.clear();
        getSettings(loadSettings);
    });

    addButton.addEventListener("click", (evt) => {
        addBookDetailsRow(bookDetailsBody, "", "", "");
    });

    const isDeleter = (target) => {
        return target.tagName === "TD" && target.classList.contains("deleter");
    };

    const isUpper = (target) => {
        return target.tagName === "TD" && target.classList.contains("upper");
    };

    const isDowner = (target) => {
        return target.tagName === "TD" && target.classList.contains("downer");
    };

    playmarksBody.addEventListener("click", (evt) => {
        if (isDeleter(evt.target)) {
            playmarksBody.removeChild(evt.target.parentElement);
        } else if (isUpper(evt.target)) {
            const row = evt.target.parentElement;
            const priorRow = row.previousSibling;
            if (priorRow) {
                insertBefore(row, priorRow);
            }
        } else if (isDowner(evt.target)) {
            const row = evt.target.parentElement;
            const nextRow = row.nextSibling;
            if (nextRow) {
                insertAfter(row, nextRow);
            }
        }
    });

    bookDetailsBody.addEventListener("click", (evt) => {
        if (isDeleter(evt.target)) {
            bookDetailsBody.removeChild(evt.target.parentElement);
        }
    });

    activeBooksBody.addEventListener("click", (evt) => {
        if (isDeleter(evt.target)) {
            activeBooksBody.removeChild(evt.target.parentElement);
        }
    });

    activeBookWeightingsBody.addEventListener("click", (evt) => {
        if (isDeleter(evt.target)) {
            activeBookWeightingsBody.removeChild(evt.target.parentElement);
        }
    });
});
