// src/react/background.ts

import browser from './utils/browserApi';

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_HERMES_DATA') {
    browser.storage.local.set({ [message.payload.key]: message.payload.value }, () => {
      if (browser.runtime.lastError) {
        sendResponse({ success: false, error: browser.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  }

  if (message.type === 'GET_HERMES_INITIAL_DATA') {
    const keys = ['hermes_settings_v1_ext', 'hermes_profile_ext', 'hermes_macros_ext', 'hermes_theme_ext'];
    browser.storage.local.get(keys, (result) => {
      if (browser.runtime.lastError) {
        sendResponse({ error: browser.runtime.lastError.message });
      } else {
        sendResponse({
          settings: result.hermes_settings_v1_ext || {},
          profile: result.hermes_profile_ext || {},
          macros: result.hermes_macros_ext || {},
          theme: result.hermes_theme_ext || 'dark',
        });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

// Setup for the extension icon click
browser.action.onClicked.addListener((tab) => {
  if (tab.id) {
    // Check if the content script is already there before injecting
    browser.tabs.sendMessage(tab.id, { type: 'HERMES_PING' }, (response) => {
      if (browser.runtime.lastError) {
        // Script not there, inject it
        browser.scripting.executeScript({
          target: { tabId: tab.id! },
          files: [browser.runtime.getURL('dist/content.js')],
        });
      } else {
        // Script is there, maybe tell it to show/hide
        browser.tabs.sendMessage(tab.id, { type: 'HERMES_TOGGLE_UI' });
      }
    });
  }
});
