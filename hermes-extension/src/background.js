import { deepMerge } from "./utils/helpers.js";
// hermes-extension/background.js

console.log("Hermes Extension: Background Service Worker Initializing...");

// --- Storage Key Constants (using '_ext' to avoid userscript conflicts) ---
const STORAGE_KEYS = {
    PROFILE: 'hermes_profile_ext',
    MACRO: 'hermes_macros_ext',
    MAPPING: 'hermes_mappings_ext',
    OVERLAY_STATE: 'hermes_overlay_state_ext',
    AFFIRM_STATE: 'hermes_affirmations_state_ext',
    SCRATCH_NOTES: 'hermes_scratch_notes_ext',
    LEARNING_STATE: 'hermes_learning_state_ext',
    DEBUG_MODE: 'hermes_debug_mode_ext',
    POSITION: 'hermes_position_ext',
    WHITELIST: 'hermes_whitelist_ext',
    THEME: 'hermes_theme_ext',
    CUSTOM_THEMES: 'hermes_custom_themes_ext',
    BUNCHED_STATE: 'hermes_bunched_state_ext',
    EFFECTS_STATE: 'hermes_effects_state_ext',
    HELP_PANEL_OPEN: 'hermes_help_panel_state_ext',
    ONBOARDED: 'hermes_onboarded_ext',
    SETTINGS: 'hermes_settings_v1_ext',
    DISABLED_HOSTS: 'hermes_disabled_hosts_ext',
    GITHUB_RAW_BASE: 'github_raw_base',
    GITHUB_API_BASE: 'github_api_base',
    GITHUB_TOKEN: 'github_token',
    BUILT_IN_THEMES: 'hermes_built_in_themes' // For internal storage of built-in themes if needed
};

// --- Debug Log Storage ---
let debugLogs = [];

const builtInThemes = {
    system: { name: 'System', emoji: '💻' },
    light: { name: 'Light', emoji: '☀️' },
    dark: { name: 'Dark', emoji: '🌙' },
    phoenix: { name: 'Phoenix', emoji: '🦅' },
    seaGreen: { name: 'Sea Green', emoji: '🐢' },
    auroraGlow: { name: 'Aurora Glow', emoji: '🌠' },
    crimsonEmber: { name: 'Crimson Ember', emoji: '🔥' },
    slateStorm: { name: 'Slate Storm', emoji: '⛈️' },
    classicSlate: { name: 'Classic Slate', emoji: '🪨' },
    classicWheat: { name: 'Classic Wheat', emoji: '🌾' },
    classicTeal: { name: 'Classic Teal', emoji: '🦚' },
    classicSpruce: { name: 'Classic Spruce', emoji: '🌲' },
    classicStorm: { name: 'Classic Storm', emoji: '⚡' },
    rose: { name: 'Rose', emoji: '🌹' },
    pumpkin: { name: 'Pumpkin', emoji: '🎃' },
    marine: { name: 'Marine', emoji: '⚓' },
    rainyDay: { name: 'Rainy Day', emoji: '🌧️' },
    eggplant: { name: 'Eggplant', emoji: '🍆' },
    plum: { name: 'Plum', emoji: '💜' },
    redBlueWhite: { name: 'Red Blue White', emoji: '🇺🇸' },
    maple: { name: 'Maple', emoji: '🍁' },
    lilac: { name: 'Lilac', emoji: '🌸' },
    desert: { name: 'Desert', emoji: '🏜️' },
    brick: { name: 'Brick', emoji: '🧱' },
    sunset: { name: 'Sunset', emoji: '🌇' },
    forest: { name: 'Forest', emoji: '🌳' },
    neon: { name: 'Neon', emoji: '💡' }
};

let githubConfig = {
    rawBase: '',
    apiBase: '',
    token: ''
};

async function loadGithubSettings() {
    const data = await chrome.storage.local.get({
        [STORAGE_KEYS.GITHUB_RAW_BASE]: '',
        [STORAGE_KEYS.GITHUB_API_BASE]: '',
        [STORAGE_KEYS.GITHUB_TOKEN]: ''
    });
    githubConfig.rawBase = data[STORAGE_KEYS.GITHUB_RAW_BASE] || process.env.GITHUB_RAW_BASE || '';
    githubConfig.apiBase = data[STORAGE_KEYS.GITHUB_API_BASE] || process.env.GITHUB_API_BASE || '';
    githubConfig.token = data[STORAGE_KEYS.GITHUB_TOKEN] || process.env.GITHUB_TOKEN || '';
}

