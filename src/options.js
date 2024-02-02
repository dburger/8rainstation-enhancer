const loadSettings = (settings) => {
    console.log("loading settings", settings);
};

document.addEventListener("DOMContentLoaded", (evt) => {
    getSettings(loadSettings);
});
