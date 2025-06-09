import { deepMerge } from "./utils/helpers";
// hermes-extension/background.js

console.log("Hermes Extension: Background Service Worker Initializing...");

// --- Storage Key Constants (using '_ext' to avoid userscript conflicts) ---
const PROFILE_KEY_EXT = 'hermes_profile_ext';
const MACRO_KEY_EXT = 'hermes_macros_ext';
const MAPPING_KEY_EXT = 'hermes_mappings_ext';
const OVERLAY_STATE_KEY_EXT = 'hermes_overlay_state_ext';
const LEARNING_STATE_KEY_EXT = 'hermes_learning_state_ext';
const DEBUG_MODE_KEY_EXT = 'hermes_debug_mode_ext';
const POSITION_KEY_EXT = 'hermes_position_ext';
const WHITELIST_KEY_EXT = 'hermes_whitelist_ext';
const THEME_KEY_EXT = 'hermes_theme_ext';
const CUSTOM_THEMES_KEY_EXT = 'hermes_custom_themes_ext';
const BUNCHED_STATE_KEY_EXT = 'hermes_bunched_state_ext';
const EFFECTS_STATE_KEY_EXT = 'hermes_effects_state_ext';
const HELP_PANEL_OPEN_KEY_EXT = 'hermes_help_panel_state_ext';
const SETTINGS_KEY_EXT = 'hermes_settings_v1_ext';