// --- In-memory cache for Hermes data ---
let hermesState = {
    settings: {},
    profile: {},
    macros: {},
    mappings: {},
    theme: 'dark',
    customThemes: {},
    builtInThemes, // Direct reference to the constant
    isBunched: false,
    effectsMode: 'none',
    showOverlays: true,
    showAffirmations: false,
    scratchNotes: [],
    learningMode: false,
    debugMode: false,
    uiPosition: { top: null, left: null },
    whitelist: [],
    disabledHosts: [],
    helpPanelOpen: false,
    onboarded: false,
    configs: {}
};

// `defaultSettings` object extracted from your "hermes-system-themable-14.user.js"
// These `_comment_` fields are retained as they are used for UI hovertext/description.
const defaultSettingsFromUserscript = {
    "_comment_main_ui": "Settings for the main Hermes UI appearance.",
    "hermesBorderThickness": "1px",
    "_comment_hermesBorderThickness": "Thickness of the main Hermes UI border. Default: '1px'. Recommended: '1px' to '3px'.",
    "_comment_effects": "Settings for visual effects. Note: Excessive values might impact performance.",
    "effects": {
        "_comment_lasers_v13": "Settings for the 'Classic Laser' effect.",
        "lasersV13": {
            "lineThickness": 2,
            "_comment_lineThickness": "Thickness of each laser line in pixels. Default: 2. Range: 1-10.",
            "transparency": 0.3,
            "_comment_transparency": "Opacity of laser lines. Default: 0.3. Range: 0.1-1.0.",
            "colors": ["rgba(255,0,0,{alpha})", "rgba(0,255,0,{alpha})", "rgba(0,0,255,{alpha})"],
            "_comment_colors": "Array of colors for laser lines. Use RGBA format with '{alpha}' for transparency. Default: Red, Green, Blue. Example: ['rgba(255,0,0,{alpha})'].",
            "numLines": 3,
            "_comment_numLines": "Number of laser lines on screen. Default: 3. Range: 1-10 (more can impact performance)."
        },
        "_comment_snowflakes_v13": "Settings for the 'Snowflake' effect.",
        "snowflakesV13": {
            "density": 50,
            "_comment_density": "Number of snowflakes. Default: 50. Range: 10-200 (higher values impact performance).",
            "baseColor": "rgba(240, 240, 240, {alpha})",
            "_comment_baseColor": "Base color for snowflakes. Use RGBA with '{alpha}'. Default: 'rgba(240, 240, 240, {alpha})'.",
            "emoji": "❄️",
            "_comment_emoji": "Emoji(s) to use for snowflakes. Default: '❄️'. Paste your preferred emoji or a list like ['❄️', '❅', '❆']. If using text/emoji, set baseColor alpha to 0 or use an emoji font that renders well.",
            "useEmojiOrShape": "emoji",
            "_comment_useEmojiOrShape": "Determines if snowflakes are rendered as 'emoji' or 'shape' (using baseColor). Default: 'emoji'.",
            "minSize": 1,
            "_comment_minSize": "Minimum size of snowflakes (pixels for shape, arbitrary unit for emoji). Default: 1. Range: 1-5.",
            "maxSize": 3,
            "_comment_maxSize": "Maximum size of snowflakes. Default: 3. Range: 1-10.",
            "minSpeed": 0.5,
            "_comment_minSpeed": "Minimum falling speed. Default: 0.5. Range: 0.1-5.",
            "maxSpeed": 1.5,
            "_comment_maxSpeed": "Maximum falling speed. Default: 1.5. Range: 0.1-5.",
            "opacityMin": 0.3,
            "_comment_opacityMin": "Minimum opacity for snowflake shapes. Default: 0.3. Range: 0.1-1.0.",
            "opacityMax": 0.8,
            "_comment_opacityMax": "Maximum opacity for snowflake shapes. Default: 0.8. Range: 0.1-1.0.",
            "font": "1em sans-serif",
            "_comment_font": "Font used for rendering emoji snowflakes. Adjust size with min/maxSize. Default: '1em sans-serif'."
        },
        "_comment_lasers_v14": "Settings for the 'Simple Laser' (falling rain) effect.",
        "lasersV14": {
            "density": 0.05,
            "_comment_density": "Chance (0.0 to 1.0) to spawn a new laser each frame. Default: 0.05. Range: 0.01-0.2.",
            "maxLength": 70,
            "_comment_maxLength": "Maximum length of a laser line. Default: 70. Range: 10-200.",
            "minLength": 20,
            "_comment_minLength": "Minimum length of a laser line. Default: 20. Range: 5-100.",
            "maxSpeed": 15,
            "_comment_maxSpeed": "Maximum falling speed. Default: 15. Range: 1-50.",
            "minSpeed": 5,
            "_comment_minSpeed": "Minimum falling speed. Default: 5. Range: 1-30.",
            "color": "rgba(255, 0, 0, 0.7)",
            "_comment_color": "Color of the V14 lasers. Default: 'rgba(255, 0, 0, 0.7)'.",
            "lineWidth": 2,
            "_comment_lineWidth": "Line width for V14 lasers. Default: 2. Range: 1-5."
        },
        "_comment_strobe_v13": "Settings for the 'Classic Strobe' effect.",
        "strobeV13": {
            "speed": 0.1,
            "_comment_speed": "Speed of color transition/strobe pulse. Default: 0.1. Range: 0.01-0.5.",
            "minOpacity": 0.4,
            "_comment_minOpacity": "Minimum opacity during strobe. Default: 0.4. Range: 0.0-1.0.",
            "maxOpacityFactor": 0.3,
            "_comment_maxOpacityFactor": "Factor determining peak opacity from base. Default: 0.3. Range: 0.0-1.0.",
            "color1": "rgba(255, 0, 0, {alpha})",
            "_comment_color1": "First color for the strobe. Default: 'rgba(255, 0, 0, {alpha})'.",
            "color2": "rgba(0, 0, 255, {alpha})",
            "_comment_color2": "Second color for the strobe. Default: 'rgba(0, 0, 255, {alpha})'."
        },
        "_comment_strobe_v14": "Settings for the 'Simple Strobe' effect.",
        "strobeV14": {
            "speed": 0.1,
            "_comment_speed": "Speed of opacity pulse. Default: 0.1. Range: 0.01-0.5.",
            "maxOpacity": 0.2,
            "_comment_maxOpacity": "Maximum opacity during strobe. Default: 0.2. Range: 0.0-1.0.",
            "color": "rgba(255, 255, 255, {alpha})",
            "_comment_color": "Color for the simple strobe. Default: 'rgba(255, 255, 255, {alpha})'."
        }
    },
    "_comment_macro": "Settings for macro recording/playback and heuristics.",
    "macro": {
        "recordMouseMoves": false,
        "_comment_recordMouseMoves": "Record mousemove events while recording macros. Default: false.",
        "mouseMoveInterval": 200,
        "_comment_mouseMoveInterval": "Minimum time in ms between recorded mousemove events. Default: 200.",
        "useCoordinateFallback": false,
        "_comment_useCoordinateFallback": "When elements can't be found by selector, use recorded x/y coordinates or DOM path.",
        "relativeCoordinates": true,
        "_comment_relativeCoordinates": "Adjust recorded coordinates based on current element position.",
        "similarityThreshold": 0.5,
        "_comment_similarityThreshold": "Minimum similarity score (0-1) for heuristic field matching. Default: 0.5."
    }
};

