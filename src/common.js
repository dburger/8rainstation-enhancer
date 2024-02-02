// NOTE: This is not done as a module (with export, for example) because
// content scripts can't easily import modules. Thus this is done as shared
// Javascript with:
//
// 1) The manifest listing this file as one of the files for content-script.js
// 2) The background.js file importing this file with the importScripts call

// NOTE: We use callbacks instead of async/await within this project because
// content-scripts can't import modules easily and things get a little wonky
// when using async/await from non-module code. Thus instead of mixing
// approaches, we just use callbacks exclusively.

// TODO(dburger): javascript enums or other approach?
const CLOSE_SPORTSBOOK_TABS = "closeSportsBookTabs";

const makeSettings = () => {
  return {
    settings: {
    }
  };
};

const DEFAULT_SETTINGS = makeSettings();

const getSettings = (callback) => {
  chrome.storage.sync.get(DEFAULT_SETTINGS, callback);
}

const setSettings = (callback) => {
  chrome.storage.sync.set(makeSettings(), callback);
}
