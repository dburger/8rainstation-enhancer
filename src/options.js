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

const createDeleteRowTd = () => {
  const td = document.createElement("td");
  td.innerText = "X";
  td.className = "deleter";
  return td;
};

const createBooksRowTd = (value, className) => {
    const td = document.createElement("td");
    td.appendChild(createInputText(value));
    if (className) {
        td.className = className;
    }
    return td;
}

const createBooksRow = (key, oddsGroup, urlTemplate) => {
    const tr = document.createElement("tr");
    tr.appendChild(createDeleteRowTd());
    tr.appendChild(createBooksRowTd(key));
    tr.appendChild(createBooksRowTd(oddsGroup));
    tr.appendChild(createBooksRowTd(urlTemplate, "url"));
    return tr;
};

const addBookRow = (tbody, key, oddsGroup, urlTemplate) => {
    tbody.appendChild(createBooksRow(key, oddsGroup, urlTemplate));
};

const loadSettings = (settings) => {
    const tbody = document.getElementById("booksBody");
    removeChildren(tbody);

    // Array.from(settings) and then sort by the first element, I think.
    // actually it is in settings.settings, do you want that?
    for (const [key, value] of Object.entries(settings.settings)) {
        addBookRow(tbody, key, value.oddsGroup, value.urlTemplate);
    }
};

document.addEventListener("DOMContentLoaded", (evt) => {
    getSettings(loadSettings);

    const saveButton = document.getElementById("save");
    const reloadButton = document.getElementById("reload");
    const defaultsButton = document.getElementById("defaults");
    const addButton = document.getElementById("add");

    saveButton.addEventListener("click", (evt) => {
        console.log("save");
        const books = [];
        for (const tr of tbody.childNodes) {
            const key = tr.childNodes[1].childNodes[0].value;
            const oddsGroup = tr.childNodes[2].childNodes[0].value;
            const urlTemplate = tr.childNodes[3].childNodes[0].value;
            books.push([key, oddsGroup, urlTemplate]);
        }
        setSettings(books, (e) => {
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
        addBookRow(tbody, "", "");
    });

    // const booksTable = document.getElementById("books");
    const tbody = document.getElementById("booksBody")
    tbody.addEventListener("click", (evt) => {
        if (evt.target.tagName === "TD" && evt.target.innerText === "X") {
            tbody.removeChild(evt.target.parentElement);
        }
    });
});