const builtInThemes = {
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

// --- GitHub configuration for remote site configs ---
// Replace these placeholder values with your actual repository details
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/_Configs/';
const GITHUB_API_BASE = 'https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/contents/_Configs/';
const GITHUB_TOKEN = ''; // Personal access token if writing back to the repo

// --- In-memory cache for Hermes data ---
let hermesState = {
    settings: {},
    profile: {},
    macros: {},
    mappings: {},
    theme: 'dark',
    customThemes: {},
    builtInThemes,
    isBunched: false,
    effectsMode: 'none',
    showOverlays: true,
    learningMode: false,
    debugMode: false,
    uiPosition: { top: null, left: null },
    whitelist: [],
    helpPanelOpen: false,
    configs: {}
};

// `defaultSettings` object extracted from your "Hermes System - Themable! 14 - fix ... .user.js"
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
        "similarityThreshold": 0.5,
        "_comment_similarityThreshold": "Minimum similarity score (0-1) for heuristic field matching. Default: 0.5."
    }
};
async function initializeHermesState() {
    console.log("Hermes BG: Initializing Hermes state from chrome.storage.local...");

    if (!defaultSettingsFromUserscript || Object.keys(defaultSettingsFromUserscript).length === 0) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("Hermes BG: `defaultSettingsFromUserscript` IS EMPTY OR UNDEFINED.");
        console.error("This usually means the settings object was not correctly pasted from the userscript.");
        console.error("Please ensure the full `defaultSettings` object is assigned to `defaultSettingsFromUserscript`.");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        // Fallback to a very minimal structure to prevent further errors, but this is not ideal.
        hermesState.settings = { effects: {} };
    }

    const storageKeysDefaults = {
        [SETTINGS_KEY_EXT]: JSON.stringify(defaultSettingsFromUserscript),
        [PROFILE_KEY_EXT]: '{}',
        [MACRO_KEY_EXT]: '{}',
        [MAPPING_KEY_EXT]: '{}',
        [THEME_KEY_EXT]: 'dark',
        [CUSTOM_THEMES_KEY_EXT]: '{}',
        hermes_built_in_themes: JSON.stringify(builtInThemes),
        [BUNCHED_STATE_KEY_EXT]: false,
        [EFFECTS_STATE_KEY_EXT]: 'none',
        [OVERLAY_STATE_KEY_EXT]: true,
        [LEARNING_STATE_KEY_EXT]: false,
        [DEBUG_MODE_KEY_EXT]: false,
        [POSITION_KEY_EXT]: JSON.stringify({ top: null, left: null }),
        [WHITELIST_KEY_EXT]: JSON.stringify([]),
        [HELP_PANEL_OPEN_KEY_EXT]: false
    };

    try {
        const storedData = await chrome.storage.local.get(storageKeysDefaults);
        console.log("Hermes BG: Data retrieved from storage (or defaults used):", storedData);

        let loadedSettings = {};
        try {
            loadedSettings = JSON.parse(storedData[SETTINGS_KEY_EXT]);
        } catch (e) {
            console.error("Hermes BG: Error parsing stored settings JSON, using default from userscript.", e);
            loadedSettings = defaultSettingsFromUserscript; 
        }
        
        hermesState.settings = deepMerge(defaultSettingsFromUserscript, loadedSettings);

        try { hermesState.profile = JSON.parse(storedData[PROFILE_KEY_EXT]); }
        catch (e) { console.error("Hermes BG: Error parsing profile JSON.", e); hermesState.profile = {}; }

        try { hermesState.macros = JSON.parse(storedData[MACRO_KEY_EXT]); }
        catch (e) { console.error("Hermes BG: Error parsing macros JSON.", e); hermesState.macros = {}; }

        try { hermesState.mappings = JSON.parse(storedData[MAPPING_KEY_EXT]); }
        catch (e) { console.error("Hermes BG: Error parsing mappings JSON.", e); hermesState.mappings = {}; }

        hermesState.theme = storedData[THEME_KEY_EXT];
        try { hermesState.customThemes = JSON.parse(storedData[CUSTOM_THEMES_KEY_EXT]); }
        catch (e) { console.error("Hermes BG: Error parsing custom themes JSON.", e); hermesState.customThemes = {}; }
        hermesState.builtInThemes = builtInThemes;
        hermesState.isBunched = storedData[BUNCHED_STATE_KEY_EXT];
        hermesState.effectsMode = storedData[EFFECTS_STATE_KEY_EXT];
        hermesState.showOverlays = storedData[OVERLAY_STATE_KEY_EXT];
        hermesState.learningMode = storedData[LEARNING_STATE_KEY_EXT];
        hermesState.debugMode = storedData[DEBUG_MODE_KEY_EXT];

        try { hermesState.uiPosition = JSON.parse(storedData[POSITION_KEY_EXT]); }
        catch (e) { console.error("Hermes BG: Error parsing uiPosition JSON.", e); hermesState.uiPosition = { top: null, left: null }; }

        try { hermesState.whitelist = JSON.parse(storedData[WHITELIST_KEY_EXT]); }
        catch (e) { console.error("Hermes BG: Error parsing whitelist JSON.", e); hermesState.whitelist = []; }

        hermesState.helpPanelOpen = storedData[HELP_PANEL_OPEN_KEY_EXT];

        chrome.storage.local.set({
            hermes_built_in_themes: JSON.stringify(builtInThemes)
        });

        console.log("Hermes BG: State initialization complete. Current learningMode:", hermesState.learningMode, "debugMode:", hermesState.debugMode);

    } catch (error) {
        console.error("Hermes BG: CRITICAL error initializing Hermes state:", error);
    }
}


chrome.runtime.onInstalled.addListener((details) => {
    console.log("Hermes BG: Extension event -", details.reason);
    initializeHermesState();
});

