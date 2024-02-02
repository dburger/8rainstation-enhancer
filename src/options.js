const loadSettings = (settings) => {
    console.log("loading settings", settings);
    const booksTable = document.getElementById("books");
    const tbody = booksTable.querySelector("tbody");

    // Array.from(settings) and then sort by the first element, I think.
    // actually it is in settings.settings, do you want that?
    for (const [key, value] of Object.entries(settings.settings)) {
        const tr = document.createElement("tr");
        let td = document.createElement("td");
        td.innerText = key;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerText = value.urlTemplate;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
};

document.addEventListener("DOMContentLoaded", (evt) => {
    getSettings(loadSettings);
});