async function initializeHermesState() {
    console.log("Hermes BG: Initializing Hermes state from chrome.storage.local...");

    await loadGithubSettings();

    if (!defaultSettingsFromUserscript || Object.keys(defaultSettingsFromUserscript).length === 0) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("Hermes BG: `defaultSettingsFromUserscript` IS EMPTY OR UNDEFINED.");
        console.error("This usually means the settings object was not correctly pasted from the userscript.");
        console.error("Please ensure the full `defaultSettings` object is assigned to `defaultSettingsFromUserscript`.");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        // Fallback to a very minimal structure to prevent further errors, but this is not ideal.
        hermesState.settings = { effects: {}, macro: {} };
    }

    const storageKeysDefaults = {
        [STORAGE_KEYS.SETTINGS]: JSON.stringify(defaultSettingsFromUserscript),
        [STORAGE_KEYS.PROFILE]: '{}',
        [STORAGE_KEYS.MACRO]: '{}',
        [STORAGE_KEYS.MAPPING]: '{}',
        [STORAGE_KEYS.THEME]: 'dark',
        [STORAGE_KEYS.CUSTOM_THEMES]: '{}',
        [STORAGE_KEYS.BUILT_IN_THEMES]: JSON.stringify(builtInThemes),
        [STORAGE_KEYS.BUNCHED_STATE]: false,
        [STORAGE_KEYS.EFFECTS_STATE]: 'none',
        [STORAGE_KEYS.OVERLAY_STATE]: true,
        [STORAGE_KEYS.AFFIRM_STATE]: false,
        [STORAGE_KEYS.SCRATCH_NOTES]: '[]',
        [STORAGE_KEYS.LEARNING_STATE]: false,
        [STORAGE_KEYS.DEBUG_MODE]: false,
        [STORAGE_KEYS.POSITION]: JSON.stringify({ top: null, left: null }),
        [STORAGE_KEYS.WHITELIST]: '[]',
        [STORAGE_KEYS.HELP_PANEL_OPEN]: false,
        [STORAGE_KEYS.DISABLED_HOSTS]: '[]',
        [STORAGE_KEYS.ONBOARDED]: false
    };

    try {
        const storedData = await chrome.storage.local.get(storageKeysDefaults);
        console.log("Hermes BG: Data retrieved from storage (or defaults used):", storedData);

        // Function to safely parse JSON
        const safeParse = (key, defaultValue) => {
            try {
                const parsed = JSON.parse(storedData[key]);
                // Ensure deep merge is applied for settings to pick up new default properties
                if (key === STORAGE_KEYS.SETTINGS) {
                    return deepMerge(defaultValue, parsed);
                }
                return parsed;
            } catch (e) {
                console.error(`Hermes BG: Error parsing ${key} JSON, using default.`, e);
                return defaultValue;
            }
        };

        // Initialize state properties, using safeParse for JSON strings and direct assignment for others
        hermesState.settings = safeParse(STORAGE_KEYS.SETTINGS, defaultSettingsFromUserscript);
        hermesState.profile = safeParse(STORAGE_KEYS.PROFILE, {});
        hermesState.macros = safeParse(STORAGE_KEYS.MACRO, {});
        hermesState.mappings = safeParse(STORAGE_KEYS.MAPPING, {});
        hermesState.theme = storedData[STORAGE_KEYS.THEME];
        hermesState.customThemes = safeParse(STORAGE_KEYS.CUSTOM_THEMES, {});
        hermesState.builtInThemes = builtInThemes; // Always use the latest built-in themes from the constant
        hermesState.isBunched = storedData[STORAGE_KEYS.BUNCHED_STATE];
        hermesState.effectsMode = storedData[STORAGE_KEYS.EFFECTS_STATE];
        hermesState.showOverlays = storedData[STORAGE_KEYS.OVERLAY_STATE];
        hermesState.showAffirmations = storedData[STORAGE_KEYS.AFFIRM_STATE];
        hermesState.scratchNotes = safeParse(STORAGE_KEYS.SCRATCH_NOTES, []);
        hermesState.learningMode = storedData[STORAGE_KEYS.LEARNING_STATE];
        hermesState.debugMode = storedData[STORAGE_KEYS.DEBUG_MODE];
        hermesState.uiPosition = safeParse(STORAGE_KEYS.POSITION, { top: null, left: null });
        hermesState.whitelist = safeParse(STORAGE_KEYS.WHITELIST, []);
        hermesState.disabledHosts = safeParse(STORAGE_KEYS.DISABLED_HOSTS, []);
        hermesState.helpPanelOpen = storedData[STORAGE_KEYS.HELP_PANEL_OPEN];
        hermesState.onboarded = storedData[STORAGE_KEYS.ONBOARDED];

        // Ensure built-in themes are stored for future reference/consistency
        chrome.storage.local.set({
            [STORAGE_KEYS.BUILT_IN_THEMES]: JSON.stringify(builtInThemes)
        });

        console.log("Hermes BG: State initialization complete.");
    } catch (error) {
        console.error("Hermes BG: CRITICAL error initializing Hermes state:", error);
    }
}

