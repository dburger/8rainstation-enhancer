const removeChildren = (elem) => {
    while (elem.lastChild) {
        elem.removeChild(elem.lastChild);
    }
}

const createInputText = (value) => {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.value = value;
    return input;
};

const createTextTd = (text) => {
    const td = document.createElement("td");
    td.innerText = text;
    return td;
}

const createDeleteRowTd = () => {
  const td = createTextTd("X");
  td.className = "deleter";
  return td;
};

const createInputTd = (value, className) => {
    const td = document.createElement("td");
    td.appendChild(createInputText(value));
    if (className) {
        td.className = className;
    }
    return td;
}

const createBookDetailsRow = (key, oddsGroup, urlTemplate) => {
    const tr = document.createElement("tr");
    tr.appendChild(createDeleteRowTd());
    tr.appendChild(createInputTd(key));
    tr.appendChild(createInputTd(oddsGroup));
    tr.appendChild(createInputTd(urlTemplate, "url"));
    return tr;
};

const createKeyValueRow = (key, value) => {
    const tr = document.createElement("tr");
    tr.appendChild(createDeleteRowTd());
    tr.appendChild(createTextTd(key));
    tr.appendChild(createTextTd(value));
    return tr;
}

const addBookDetailsRow = (tbody, key, oddsGroup, urlTemplate) => {
    tbody.appendChild(createBookDetailsRow(key, oddsGroup, urlTemplate));
};

const addKeyValueRow = (tbody, key, value) => {
    tbody.appendChild(createKeyValueRow(key, value));
};

const loadBookDetails = (bookDetails) => {
    const tbody = document.getElementById("bookDetailsBody");
    removeChildren(tbody);

    for (const [key, bd] of Object.entries(bookDetails)) {
        addBookDetailsRow(tbody, key, bd.oddsGroup, bd.urlTemplate);
    }
};

const loadActiveBooks = (activeBooksMap) => {
    const tbody = document.getElementById("activeBooksBody");
    removeChildren(tbody);

    for (const [key, value] of Object.entries(activeBooksMap)) {
        addKeyValueRow(tbody, key, value);
    }
};

const loadActiveBookWeightings = (activeBookWeightingsMap) => {
    const tbody = document.getElementById("activeBookWeightingsBody");
    removeChildren(tbody);

    for (const [key, value] of Object.entries(activeBookWeightingsMap)) {
        addKeyValueRow(tbody, key, objectToString(value));
    }
};

const loadSettings = (settings) => {
    loadBookDetails(settings.bookDetailsMap);
    loadActiveBooks(settings.activeBooksMap);
    loadActiveBookWeightings(settings.activeBookWeightingsMap);
};

document.addEventListener("DOMContentLoaded", (evt) => {
    getSettings(loadSettings);

    const bookDetailsBody = document.getElementById("bookDetailsBody");
    const activeBooksBody = document.getElementById("activeBooksBody");
    const activeBookWeightingsBody = document.getElementById("activeBookWeightingsBody");

    const saveButton = document.getElementById("save");
    const reloadButton = document.getElementById("reload");
    const defaultsButton = document.getElementById("defaults");
    const addButton = document.getElementById("add");

    saveButton.addEventListener("click", (evt) => {
        console.log("save");
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

        setSettings(bookDetails, activeBooksNames, activeBookWeightingsNames, (e) => {
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

    bookDetailsBody.addEventListener("click", (evt) => {
        if (evt.target.tagName === "TD" && evt.target.innerText === "X") {
            bookDetailsBody.removeChild(evt.target.parentElement);
        }
    });

    activeBooksBody.addEventListener("click", (evt) => {
        if (evt.target.tagName === "TD" && evt.target.innerText === "X") {
            activeBooksBody.removeChild(evt.target.parentElement);
        }
    });

    activeBookWeightingsBody.addEventListener("click", (evt) => {
        if (evt.target.tagName === "TD" && evt.target.innerText === "X") {
            activeBookWeightingsBody.removeChild(evt.target.parentElement);
        }
    });
});
