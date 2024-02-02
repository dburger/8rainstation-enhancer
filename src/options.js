const createInputText = (value) => {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.value = value;
    return input;
};

const createBooksRowTd = (value) => {
    const td = document.createElement("td");
    td.appendChild(createInputText(value));
    return td;
}

const createBooksRow = (key, urlTemplate) => {
    const tr = document.createElement("tr");
    tr.appendChild(createBooksRowTd(key));
    tr.appendChild(createBooksRowTd(urlTemplate));
    return tr;
};

const loadSettings = (settings) => {
    const booksTable = document.getElementById("books");
    const tbody = booksTable.querySelector("tbody");

    // Array.from(settings) and then sort by the first element, I think.
    // actually it is in settings.settings, do you want that?
    for (const [key, value] of Object.entries(settings.settings)) {
      tbody.appendChild(createBooksRow(key, value.urlTemplate));
    }
};

document.addEventListener("DOMContentLoaded", (evt) => {
    getSettings(loadSettings);
});