initializeHermesState();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, payload } = message;
    console.log(`Hermes BG: Message received - Type: ${type}`, payload || "", `From Tab: ${sender.tab ? sender.tab.id : 'N/A'}`);

    switch (type) {
        case "GET_HERMES_INITIAL_DATA":
            sendResponse(JSON.parse(JSON.stringify(hermesState)));
            break;

        case "GET_SITE_CONFIG":
            if (!payload || !payload.site) {
                console.error("Hermes BG: GET_SITE_CONFIG missing site in payload", payload);
                sendResponse({ success: false, error: "Missing site" });
                return true;
            }
            const site = payload.site.toLowerCase();
            if (hermesState.configs[site]) {
                sendResponse({ success: true, config: hermesState.configs[site] });
            } else {
                const localUrl = chrome.runtime.getURL(`configs/${site}.json`);
                fetch(localUrl)
                    .then(r => { if (!r.ok) throw new Error('local'); return r.json(); })
                    .then(cfg => { hermesState.configs[site] = cfg; sendResponse({ success: true, config: cfg }); })
                    .catch(() => {
                        const remoteUrl = `${GITHUB_RAW_BASE}${site}.json`;
                        fetch(remoteUrl)
                            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
                            .then(cfg => { hermesState.configs[site] = cfg; sendResponse({ success: true, config: cfg }); })
                            .catch(err => { console.warn(`Hermes BG: Config for ${site} not found`, err); sendResponse({ success: false, error: err.toString() }); });
                    });
            }
            return true;

        case "SAVE_SITE_CONFIG":
            if (!payload || !payload.site || !payload.config) {
                sendResponse({ success: false, error: "Missing site or config" });
                return true;
            }
            (async () => {
                const fileUrl = `${GITHUB_API_BASE}${payload.site}.json`;
                const content = btoa(JSON.stringify(payload.config, null, 2));
                const body = { message: `Add config for ${payload.site}`, content };
                try {
                    const res = await fetch(fileUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : undefined
                        },
                        body: JSON.stringify(body)
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    hermesState.configs[payload.site] = payload.config;
                    sendResponse({ success: true });
                } catch (err) {
                    console.error('Hermes BG: Failed to save config', err);
                    sendResponse({ success: false, error: err.toString() });
                }
            })();
            return true;

        case "SAVE_HERMES_DATA":
            if (!payload || typeof payload.key === 'undefined') { // Check if key exists
                console.error("Hermes BG: Invalid SAVE_HERMES_DATA payload. Missing key.", payload);
                sendResponse({ success: false, error: "Missing key in payload" });
                return true;
            }

            const { key, value } = payload;
            let dataToStoreInChromeStorage = {};
            let successfullyUpdatedInMemoryState = true;

            switch (key) {
                case SETTINGS_KEY_EXT: hermesState.settings = value; break;
                case PROFILE_KEY_EXT: hermesState.profile = value; break;
                case MACRO_KEY_EXT: hermesState.macros = value; break;
                case MAPPING_KEY_EXT: hermesState.mappings = value; break;
                case THEME_KEY_EXT: hermesState.theme = value; break;
                case BUNCHED_STATE_KEY_EXT: hermesState.isBunched = value; break;
                case EFFECTS_STATE_KEY_EXT: hermesState.effectsMode = value; break;
                case OVERLAY_STATE_KEY_EXT: hermesState.showOverlays = value; break;
                case LEARNING_STATE_KEY_EXT: hermesState.learningMode = value; break;
                case DEBUG_MODE_KEY_EXT: hermesState.debugMode = value; break;
                case POSITION_KEY_EXT: hermesState.uiPosition = value; break;
                case WHITELIST_KEY_EXT: hermesState.whitelist = value; break;
                case CUSTOM_THEMES_KEY_EXT: hermesState.customThemes = value; break;
                case HELP_PANEL_OPEN_KEY_EXT: hermesState.helpPanelOpen = value; break;
                default:
                    console.warn("Hermes BG: Unknown key for SAVE_HERMES_DATA:", key);
                    successfullyUpdatedInMemoryState = false;
                    sendResponse({ success: false, error: `Unknown storage key: ${key}` });
                    return true; 
            }

            if (successfullyUpdatedInMemoryState) {
                if (typeof value === 'object' || Array.isArray(value)) {
                    dataToStoreInChromeStorage[key] = JSON.stringify(value);
                } else {
                    dataToStoreInChromeStorage[key] = value;
                }

                chrome.storage.local.set(dataToStoreInChromeStorage, () => {
                    if (chrome.runtime.lastError) {
                        console.error(`Hermes BG: Error saving data for key ${key}:`, chrome.runtime.lastError.message);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        console.log(`Hermes BG: Data successfully saved for key ${key}. LearningMode: ${hermesState.learningMode}, DebugMode: ${hermesState.debugMode}`);
                        sendResponse({ success: true });
                    }
                });
            }
            break;

        default:
            console.warn("Hermes BG: Received unknown message type:", type);
            sendResponse({ success: false, error: `Unknown message type: ${type}` });
            break;
    }

    return true; 
});

console.log("Hermes BG: All event listeners set up. Ready for messages.");