chrome.runtime.onInstalled.addListener((details) => {
    console.log("Hermes BG: Extension event -", details.reason);
    initializeHermesState();
});

// Initialize state on startup as well
initializeHermesState();

chrome.contextMenus.create({
    id: 'toggle-hermes',
    title: 'Disable Hermes on this site',
    contexts: ['page']
});

function updateContextMenu(tab) {
    if (!tab || !tab.url) return;
    try {
        const host = new URL(tab.url).hostname;
        // Ensure hermesState.disabledHosts is initialized before using includes
        const isDisabled = hermesState.disabledHosts?.includes(host);
        chrome.contextMenus.update('toggle-hermes', {
            title: isDisabled ? 'Enable Hermes on this site' : 'Disable Hermes on this site'
        });
    } catch (e) {
        // Ignore invalid URLs like chrome://extensions
    }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== 'toggle-hermes' || !tab || !tab.id || !tab.url) return;
    const host = new URL(tab.url).hostname;
    // Ensure the list is a mutable array
    const list = Array.isArray(hermesState.disabledHosts) ? [...hermesState.disabledHosts] : [];
    const idx = list.indexOf(host);
    const wasDisabled = idx > -1; // If found, it means it's currently disabled.

    if (wasDisabled) {
        list.splice(idx, 1); // Remove from disabled list (enabling it)
    } else {
        list.push(host); // Add to disabled list (disabling it)
    }

    // Update the in-memory state and storage
    hermesState.disabledHosts = list;
    chrome.storage.local.set({ [STORAGE_KEYS.DISABLED_HOSTS]: JSON.stringify(list) });

    updateContextMenu(tab);
    // Send message to content script to update its state
    // If it WAS disabled (wasDisabled=true), it's now ENABLED (payload.enabled=true).
    // If it WAS enabled (wasDisabled=false), it's now DISABLED (payload.enabled=false).
    chrome.tabs.sendMessage(tab.id, { type: 'SET_ENABLED', payload: { enabled: !wasDisabled } });
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        updateContextMenu(tab);
    } catch (e) {
        console.warn(`Hermes BG: Could not get tab for onActivated event:`, e.message);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateContextMenu(tab);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, payload } = message;
    console.log(`Hermes BG: Message received - Type: ${type}`, payload || "", `From Tab: ${sender.tab ? sender.tab.id : 'N/A'}`);

    // This function ensures sendResponse is called, even if async operations are involved.
    // It makes the listener return true to indicate an async response.
    const handleMessage = async () => {
        switch (type) {
            case "GET_HERMES_INITIAL_DATA":
                sendResponse(JSON.parse(JSON.stringify(hermesState)));
                break;

            case "GET_SITE_CONFIG":
                if (!payload || !payload.site) {
                    console.error("Hermes BG: GET_SITE_CONFIG missing site in payload", payload);
                    sendResponse({ success: false, error: "Missing site" });
                    return;
                }
                const site = payload.site.toLowerCase();
                if (hermesState.configs[site]) {
                    sendResponse({ success: true, config: hermesState.configs[site] });
                } else {
                    try {
                        const localUrl = chrome.runtime.getURL(`configs/${site}.json`);
                        let response = await fetch(localUrl);
                        if (!response.ok) {
                            // If local fetch fails, try remote
                            const remoteUrl = `${githubConfig.rawBase}${site}.json`;
                            response = await fetch(remoteUrl);
                            if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        }
                        const cfg = await response.json();
                        hermesState.configs[site] = cfg;
                        sendResponse({ success: true, config: cfg });
                    } catch (err) {
                        console.warn(`Hermes BG: Config for ${site} not found locally or remotely`, err);
                        sendResponse({ success: false, error: err.toString() });
                    }
                }
                break;

            case "SAVE_SITE_CONFIG":
                if (!payload || !payload.site || !payload.config) {
                    sendResponse({ success: false, error: "Missing site or config" });
                    return;
                }
                const fileUrl = `${githubConfig.apiBase}${payload.site}.json`;
                const content = btoa(JSON.stringify(payload.config, null, 2));
                let body = { message: `Add config for ${payload.site}`, content };
                const headers = { 'Content-Type': 'application/json' };
                if (githubConfig.token) headers['Authorization'] = `token ${githubConfig.token}`;

                try {
                    const existingRes = await fetch(fileUrl, { headers });
                    if (existingRes.ok) {
                        const info = await existingRes.json();
                        body.message = `Update config for ${payload.site}`;
                        body.sha = info.sha;
                    }
                } catch (err) {
                    // Ignore if file doesn't exist, will be created with PUT
                }

                try {
                    const res = await fetch(fileUrl, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify(body)
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    hermesState.configs[payload.site] = payload.config;
                    sendResponse({ success: true });
                } catch (err) {
                    console.error('Hermes BG: Failed to save config', err);
                    sendResponse({ success: false, error: err.toString() });
                }
                break;

            case "SAVE_HERMES_DATA":
                if (!payload || typeof payload.key === 'undefined') {
                    console.error("Hermes BG: Invalid SAVE_HERMES_DATA payload. Missing key.", payload);
                    sendResponse({ success: false, error: "Missing key in payload" });
                    return;
                }

                const { key, value } = payload;
                let dataToStoreInChromeStorage = {};
                let successfullyUpdatedInMemoryState = true;

                switch (key) {
                    case STORAGE_KEYS.SETTINGS: hermesState.settings = value; break;
                    case STORAGE_KEYS.PROFILE: hermesState.profile = value; break;
                    case STORAGE_KEYS.MACRO: hermesState.macros = value; break;
                    case STORAGE_KEYS.MAPPING: hermesState.mappings = value; break;
                    case STORAGE_KEYS.THEME: hermesState.theme = value; break;
                    case STORAGE_KEYS.BUNCHED_STATE: hermesState.isBunched = value; break;
                    case STORAGE_KEYS.EFFECTS_STATE: hermesState.effectsMode = value; break;
                    case STORAGE_KEYS.OVERLAY_STATE: hermesState.showOverlays = value; break;
                    case STORAGE_KEYS.AFFIRM_STATE: hermesState.showAffirmations = value; break;
                    case STORAGE_KEYS.SCRATCH_NOTES: hermesState.scratchNotes = value; break;
                    case STORAGE_KEYS.LEARNING_STATE: hermesState.learningMode = value; break;
                    case STORAGE_KEYS.DEBUG_MODE: hermesState.debugMode = value; break;
                    case STORAGE_KEYS.POSITION: hermesState.uiPosition = value; break;
                    case STORAGE_KEYS.WHITELIST: hermesState.whitelist = value; break;
                    case STORAGE_KEYS.DISABLED_HOSTS: hermesState.disabledHosts = value; break;
                    case STORAGE_KEYS.CUSTOM_THEMES: hermesState.customThemes = value; break;
                    case STORAGE_KEYS.HELP_PANEL_OPEN: hermesState.helpPanelOpen = value; break;
                    case STORAGE_KEYS.ONBOARDED: hermesState.onboarded = value; break;
                    default:
                        console.warn("Hermes BG: Unknown key for SAVE_HERMES_DATA:", key);
                        successfullyUpdatedInMemoryState = false;
                        sendResponse({ success: false, error: `Unknown storage key: ${key}` });
                        return;
                }

                if (successfullyUpdatedInMemoryState) {
                    dataToStoreInChromeStorage[key] = (typeof value === 'object' || Array.isArray(value)) ? JSON.stringify(value) : value;

                    chrome.storage.local.set(dataToStoreInChromeStorage, () => {
                        if (chrome.runtime.lastError) {
                            console.error(`Hermes BG: Error saving data for key ${key}:`, chrome.runtime.lastError.message);
                            sendResponse({ success: false, error: chrome.runtime.lastError.message });
                        } else {
                            console.log(`Hermes BG: Data successfully saved for key ${key}.`);
                            sendResponse({ success: true });
                        }
                    });
                }
                break;

            case "ADD_DEBUG_LOG":
                if (payload) {
                    debugLogs.push(payload);
                }
                sendResponse({ success: true });
                break;

            case "GET_DEBUG_LOGS":
                sendResponse({ success: true, logs: debugLogs });
                break;

            case "CLEAR_DEBUG_LOGS":
                debugLogs = [];
                sendResponse({ success: true });
                break;

            default:
                console.warn("Hermes BG: Received unknown message type:", type);
                sendResponse({ success: false, error: `Unknown message type: ${type}` });
                break;
        }
    };

    // Call the async handler and return true to keep the message channel open
    handleMessage();
    return true;
});

console.log("Hermes BG: All event listeners set up. Ready for messages.");