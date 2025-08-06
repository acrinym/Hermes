// src/react/background.ts
import { browserApi } from './utils/browserApi';
import { STORAGE_KEYS, MESSAGE_TYPES } from '../constants';

// --- GitHub configuration for remote site configs ---
// These values can be stored in chrome.storage under the keys below or
// provided as environment variables at build time.
const GITHUB_RAW_BASE_KEY = STORAGE_KEYS.GITHUB_RAW_BASE;
const GITHUB_API_BASE_KEY = STORAGE_KEYS.GITHUB_API_BASE;
const GITHUB_TOKEN_KEY = STORAGE_KEYS.GITHUB_TOKEN;

let GITHUB_RAW_BASE = '';
let GITHUB_API_BASE = '';
let GITHUB_TOKEN = '';

async function loadGithubSettings() {
  const data = await browserApi.storage.local.get({
    [GITHUB_RAW_BASE_KEY]: '',
    [GITHUB_API_BASE_KEY]: '',
    [GITHUB_TOKEN_KEY]: ''
  });
  
  // Use browserApi.storage values or fallback to environment variables
  GITHUB_RAW_BASE = data[GITHUB_RAW_BASE_KEY] || process.env.GITHUB_RAW_BASE || '';
  GITHUB_API_BASE = data[GITHUB_API_BASE_KEY] || process.env.GITHUB_API_BASE || '';
  GITHUB_TOKEN = data[GITHUB_TOKEN_KEY] || process.env.GITHUB_TOKEN || '';
  
  // Debug logging removed for production - use debug utility if needed
  // console.log('Hermes BG: GitHub settings loaded', {
  //   rawBase: GITHUB_RAW_BASE ? '✓' : '✗',
  //   apiBase: GITHUB_API_BASE ? '✓' : '✗', 
  //   token: GITHUB_TOKEN ? '✓' : '✗'
  // });
}

// Initialize GitHub settings on startup
loadGithubSettings();

// Listen for messages from content scripts
browserApi.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
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

  if (message.type === MESSAGE_TYPES.GET_HERMES_INITIAL_DATA) {
    const keys = [STORAGE_KEYS.SETTINGS, STORAGE_KEYS.PROFILE, STORAGE_KEYS.MACROS, STORAGE_KEYS.THEME];
    browserApi.storage.local.get(keys, (result: any) => {
      if (browserApi.runtime.lastError) {
        sendResponse({ error: browserApi.runtime.lastError.message });
      } else {
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

  if (message.type === MESSAGE_TYPES.GET_GITHUB_CONFIG) {
    sendResponse({
      rawBase: GITHUB_RAW_BASE,
      apiBase: GITHUB_API_BASE,
      token: GITHUB_TOKEN
    });
    return true;
  }

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
        // Update local variables
        GITHUB_RAW_BASE = rawBase || '';
        GITHUB_API_BASE = apiBase || '';
        GITHUB_TOKEN = token || '';
        sendResponse({ success: true });
      }
    });
    return true;
  }
});

// Setup for the extension icon click
browserApi.action.onClicked.addListener((tab: any) => {
  if (tab.id) {
    // Check if the content script is already there before injecting
    browserApi.tabs.sendMessage(tab.id, { type: MESSAGE_TYPES.HERMES_PING }, (response: any) => {
      if (browserApi.runtime.lastError) {
        // Script not there, inject it
        browserApi.scripting.executeScript({
          target: { tabId: tab.id! },
          files: [browserApi.runtime.getURL('dist/content.js')],
        });
      } else {
        // Script is there, maybe tell it to show/hide
        browserApi.tabs.sendMessage(tab.id, { type: 'HERMES_TOGGLE_UI' });
      }
    });
  }
});