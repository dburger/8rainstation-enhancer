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

const createBooksRow = (key, urlTemplate) => {
    const tr = document.createElement("tr");
    tr.appendChild(createDeleteRowTd());
    tr.appendChild(createBooksRowTd(key));
    tr.appendChild(createBooksRowTd(urlTemplate, "url"));
    return tr;
};

const loadSettings = (settings) => {
    const tbody = document.getElementById("booksBody");
    removeChildren(tbody);

    // Array.from(settings) and then sort by the first element, I think.
    // actually it is in settings.settings, do you want that?
    for (const [key, value] of Object.entries(settings.settings)) {
      tbody.appendChild(createBooksRow(key, value.urlTemplate));
    }
};

document.addEventListener("DOMContentLoaded", (evt) => {
    getSettings(loadSettings);

    const saveButton = document.getElementById("save");
    const reloadButton = document.getElementById("reload");
    const defaultsButton = document.getElementById("defaults");

    saveButton.addEventListener("click", (evt) => {
        console.log("save");
    });

    reloadButton.addEventListener("click", (evt) => {
        getSettings(loadSettings);
    });

    defaultsButton.addEventListener("click", (evt) => {
        chrome.storage.sync.clear();
        getSettings(loadSettings);
    });

    // const booksTable = document.getElementById("books");
    const tbody = document.getElementById("booksBody")
    tbody.addEventListener("click", (evt) => {
        if (evt.target.tagName === "TD" && evt.target.innerText === "X") {
            tbody.removeChild(evt.target.parentElement);
        }
    });
});
