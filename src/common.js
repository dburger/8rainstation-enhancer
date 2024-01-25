// NOTE: We use callbacks instead of async/await within this project because
// content-scripts can't import modules easily and things get a little wonky
// when using async/await from non-module code. Thus instead of mixing
// approaches, we just use callbacks exclusively.

const makeSettings = () => {
  return {
    settings: {
    }
  }
};

const DEFAULT_SETTINGS = makeSettings();

const getSettings = (callback) => {
  chrome.storage.sync.get(DEFAULT_SETTINGS, callback);
}

const setSettings = (callback) => {
  chrome.storage.sync.set(makeSettings(target, showMark), callback);
}
