// src/react/background.ts
import { browserApi } from './utils/browserApi';
import { STORAGE_KEYS, MESSAGE_TYPES } from '../constants';

// --- GitHub configuration for remote site configs ---
const GITHUB_RAW_BASE_KEY = STORAGE_KEYS.GITHUB_RAW_BASE;
const GITHUB_API_BASE_KEY = STORAGE_KEYS.GITHUB_API_BASE;
const GITHUB_TOKEN_KEY = STORAGE_KEYS.GITHUB_TOKEN;

let GITHUB_RAW_BASE = '';
let GITHUB_API_BASE = '';
let GITHUB_TOKEN = '';

/**
 * Loads GitHub settings from local storage, falling back to environment variables.
 * This runs when the background script first starts.
 */
async function loadGithubSettings() {
  const data = await browserApi.storage.local.get({
    [GITHUB_RAW_BASE_KEY]: '',
    [GITHUB_API_BASE_KEY]: '',
    [GITHUB_TOKEN_KEY]: ''
  });

  // Use storage values first, then fallback to environment variables
  GITHUB_RAW_BASE = data[GITHUB_RAW_BASE_KEY] || process.env.GITHUB_RAW_BASE || '';
  GITHUB_API_BASE = data[GITHUB_API_BASE_KEY] || process.env.GITHUB_API_BASE || '';
  GITHUB_TOKEN = data[GITHUB_TOKEN_KEY] || process.env.GITHUB_TOKEN || '';
}

// Initialize GitHub settings on startup
loadGithubSettings();

/**
 * Listens for messages from other parts of the extension (like content scripts or popups).
 */
browserApi.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  // --- Handler for saving data ---
  if (message.type === MESSAGE_TYPES.SAVE_HERMES_DATA) {
    browserApi.storage.local.set({ [message.payload.key]: message.payload.value }, () => {
      if (browserApi.runtime.lastError) {
        sendResponse({ success: false, error: browserApi.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true; // Indicates asynchronous response
  }

  // --- Handler for getting all initial app data ---
  if (message.type === MESSAGE_TYPES.GET_HERMES_INITIAL_DATA) {
    const keys = [STORAGE_KEYS.SETTINGS, STORAGE_KEYS.PROFILE, STORAGE_KEYS.MACROS, STORAGE_KEYS.THEME];
    browserApi.storage.local.get(keys, (result: any) => {
      if (browserApi.runtime.lastError) {
        sendResponse({ error: browserApi.runtime.lastError.message });
      } else {
        // Provide safe defaults to prevent errors in the frontend
        sendResponse({
          settings: result[STORAGE_KEYS.SETTINGS] || {},
          profile: result[STORAGE_KEYS.PROFILE] || {},
          macros: result[STORAGE_KEYS.MACROS] || {},
          theme: result[STORAGE_KEYS.THEME] || 'dark',
        });
      }
    });
    return true; // Indicates asynchronous response
  }

  // --- Handler for getting the current GitHub config ---
  if (message.type === MESSAGE_TYPES.GET_GITHUB_CONFIG) {
    sendResponse({
      rawBase: GITHUB_RAW_BASE,
      apiBase: GITHUB_API_BASE,
      token: GITHUB_TOKEN
    });
    return true;
  }

  // --- Handler for updating the GitHub config ---
  if (message.type === MESSAGE_TYPES.UPDATE_GITHUB_CONFIG) {
    const { rawBase, apiBase, token } = message.payload;
    browserApi.storage.local.set({
      [GITHUB_RAW_BASE_KEY]: rawBase || '',
      [GITHUB_API_BASE_KEY]: apiBase || '',
      [GITHUB_TOKEN_KEY]: token || ''
    }, () => {
      if (browserApi.runtime.lastError) {
        sendResponse({ success: false, error: browserApi.runtime.lastError.message });
      } else {
        // Update the in-memory variables immediately after saving
        loadGithubSettings().then(() => {
            sendResponse({ success: true });
        });
      }
    });
    return true;
  }
});

/**
 * Handles clicks on the extension's icon in the browser toolbar.
 */
browserApi.action.onClicked.addListener((tab: any) => {
  if (tab.id) {
    // Ping the content script to see if it's already injected and active
    browserApi.tabs.sendMessage(tab.id, { type: MESSAGE_TYPES.HERMES_PING }, (response: any) => {
      if (browserApi.runtime.lastError) {
        // If there's an error, it means the script isn't there. Inject it.
        browserApi.scripting.executeScript({
          target: { tabId: tab.id! },
          files: [browserApi.runtime.getURL('dist/content.js')],
        });
      } else {
        // If the script responded, just send a message to toggle the UI
        browserApi.tabs.sendMessage(tab.id, { type: 'HERMES_TOGGLE_UI' });
      }
    });
  }
});