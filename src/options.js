const loadSettings = (settings) => {
    console.log("loading settings", settings);
    // Array.from(settings) and then sort by the first element, I think.
    // actually it is in settings.settings, do you want that?
    for (const [key, value] of Object.entries(settings)) {
        console.log("key", key);
        console.log("value", value);
    }
};

document.addEventListener("DOMContentLoaded", (evt) => {
    getSettings(loadSettings);
});
