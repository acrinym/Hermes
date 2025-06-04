// hermes-extension/content.js

(function() {
    'use strict';

    // =================== Constants & Keys for Messaging Background Script ===================
    // These keys MUST match the ones used in background.js for SAVE_HERMES_DATA
    const PROFILE_KEY_EXT = 'hermes_profile_ext';
    const MACRO_KEY_EXT = 'hermes_macros_ext';
    const MAPPING_KEY_EXT = 'hermes_mappings_ext';
    const OVERLAY_STATE_KEY_EXT = 'hermes_overlay_state_ext';
    const LEARNING_STATE_KEY_EXT = 'hermes_learning_state_ext';
    const DEBUG_MODE_KEY_EXT = 'hermes_debug_mode_ext';
    const POSITION_KEY_EXT = 'hermes_position_ext';
    const WHITELIST_KEY_EXT = 'hermes_whitelist_ext';
    const THEME_KEY_EXT = 'hermes_theme_ext';
    const BUNCHED_STATE_KEY_EXT = 'hermes_bunched_state_ext';
    const EFFECTS_STATE_KEY_EXT = 'hermes_effects_state_ext';
    const HELP_PANEL_OPEN_KEY_EXT = 'hermes_help_panel_state_ext';
    const SETTINGS_KEY_EXT = 'hermes_settings_v1_ext';

    // =================== State Variables (will be populated by initial data load) ===================
    let showOverlays;
    let learningMode;
    let debugMode;
    let uiContainer = null;
    let shadowRoot = null;
    let fillButton = null;
    let editProfileButton = null;
    let recordButton = null;
    let stopSaveButton = null;
    let viewLogButton = null;
    let trainButton = null;
    let overlayToggle = null;
    let learningToggle = null;
    let debugToggle = null;
    let statusIndicator = null;
    let effectsButton = null;
    let helpButton = null;
    let settingsButton = null;

    let isRecording = false;
    let recordedEvents = [];
    let currentMacroName = '';
    let debugLogs = []; // Content script specific logs
    let profileData = {};
    let macros = {};
    let customMappings = {};
    let skippedFields = [];
    let isMinimized = false;
    let minimizedContainer = null;
    let theme;
    let isBunched;
    let effectsMode;
    let helpPanelOpenState; // For persisting help panel open/closed state

    const themeOptions = {
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
        brick: { name: 'Brick', emoji: '🧱' }
    };

    const hermesButtonProperties = {
        fill: { emoji: '📝', text: 'Fill', bunchedText: 'Fl', title: 'Fill forms with profile data' },
        editProfile: { emoji: '✏️', text: 'Edit', bunchedText: 'Ed', title: 'Edit profile data' },
        record: { emoji: '🔴', text: 'Record', bunchedText: 'Rec', title: 'Start recording a macro' },
        stopSave: { emoji: '💾', text: 'Save', bunchedText: 'Sv', title: 'Stop and save macro' },
        macros: { emoji: '📜', text: 'Macros', bunchedText: 'Mac', title: 'Manage and play macros' },
        viewLog: { emoji: '📊', text: 'Logs', bunchedText: 'Log', title: 'View debug logs (Debug Mode)' },
        train: { emoji: '🧠', text: 'Train', bunchedText: 'Trn', title: 'Train field mappings (Learn Mode)' },
        overlayToggle: { emoji: '👁️', text: 'Overlay', bunchedText: 'Ovl', title: 'Toggle field overlays' },
        learningToggle: { emoji: '🎓', text: 'Learn', bunchedText: 'Lrn', title: 'Toggle learning mode' },
        debugToggle: { emoji: '🐞', text: 'Debug', bunchedText: 'Dbg', title: 'Toggle debug mode' },
        themeButton: { emoji: '🎨', text: 'Theme', bunchedText: 'Th', title: 'Change theme' },
        effectsButton: { emoji: '✨', text: 'Effects', bunchedText: 'FX', title: 'Toggle visual effects' },
        bunchButton: { emoji_bunch: '🤏', emoji_expand: '↔️', text_bunch: 'Bunch', text_expand: 'Expand', title_bunch: 'Bunch UI (Compact Vertical)', title_expand: 'Expand UI (Standard Horizontal)'},
        whitelistButton: { emoji: '✅', text: 'Allowlist', bunchedText: 'Allow', title: 'Manage allowed domains' },
        helpButton: { emoji: '❓', text: 'Help', bunchedText: 'Hlp', title: 'Show help panel' },
        sniffButton: { emoji: '👃', text: 'Sniff', bunchedText: 'Snif', title: 'Log form elements for analysis' },
        importButton: { emoji: '📥', text: 'Import', bunchedText: 'Imp', title: 'Import profile from JSON file' },
        settingsButton: { emoji: '⚙️', text: 'Settings', bunchedText: 'Set', title: 'Configure Hermes settings' }
    };

    let justDragged = false;
    let dragging = false;
    let offset = { x: 0, y: 0 };
    const state = { // Local state cache, primarily for UI position. Others come from background.
        position: { top: null, left: null }
    };
    const exampleProfileJSON = JSON.stringify({
        "firstName": "John", "lastName": "Doe", "email": "john.doe@example.com",
        "streetAddress": "123 Main St", "city": "Anytown", "zipCode": "12345",
        "_comment": "Add your data. Keys should match form field names or labels."
    }, null, 2);

    let effectsCanvas = null, effectsCtx = null, effectAnimationFrameId = null;
    let snowflakesV13 = [];
    let lasersV13 = [];
    let strobeStateV13 = { phase: 0, opacity: 0 };
    let lasersV14 = [];
    let strobeStateV14 = { phase: 0, opacity: 0 };
    let whitelist = []; // Local cache for whitelist

    // =================== Settings Management (Content Script Side) ===================
    const defaultSettings = {
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
        }
    };
    let currentSettings = {}; // Will be populated by initial data load from background.js

    // Deep merge utility for settings objects
    function deepMerge(target, source) {
        target = JSON.parse(JSON.stringify(target));
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
                    target[key] = deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    // Helper function to send data to background script for saving
    function saveDataToBackground(storageKey, data) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { type: "SAVE_HERMES_DATA", payload: { key: storageKey, value: data } },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(`Hermes CS: Error saving ${storageKey}:`, chrome.runtime.lastError.message);
                        debugLogs.push({ timestamp: Date.now(), type: 'error', target: `save_${storageKey}_cs`, details: { error: chrome.runtime.lastError.message } });
                        reject(chrome.runtime.lastError.message);
                        return;
                    }
                    if (response && response.success) {
                        console.log(`Hermes CS: Data for ${storageKey} saved via background.`);
                        resolve(true);
                    } else {
                        const errorMsg = response ? response.error : `Unknown error saving ${storageKey}`;
                        console.error(`Hermes CS: Error saving ${storageKey} via background:`, errorMsg);
                        debugLogs.push({ timestamp: Date.now(), type: 'error', target: `save_${storageKey}_cs_bg_fail`, details: { error: errorMsg } });
                        reject(errorMsg);
                    }
                }
            );
        });
    }


    async function saveSettings(settingsToSave) {
        try {
            if (settingsToSave.effects && settingsToSave.effects.lasersV13) {
                settingsToSave.effects.lasersV13.numLines = Math.max(1, Math.min(settingsToSave.effects.lasersV13.numLines || 3, 20));
                settingsToSave.effects.lasersV13.lineThickness = Math.max(1, Math.min(settingsToSave.effects.lasersV13.lineThickness || 2, 10));
                settingsToSave.effects.lasersV13.transparency = Math.max(0.05, Math.min(settingsToSave.effects.lasersV13.transparency || 0.3, 1.0));
            }
            if (settingsToSave.effects && settingsToSave.effects.snowflakesV13) {
                settingsToSave.effects.snowflakesV13.density = Math.max(5, Math.min(settingsToSave.effects.snowflakesV13.density || 50, 300));
            }

            const merged = deepMerge(defaultSettings, settingsToSave);
            await saveDataToBackground(SETTINGS_KEY_EXT, merged);
            currentSettings = merged; // Update local cache
            console.log('Hermes CS: Settings sent to background for saving:', merged);
            debugLogs.push({ timestamp: Date.now(), type: 'settings_save_cs', details: { settings: merged } });
            applyCurrentSettings();
            return true;
        } catch (error) {
            console.error('Hermes CS: Error in saveSettings:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'settings_save_cs_func', details: { error } });
            return false;
        }
    }


    function applyCurrentSettings() {
        if (!shadowRoot || !uiContainer) return; // UI not ready

        if (currentSettings && currentSettings.hermesBorderThickness) {
            uiContainer.style.borderWidth = currentSettings.hermesBorderThickness;
            if (minimizedContainer) minimizedContainer.style.borderWidth = currentSettings.hermesBorderThickness;
        }

        if (effectsMode !== 'none' && !isMinimized) {
            updateEffectsRendering();
        }
        applyTheme(); // Re-apply theme which might use settings for border etc.
    }

    function createSettingsPanel() {
        const panelId = 'hermes-settings-panel';
        if (shadowRoot && shadowRoot.querySelector(`#${panelId}`)) return;

        const explanationsHtml = Object.entries(defaultSettings)
            .filter(([key]) => key.startsWith('_comment_'))
            .map(([key, value]) => {
                const settingKey = key.replace('_comment_', '').replace(/_/g, '.');
                let actualSettingKey = key.replace('_comment_', '');
                let parentKey = null;
                if(actualSettingKey.includes('V13') || actualSettingKey.includes('V14')) {
                    const parts = actualSettingKey.split('_');
                    if(parts.length > 2) {
                        parentKey = parts[0] + parts[1].toUpperCase();
                        actualSettingKey = parts.slice(2).join('_');
                        actualSettingKey = actualSettingKey.charAt(0).toLowerCase() + actualSettingKey.slice(1);
                        if(defaultSettings.effects[parentKey] && defaultSettings.effects[parentKey][actualSettingKey] !== undefined) {
                           // Found nested
                        } else {
                            parentKey = null;
                            actualSettingKey = key.replace('_comment_', '');
                        }
                    }
                }
                return `<div style="margin-bottom: 5px; font-size: 0.85em; opacity: 0.8;">
                            <strong style="color: var(--hermes-info-text);">${parentKey ? `effects.${parentKey}.${actualSettingKey}` : actualSettingKey}:</strong> ${value}
                        </div>`;
            }).join('');

        const contentHtml = `
            <p style="font-size:0.9em;margin-bottom:10px;opacity:0.85;">
                Edit the JSON below to configure Hermes. See explanations for details and recommended ranges.
                Changes are applied upon saving.
            </p>
            <textarea id="hermes-settings-json" style="width:100%;height:40vh;min-height:200px;resize:vertical;font-family:monospace;padding:10px;box-sizing:border-box;"></textarea>
            <h4 style="margin-top:15px; margin-bottom:8px; border-bottom: 1px solid var(--hermes-panel-border); padding-bottom: 5px;">Settings Guide:</h4>
            <div id="hermes-settings-explanations" style="max-height:20vh;overflow-y:auto;padding:5px;background:rgba(0,0,0,0.1);border-radius:4px;">
                ${explanationsHtml}
            </div>`;

        const settingsButtonsHtml = `
            <button id="hermes-settings-save-btn" class="hermes-button" style="background:var(--hermes-success-text);color:var(--hermes-panel-bg);">Save & Apply</button>
            <button id="hermes-settings-defaults-btn" class="hermes-button" style="background:var(--hermes-warning-text);color:var(--hermes-panel-bg);">Load Defaults</button>`;

        createModal(panelId, 'Hermes Configuration Settings', contentHtml, '750px', settingsButtonsHtml);
        const panelInRoot = shadowRoot ? shadowRoot.querySelector(`#${panelId}`) : null;

        if (panelInRoot) {
            const settingsTextarea = panelInRoot.querySelector('#hermes-settings-json');
            const saveBtn = panelInRoot.querySelector('#hermes-settings-save-btn');
            const defaultsBtn = panelInRoot.querySelector('#hermes-settings-defaults-btn');

            if (settingsTextarea) {
                settingsTextarea.value = JSON.stringify(currentSettings, (key, value) => {
                    if (key.startsWith('_comment')) return undefined;
                    return value;
                }, 2);
            }

            if (saveBtn) {
                saveBtn.onclick = async () => {
                    try {
                        const newSettings = JSON.parse(settingsTextarea.value);
                        if (await saveSettings(newSettings)) {
                            if (statusIndicator) { statusIndicator.textContent = 'Settings Saved & Applied'; statusIndicator.style.color = 'var(--hermes-success-text)'; setTimeout(resetStatusIndicator, 2000); }
                        } else {
                            if (statusIndicator) { statusIndicator.textContent = 'Failed to save settings'; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
                        }
                    } catch (error) {
                        console.error('Hermes CS: Invalid JSON in settings:', error);
                        if (statusIndicator) { statusIndicator.textContent = 'Invalid JSON: ' + String(error).substring(0,30); statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 3000); }
                        alert("Error: Invalid JSON in settings data.\n" + error);
                    }
                };
            }
            if (defaultsBtn) {
                defaultsBtn.onclick = () => {
                    if (confirm("Are you sure you want to load default settings? This will update the text area. Save to apply them.")) {
                        settingsTextarea.value = JSON.stringify(defaultSettings, (key, value) => {
                            if (key.startsWith('_comment')) return undefined;
                            return value;
                        }, 2);
                        if (statusIndicator) { statusIndicator.textContent = 'Defaults Loaded into Text Area. Save to apply.'; statusIndicator.style.color = 'var(--hermes-warning-text)'; setTimeout(resetStatusIndicator, 3000); }
                    }
                };
            }
        }
    }

    function toggleSettingsPanel(show) {
        if (!shadowRoot) return;
        let settingsPanel = shadowRoot.querySelector('#hermes-settings-panel');
        if (show && !settingsPanel) {
            createSettingsPanel();
            settingsPanel = shadowRoot.querySelector('#hermes-settings-panel');
        } else if (show && settingsPanel) {
             const settingsTextarea = settingsPanel.querySelector('#hermes-settings-json');
             if(settingsTextarea) {
                 settingsTextarea.value = JSON.stringify(currentSettings, (key, value) => {
                    if (key.startsWith('_comment')) return undefined;
                    return value;
                }, 2);
             }
        }

        if (settingsPanel) {
            if (show) { settingsPanel.style.display = 'block'; applyTheme(); }
            else settingsPanel.style.display = 'none';
        } else if (show) {
            console.error("Hermes CS: Settings panel could not be created/found.");
        }
    }

    const HermesDebug = {
        start() {
            console.log('Hermes CS: Starting debug mode features.');
            console.log('Hermes CS: Debug observer for UI reinjection (basic logging).');
        },
        logs() { return debugLogs; },
        clearLogs() {
            debugLogs = [];
            console.log('Hermes CS: Debug logs cleared.');
            if (shadowRoot && shadowRoot.querySelector('#hermes-log-viewer') && shadowRoot.querySelector('#hermes-log-viewer').style.display === 'block') {
                populateLogViewer();
            }
        }
    };
    window.HermesDebug = HermesDebug;

    function setupDebugControls() {
        console.log('Hermes CS: Setting up debug controls (available in content script context via window.hermesDebugCS)');
        window.hermesDebugCS = {
            toggleOverlay: async () => {
                showOverlays = !showOverlays;
                await saveDataToBackground(OVERLAY_STATE_KEY_EXT, showOverlays);
                if (overlayToggle) updateButtonAppearance(overlayToggle, 'overlayToggle', isBunched);
                if (showOverlays) applyVisualOverlays();
                else removeVisualOverlays();
                console.log('Hermes CS: Overlays toggled:', showOverlays);
            },
            toggleLearning: async () => {
                learningMode = !learningMode;
                await saveDataToBackground(LEARNING_STATE_KEY_EXT, learningMode);
                if (learningToggle) updateButtonAppearance(learningToggle, 'learningToggle', isBunched);
                if (trainButton) trainButton.style.display = learningMode ? 'inline-flex' : 'none';
                console.log('Hermes CS: Learning mode toggled:', learningMode);
            },
            clearLogs: () => HermesDebug.clearLogs(),
            getLogs: () => HermesDebug.logs(),
            printState: () => console.log('Hermes CS Current State:', {
                profileData,
                macros,
                customMappings,
                theme,
                isBunched,
                effectsMode,
                showOverlays,
                learningMode,
                debugMode,
                position: state.position,
                whitelist
            })
        };
    }

    function updateButtonAppearance(buttonElement, configKey, isCurrentlyBunched, dynamicEmoji = null, dynamicText = null) {
        if (!buttonElement || !hermesButtonProperties[configKey]) return;
        const config = hermesButtonProperties[configKey];
        let currentEmoji = dynamicEmoji !== null ? dynamicEmoji : config.emoji;
        let currentText;
        let currentTitle = config.title;

        if (configKey === 'bunchButton') {
            currentEmoji = isCurrentlyBunched ? config.emoji_expand : config.emoji_bunch;
            currentText = isCurrentlyBunched ? config.text_expand : config.text_bunch;
            currentTitle = isCurrentlyBunched ? config.title_expand : config.title_bunch;
        } else {
            currentText = dynamicText !== null ? dynamicText : (isCurrentlyBunched ? (config.bunchedText || config.text) : config.text);
        }

        buttonElement.innerHTML = `${currentEmoji ? currentEmoji + ' ' : ''}${currentText}`;
        buttonElement.title = currentTitle;

        if (configKey === 'overlayToggle') {
            buttonElement.style.background = showOverlays ? 'var(--hermes-highlight-bg)' : 'var(--hermes-button-bg)';
            buttonElement.style.color = showOverlays ? 'var(--hermes-highlight-text)' : 'var(--hermes-button-text)';
        } else if (configKey === 'learningToggle') {
            buttonElement.style.background = learningMode ? 'var(--hermes-highlight-bg)' : 'var(--hermes-button-bg)';
            buttonElement.style.color = learningMode ? 'var(--hermes-highlight-text)' : 'var(--hermes-button-text)';
        } else if (configKey === 'debugToggle') {
            buttonElement.style.background = debugMode ? 'var(--hermes-highlight-bg)' : 'var(--hermes-button-bg)';
            buttonElement.style.color = debugMode ? 'var(--hermes-highlight-text)' : 'var(--hermes-button-text)';
        }
    }

    function getPanelBaseStyle() {
        return `display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:500px;max-height:80vh;background:var(--hermes-panel-bg, #FFF);border:1px solid var(--hermes-panel-border, #CCC);border-radius:8px;box-shadow:0 5px 15px rgba(0,0,0,0.3);padding:20px;z-index:2147483647;font-family:sans-serif;color:var(--hermes-panel-text, #000);overflow-y:auto;box-sizing:border-box;`;
    }

    function createModal(id, title, contentHtml, maxWidth = '600px', customButtonsHtml = '') {
        if (shadowRoot && shadowRoot.querySelector(`#${id}`)) {
            shadowRoot.querySelector(`#${id}`).remove();
        }
        const panel = document.createElement('div');
        panel.id = id;
        panel.className = 'hermes-panel';
        panel.style.cssText = getPanelBaseStyle() + `max-width: ${maxWidth};`;

        let buttonsBlock = `<button class="hermes-panel-close hermes-button">Close</button>`;
        if(customButtonsHtml) {
            buttonsBlock = customButtonsHtml.replace(/<button/g, '<button class="hermes-button"') + buttonsBlock;
        }

        panel.innerHTML = `
            <h2 class="hermes-panel-title">${title}</h2>
            <div class="hermes-panel-content">${contentHtml}</div>
            <div class="hermes-panel-buttons">
                ${buttonsBlock}
            </div>`;

        if (shadowRoot) {
            shadowRoot.appendChild(panel);
            const closeButton = panel.querySelector('.hermes-panel-close');
            if(closeButton) closeButton.addEventListener('click', () => {
                panel.style.display = 'none';
                if (id === 'hermes-help-panel') {
                    saveDataToBackground(HELP_PANEL_OPEN_KEY_EXT, false)
                        .then(() => helpPanelOpenState = false)
                        .catch(e => console.error("Hermes CS: Failed to save help panel closed state", e));
                }
            });
        } else {
            console.error("Hermes CS: shadowRoot not available to create modal:", id);
        }
        return panel;
    }

    function dispatchEvents(field) {
        ['input', 'change', 'blur'].forEach((type) => {
            const event = new Event(type, { bubbles: true });
            field.dispatchEvent(event);
        });
    }
    function isStopWord(token) {
        const stopWords = ['name', 'first', 'last', 'middle', 'email', 'phone', 'address', 'street', 'city', 'state', 'zip', 'code', 'country'];
        return stopWords.includes(token.toLowerCase());
    }
    function tokenSimilarity(a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        if (a === b) return 1;
        const minLen = Math.min(a.length, b.length);
        let matches = 0;
        for (let i = 0; i < minLen; i++) {
            if (a[i] === b[i]) matches++;
        }
        return matches / Math.max(a.length, b.length);
    }
    function getAssociatedLabelText(field) {
        if (field.id) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) return label.textContent.trim();
        }
        let parent = field.parentElement;
        while (parent && parent !== document.body) {
            const label = parent.querySelector('label');
            if (label && label.htmlFor === field.id) return label.textContent.trim();
            if (label && !label.htmlFor && label.contains(field)) return label.textContent.trim();
            if (label && parent.childNodes[0] === label && parent.childNodes[1] === field) return label.textContent.trim();
            parent = parent.parentElement;
        }
        return '';
    }
    function getRobustSelector(element) {
        if (!element || !element.tagName) return '';
        if (element.id) {
            return `#${element.id.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, "\\$1")}`;
        }
        const path = [];
        let current = element;
        while (current && current.parentElement && current.tagName.toLowerCase() !== 'body') {
            let selector = current.tagName.toLowerCase();
            const siblings = Array.from(current.parentElement.children).filter(c => c.tagName === current.tagName);
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-of-type(${index})`;
            } else if (current.className && typeof current.className === 'string') {
                const classes = current.className.trim().split(/\s+/).filter(c => c).join('.');
                if (classes) {
                    try {
                        if (current.parentElement.querySelectorAll(selector + '.' + classes.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, "\\$1")).length === 1) {
                             selector += '.' + classes.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, "\\$1");
                        }
                    } catch (e) { /* ignore */ }
                }
            }
            path.unshift(selector);
            current = current.parentElement;
        }
        return path.join(' > ');
    }

    function rgbStringToHex(rgbString) {
        if (!rgbString || typeof rgbString !== 'string') return '#000000';
        const match = rgbString.match(/rgba?\(?\s*(\d+)\s*[, ]?\s*(\d+)\s*[, ]?\s*(\d+)/i);
        if (match && match.length === 4) {
            const parts = [parseInt(match[1],10), parseInt(match[2],10), parseInt(match[3],10)];
            return "#" + parts.map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            }).join('');
        }
        const partsRaw = rgbString.split(' ').map(s => parseInt(s.trim(), 10));
        if (partsRaw.length === 3 && !partsRaw.some(isNaN)) {
            return "#" + partsRaw.map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            }).join('');
        }
        console.warn("Hermes CS: Could not parse RGB string to HEX:", rgbString);
        return '#000000';
    }

    async function saveProfileData(dataToSave) {
        try {
            await saveDataToBackground(PROFILE_KEY_EXT, dataToSave);
            profileData = dataToSave;
            console.log('Hermes CS: Profile data sent to background for saving.');
            return true;
        } catch (error) {
            console.error('Hermes CS: Error saving profile data:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'profile_save_cs', details: { error } });
            return false;
        }
    }

    async function saveMacros(macrosToSave) {
        try {
            await saveDataToBackground(MACRO_KEY_EXT, macrosToSave);
            macros = macrosToSave;
            console.log('Hermes CS: Macros sent to background for saving.');
            return true;
        } catch (error) {
            console.error('Hermes CS: Error saving macros:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'macros_save_cs', details: { error } });
            return false;
        }
    }

    async function saveCustomMappings(mappingsToSave) {
        try {
            await saveDataToBackground(MAPPING_KEY_EXT, mappingsToSave);
            customMappings = mappingsToSave;
            console.log('Hermes CS: Mappings sent to background for saving.');
            return true;
        } catch (error) {
            console.error('Hermes CS: Error saving mappings:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'mappings_save_cs', details: { error } });
            return false;
        }
    }

    async function saveWhitelistToBackground(newWhitelist) {
        try {
            await saveDataToBackground(WHITELIST_KEY_EXT, newWhitelist);
            whitelist = newWhitelist;
            console.log("Hermes CS: Allowlist sent to background for saving:", newWhitelist);
            return true;
        } catch (error) {
            console.error("Hermes CS: Error saving allowlist:", error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'allowlist_save_cs', details: { error } });
            return false;
        }
    }

    function isWhitelisted() {
        if (!whitelist || whitelist.length === 0) return false;
        if (whitelist.includes('*')) return true;
        const hostname = window.location.hostname.toLowerCase();
        return whitelist.some(domain => {
            const cleanDomain = domain.startsWith('*.') ? domain.substring(2) : domain;
            return hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`);
        });
    }

    function matchProfileKey(context, fieldType, field) {
        let bestKey = null;
        let bestScore = 0;
        const fieldName = (field.name || field.id || '').toLowerCase();
        const labelText = getAssociatedLabelText(field).toLowerCase();
        const combinedText = `${fieldName} ${labelText}`.trim();
        const tokens = combinedText.split(/\s+/).filter(t => t && !isStopWord(t));

        for (const key in profileData) {
            const profileKeyLower = key.toLowerCase();
            if (tokens.includes(profileKeyLower) || (fieldName && fieldName.length > 2 && profileKeyLower.includes(fieldName))) {
                bestKey = key; bestScore = 0.9;
                break;
            }
            const profileTokens = profileKeyLower.split(/\s+/);
            let score = 0;
            tokens.forEach(t => {
                profileTokens.forEach(pt => {
                    score += tokenSimilarity(t, pt);
                });
            });
            score /= (tokens.length + profileTokens.length) / 2 || 1;
            if (score > bestScore && score > 0.5) {
                bestScore = score;
                bestKey = key;
            }
        }

        const siteMappings = customMappings[context] || customMappings['global'];
        if (siteMappings) {
            const fieldIdentifier = field.name || field.id || labelText;
            if (siteMappings[fieldIdentifier]) {
                 bestKey = siteMappings[fieldIdentifier];
                 bestScore = 1;
            } else if (field.id && siteMappings[field.id]) {
                 bestKey = siteMappings[field.id]; bestScore = 1;
            } else if (field.name && siteMappings[field.name]) {
                 bestKey = siteMappings[field.name]; bestScore = 1;
            }
        }

        if (bestKey === "_HERMES_IGNORE_FIELD_") return null;

        if (learningMode) {
            const fieldIdForSkipped = field.name || field.id || getRobustSelector(field);
            const existingSkipped = skippedFields.find(sf => (sf.field && (sf.field.name === field.name && sf.field.id === field.id)) || sf.label === (labelText || fieldName));

            if (bestScore < 0.8 && bestScore > 0.25) {
                if (!existingSkipped) {
                    skippedFields.push({ field, context, label: labelText || fieldName, currentGuess: bestKey, score: bestScore });
                }
            } else if (bestScore <= 0.25) {
                 if (!existingSkipped) {
                    skippedFields.push({ field, context, label: labelText || fieldName, currentGuess: null, score: 0 });
                }
            }
        }
        return bestKey;
    }

    function runFormFiller(currentProfileDataToUse = profileData) {
        if (Object.keys(currentProfileDataToUse).length === 0) {
            if (debugMode) console.log("Hermes CS: Profile is empty, skipping form fill.");
            if (statusIndicator) {
                statusIndicator.textContent = `Profile empty`;
                statusIndicator.style.color = 'var(--hermes-warning-text)';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
            return;
        }
        const context = window.location.hostname;
        const forms = document.querySelectorAll('form:not([data-hermes-ignore])');
        let filledCount = 0;
        skippedFields = [];

        forms.forEach((form) => {
            const fields = form.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]):not([type="image"]):not([type="file"]):not(:disabled):not([readonly]), select:not(:disabled), textarea:not(:disabled):not([readonly])');
            fields.forEach((field) => {
                if (field.offsetWidth === 0 || field.offsetHeight === 0 || field.closest('[style*="display:none"]') || field.closest('[style*="visibility:hidden"]')) return;

                const fieldType = field.type ? field.type.toLowerCase() : (field.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text');
                const profileKey = matchProfileKey(context, fieldType, field);

                if (profileKey && typeof currentProfileDataToUse[profileKey] !== 'undefined' && currentProfileDataToUse[profileKey] !== null) {
                    if (fieldType === 'checkbox') {
                        field.checked = String(currentProfileDataToUse[profileKey]).toLowerCase() === 'true' || currentProfileDataToUse[profileKey] === true || currentProfileDataToUse[profileKey] === field.value;
                    } else if (fieldType === 'radio') {
                        if (field.value === String(currentProfileDataToUse[profileKey])) {
                            field.checked = true;
                        }
                    } else if (fieldType === 'select-one' || fieldType === 'select-multiple') {
                        let foundOption = false;
                        Array.from(field.options).forEach(option => {
                             if (option.value === String(currentProfileDataToUse[profileKey]) || option.text === String(currentProfileDataToUse[profileKey])) {
                                option.selected = true;
                                foundOption = true;
                            }
                        });
                        if (!foundOption && fieldType === 'select-one') {
                            field.value = currentProfileDataToUse[profileKey];
                        }
                        if (fieldType === 'select-multiple' && Array.isArray(currentProfileDataToUse[profileKey])) {
                            Array.from(field.options).forEach(option => {
                                option.selected = currentProfileDataToUse[profileKey].includes(option.value) || currentProfileDataToUse[profileKey].includes(option.text);
                            });
                        }
                    } else {
                        field.value = currentProfileDataToUse[profileKey];
                    }
                    dispatchEvents(field);
                    filledCount++;
                    if (showOverlays) {
                        field.style.outline = '2px solid var(--hermes-success-text, green)';
                        setTimeout(() => { field.style.outline = ''; }, 2000);
                    }
                    debugLogs.push({
                        timestamp: Date.now(), type: 'fill_cs', target: getRobustSelector(field),
                        details: { profileKey, value: currentProfileDataToUse[profileKey] }
                    });
                }
            });
        });
        if (statusIndicator) {
            statusIndicator.textContent = `Filled ${filledCount} fields`;
            statusIndicator.style.color = filledCount > 0 ? 'var(--hermes-success-text)' : (Object.keys(currentProfileDataToUse).length > 0 ? 'var(--hermes-warning-text)' : 'var(--hermes-disabled-text)');
            setTimeout(() => resetStatusIndicator(), 2000);
        }
        console.log(`Hermes CS: Filled ${filledCount} fields.`);
        if (learningMode && skippedFields.length > 0) {
            console.log('Hermes CS: Skipped fields for training:', skippedFields.map(sf => ({label:sf.label, guess:sf.currentGuess, score: sf.score})));
            if(trainButton) {trainButton.style.borderColor = 'var(--hermes-warning-text)'; trainButton.style.color = 'var(--hermes-warning-text)';}
        } else if (trainButton) {
            trainButton.style.borderColor = ''; trainButton.style.color = '';
        }
    }

    function recordEvent(e) {
        if (!isRecording || !e.target) return;
        if (e.target.closest('#hermes-shadow-host')) return;
        const selector = getRobustSelector(e.target);
        if (!selector) return;

        const eventDetails = {
            type: e.type, selector: selector,
            value: e.target.value !== undefined ? e.target.value : null,
            checked: e.target.checked !== undefined ? e.target.checked : null,
            timestamp: Date.now(), key: e.key || null, code: e.code || null,
            button: e.button !== undefined ? e.button : null,
            clientX: e.clientX !== undefined ? e.clientX : null, clientY: e.clientY !== undefined ? e.clientY : null,
            targetTag: e.target.tagName, shiftKey: e.shiftKey || false, ctrlKey: e.ctrlKey || false,
            altKey: e.altKey || false, metaKey: e.metaKey || false
        };
        recordedEvents.push(eventDetails);
        debugLogs.push({ timestamp: Date.now(), type: 'record_cs', target: selector, details: eventDetails });
    }
    function startRecording() {
        isRecording = true; recordedEvents = [];
        currentMacroName = prompt('Enter macro name:') || `macro_${Date.now()}`;
        if (!currentMacroName) { isRecording = false; return; }
        ['click', 'input', 'change', 'mousedown', 'mouseup', 'keydown', 'keyup', 'focusin', 'focusout', 'submit', 'dblclick', 'contextmenu'].forEach(type => {
            document.addEventListener(type, recordEvent, true);
        });
        if (statusIndicator) { statusIndicator.textContent = `Recording: ${currentMacroName}`; statusIndicator.style.color = 'var(--hermes-error-text)'; }
        if (recordButton) { recordButton.style.borderColor = 'var(--hermes-error-text)'; recordButton.style.color = 'var(--hermes-error-text)';}
        if (stopSaveButton) { stopSaveButton.style.borderColor = ''; stopSaveButton.style.color = '';}
        console.log('Hermes CS: Recording started:', currentMacroName);
    }
    async function stopRecording() {
        if (!isRecording) return;
        isRecording = false;
        ['click', 'input', 'change', 'mousedown', 'mouseup', 'keydown', 'keyup', 'focusin', 'focusout', 'submit', 'dblclick', 'contextmenu'].forEach(type => {
            document.removeEventListener(type, recordEvent, true);
        });
        if (currentMacroName && recordedEvents.length > 0) {
            macros[currentMacroName] = recordedEvents;
            if (await saveMacros(macros)) {
                updateMacroDropdown();
                if (statusIndicator) { statusIndicator.textContent = `Saved macro: ${currentMacroName}`; statusIndicator.style.color = 'var(--hermes-success-text)'; setTimeout(resetStatusIndicator, 2000); }
            } else {
                if (statusIndicator) { statusIndicator.textContent = `Failed to save macro`; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
            }
        } else {
            if (statusIndicator) { statusIndicator.textContent = 'No events recorded or no name'; statusIndicator.style.color = 'var(--hermes-warning-text)'; setTimeout(resetStatusIndicator, 2000); }
        }
        if (recordButton) { recordButton.style.borderColor = ''; recordButton.style.color = '';}
        console.log('Hermes CS: Recording stopped:', currentMacroName);
        currentMacroName = '';
    }
    function playMacro(macroName) {
        const macroToPlay = macros[macroName];
        if (!macroToPlay) {
            console.error('Hermes CS: Macro not found:', macroName);
            if (statusIndicator) { statusIndicator.textContent = `Macro ${macroName} not found`; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
            return;
        }
        let index = 0;
        let lastTimestamp = macroToPlay.length > 0 ? macroToPlay[0].timestamp : Date.now();

        function executeEvent() {
            if (index >= macroToPlay.length) {
                if (statusIndicator) { statusIndicator.textContent = `Macro ${macroName} finished`; statusIndicator.style.color = 'var(--hermes-success-text)'; setTimeout(resetStatusIndicator, 2000); }
                console.log('Hermes CS: Macro playback finished:', macroName);
                return;
            }
            const eventDetail = macroToPlay[index];
            const element = document.querySelector(eventDetail.selector);

            if (!element && eventDetail.type !== 'submit') {
                console.warn('Hermes CS: Element not found for selector:', eventDetail.selector, 'Skipping event.');
                debugLogs.push({ timestamp: Date.now(), type: 'playback_error_cs', target: eventDetail.selector, details: { error: 'Element not found', eventDetail } });
                index++; setTimeout(executeEvent, 50);
                return;
            }

            try {
                let eventToDispatch;
                if (['click', 'mousedown', 'mouseup', 'dblclick', 'contextmenu'].includes(eventDetail.type)) {
                    eventToDispatch = new MouseEvent(eventDetail.type, {
                        bubbles: true, cancelable: true, view: window, detail: eventDetail.type === 'dblclick' ? 2 : 1,
                        clientX: eventDetail.clientX, clientY: eventDetail.clientY,
                        button: eventDetail.button, buttons: eventDetail.button === 0 ? 1 : (eventDetail.button === 2 ? 2 : 0),
                        shiftKey: eventDetail.shiftKey, ctrlKey: eventDetail.ctrlKey, altKey: eventDetail.altKey, metaKey: eventDetail.metaKey
                    });
                    element.dispatchEvent(eventToDispatch);
                } else if (['input', 'change'].includes(eventDetail.type)) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                         element.checked = eventDetail.checked;
                    } else {
                         element.value = eventDetail.value || '';
                    }
                    dispatchEvents(element);
                } else if (eventDetail.type.startsWith('key')) {
                    eventToDispatch = new KeyboardEvent(eventDetail.type, {
                        key: eventDetail.key, code: eventDetail.code, bubbles: true, cancelable: true,
                        shiftKey: eventDetail.shiftKey, ctrlKey: eventDetail.ctrlKey, altKey: eventDetail.altKey, metaKey: eventDetail.metaKey
                    });
                    element.dispatchEvent(eventToDispatch);
                } else if (eventDetail.type === 'focusin' && typeof element.focus === 'function') {
                     element.focus();
                } else if (eventDetail.type === 'focusout' && typeof element.blur === 'function') {
                     element.blur();
                } else if (eventDetail.type === 'submit') {
                    if (element && typeof element.submit === 'function') {
                        element.submit();
                    } else if (element && element.form && typeof element.form.submit === 'function') {
                        element.form.submit();
                    } else {
                        const forms = document.querySelectorAll('form');
                        if (forms.length > 0) forms[0].submit();
                        else console.warn("Hermes CS: 'submit' event target not a form, and no form found on page.");
                    }
                }
                debugLogs.push({ timestamp: Date.now(), type: 'playback_cs', target: eventDetail.selector, details: { eventDetail } });

                index++;
                const delay = (lastTimestamp && eventDetail.timestamp && index > 0 && macroToPlay[index-1]) ?
                              Math.min(Math.max(eventDetail.timestamp - macroToPlay[index-1].timestamp, 50), 3000) : 200;
                lastTimestamp = eventDetail.timestamp;
                setTimeout(executeEvent, delay);

            } catch (error) {
                console.error('Hermes CS: Error playing event:', error, 'on element:', element, 'with details:', eventDetail);
                debugLogs.push({ timestamp: Date.now(), type: 'playback_error_cs', target: eventDetail.selector, details: { error: error.message, eventDetail } });
                index++; setTimeout(executeEvent, 100);
            }
        }
        if (statusIndicator) { statusIndicator.textContent = `Playing: ${macroName}`; statusIndicator.style.color = 'var(--hermes-info-text)'; }
        console.log('Hermes CS: Starting macro playback:', macroName);
        executeEvent();
    }
    async function deleteMacro(macroName) {
        if (macros[macroName]) {
            delete macros[macroName];
            if (await saveMacros(macros)) {
                updateMacroDropdown();
                if (statusIndicator) { statusIndicator.textContent = `Deleted macro: ${macroName}`; statusIndicator.style.color = 'var(--hermes-warning-text)'; setTimeout(resetStatusIndicator, 2000); }
            } else {
                 if (statusIndicator) { statusIndicator.textContent = `Failed to delete macro`; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
            }
            console.log('Hermes CS: Macro deleted:', macroName);
        }
    }

    function removeVisualOverlays() {
        document.querySelectorAll('[data-hermes-overlay]').forEach((el) => {
            el.style.outline = '';
            el.removeAttribute('data-hermes-overlay');
        });
    }
    function applyVisualOverlays() {
        if (!showOverlays || isMinimized) return;
        removeVisualOverlays();
        const fields = document.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]):not([type="image"]):not([type="file"]), select, textarea');
        fields.forEach((field) => {
            if (field.offsetWidth === 0 || field.offsetHeight === 0 || field.closest('[style*="display:none"]') || field.closest('[style*="visibility:hidden"]')) return;
            field.style.outline = '2px dotted var(--hermes-info-text, blue)';
            field.setAttribute('data-hermes-overlay', 'true');
        });
    }

    let mutationObs;
    function startMutationObserver() {
        if (mutationObs) mutationObs.disconnect();
        mutationObs = new MutationObserver((mutations) => {
            let significantChange = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                    for (const node of Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes))) {
                        if (node.nodeType === 1 && (node.matches('form, input, select, textarea') || (typeof node.querySelector === 'function' && node.querySelector('form, input, select, textarea')))) {
                            significantChange = true; break;
                        }
                    }
                }
                if (significantChange) break;
            }
            if (significantChange) {
                if (showOverlays && !isMinimized) {
                    applyVisualOverlays();
                }
            }
        });
        const observeBody = () => {
            if (document.body) {
                mutationObs.observe(document.body, { childList: true, subtree: true, attributes: false });
            } else {
                console.warn("Hermes CS: document.body not available for MutationObserver yet.");
            }
        };
        if (document.body) {
            observeBody();
        } else {
            window.addEventListener('DOMContentLoaded', observeBody, {once: true});
        }
    }
    function stopMutationObserver() {
        if (mutationObs) {
            mutationObs.disconnect();
            mutationObs = null;
        }
    }

    function runHeuristicTrainerSession() {
        if (!learningMode) {
            if(statusIndicator) { statusIndicator.textContent = "Enable Learn Mode First"; statusIndicator.style.color="var(--hermes-warning-text)"; setTimeout(resetStatusIndicator, 2000);}
            return;
        }
        if (skippedFields.length === 0) {
            runFormFiller(profileData);
        }
        if (skippedFields.length === 0 && statusIndicator) {
             statusIndicator.textContent = "No fields need training."; statusIndicator.style.color="var(--hermes-info-text)"; setTimeout(resetStatusIndicator, 2000);
             return;
        }
        toggleTrainerPanel(true);
        if (statusIndicator) { statusIndicator.textContent = 'Review in Train Panel'; statusIndicator.style.color = 'var(--hermes-info-text)'; setTimeout(resetStatusIndicator, 2000); }
        if(trainButton) {trainButton.style.borderColor = 'var(--hermes-warning-text)'; trainButton.style.color = 'var(--hermes-warning-text)';}
    }

    function updateMacroDropdown() {
        if (shadowRoot) {
            const macroSubmenuEl = shadowRoot.querySelector('#hermes-macro-submenu');
            if (macroSubmenuEl) updateMacroSubmenuContents(macroSubmenuEl);
        }
    }

    function updateMacroSubmenuContents(macroSubmenuEl) {
        if (!macroSubmenuEl) return;
        macroSubmenuEl.innerHTML = '';
        if (Object.keys(macros).length > 0) {
            Object.keys(macros).sort().forEach((name) => {
                const macroItemContainer = document.createElement('div');
                macroItemContainer.className = 'hermes-submenu-item-container';

                const playBtn = document.createElement('button');
                playBtn.className = 'hermes-button hermes-submenu-button';
                playBtn.textContent = name;
                playBtn.title = `Play macro: ${name}`;
                playBtn.onclick = (e) => { e.stopPropagation(); playMacro(name); closeAllSubmenus(); };

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'hermes-button hermes-submenu-delete-button';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.title = `Delete macro: ${name}`;
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete macro "${name}"?`)) {
                        await deleteMacro(name);
                    }
                    closeAllSubmenus();
                };
                macroItemContainer.append(playBtn, deleteBtn);
                macroSubmenuEl.appendChild(macroItemContainer);
            });
        } else {
            const noMacrosMsg = document.createElement('div');
            noMacrosMsg.className = 'hermes-submenu-empty-message';
            noMacrosMsg.textContent = 'No macros recorded.';
            macroSubmenuEl.appendChild(noMacrosMsg);
        }
    }

    function resetStatusIndicator() {
        if (statusIndicator) {
            statusIndicator.textContent = 'Hermes Ready';
            statusIndicator.style.color = 'var(--hermes-text)';
        }
    }

    function loadProfileDataHandler() {
        if (!shadowRoot) { console.error("Hermes CS: shadowRoot not available for profile editor."); return; }
        const editorPanel = shadowRoot.querySelector('#hermes-profile-editor');
        if (!editorPanel) return;
        const textarea = editorPanel.querySelector('textarea');
        if (!textarea) { console.error("Hermes CS: Textarea not found in profile editor."); return; }
        textarea.value = (Object.keys(profileData).length === 0) ? exampleProfileJSON : JSON.stringify(profileData, null, 2);
    }

    async function saveProfileDataHandler() {
        if (!shadowRoot) return;
        const editor = shadowRoot.querySelector('#hermes-profile-editor');
        if (!editor) return;
        const textarea = editor.querySelector('textarea');
        if (!textarea) return;
        try {
            const newProfile = JSON.parse(textarea.value);
            if (await saveProfileData(newProfile)) {
                if (statusIndicator) { statusIndicator.textContent = 'Profile saved'; statusIndicator.style.color = 'var(--hermes-success-text)'; setTimeout(resetStatusIndicator, 2000); }
                toggleProfileEditor(false);
            } else {
                if (statusIndicator) { statusIndicator.textContent = 'Failed to save profile'; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
            }
        } catch (error) {
            console.error('Hermes CS: Invalid profile JSON:', error);
            if (statusIndicator) { statusIndicator.textContent = 'Invalid JSON: ' + String(error).substring(0,30); statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 3000); }
            alert("Error: Invalid JSON in profile data.\n" + error);
        }
    }
    function createProfileEditor() {
        const panelId = 'hermes-profile-editor';
        if (shadowRoot && shadowRoot.querySelector(`#${panelId}`)) return;
        const content = `<p style="font-size:0.9em;margin-bottom:10px;opacity:0.85;">Enter profile as JSON. Keys should match form field names/labels. Example shown if empty.</p><textarea style="width:100%;height:50vh;min-height:250px;resize:vertical;font-family:monospace;padding:10px;box-sizing:border-box;"></textarea>`;
        const profileButtonsHtml = `<button id="hermes-profile-save-btn" class="hermes-button" style="background:var(--hermes-success-text);color:var(--hermes-panel-bg);">Save Profile</button>`;
        createModal(panelId, 'Edit Profile Data', content, '700px', profileButtonsHtml);

        const panelInRoot = shadowRoot ? shadowRoot.querySelector(`#${panelId}`) : null;
        if (panelInRoot) {
            const saveBtn = panelInRoot.querySelector('#hermes-profile-save-btn');
            if (saveBtn) saveBtn.onclick = saveProfileDataHandler;
        }
    }
    function toggleProfileEditor(show) {
        if (!shadowRoot) return;
        let editor = shadowRoot.querySelector('#hermes-profile-editor');
        if (show && !editor) { createProfileEditor(); editor = shadowRoot.querySelector('#hermes-profile-editor'); }
        if (editor) {
            if (show) { loadProfileDataHandler(); editor.style.display = 'block'; applyTheme(); }
            else editor.style.display = 'none';
        } else if (show) console.error("Hermes CS: Profile editor could not be created/found.");
    }

    function createLogViewerPanel() {
        const panelId = 'hermes-log-viewer';
        if (shadowRoot && shadowRoot.querySelector(`#${panelId}`)) return;
        const contentHtml = `<div style="max-height:60vh;overflow-y:auto;"><table id="hermes-log-table" style="width:100%;border-collapse:collapse;"><thead style="border-bottom:1px solid var(--hermes-panel-border);position:sticky;top:0;background:var(--hermes-panel-bg);"><tr><th style="padding:8px;text-align:left;">Time</th><th style="padding:8px;text-align:left;">Type</th><th style="padding:8px;text-align:left;">Target</th><th style="padding:8px;text-align:left;">Details</th></tr></thead><tbody id="hermes-log-body"></tbody></table></div>`;
        const customButtonsHtml = `<button id="hermes-log-clear" class="hermes-button" style="background:var(--hermes-error-text);color:var(--hermes-panel-bg);">Clear Logs</button>`;
        createModal(panelId, 'Hermes Debug Logs', contentHtml, '800px', customButtonsHtml);
        const panelInRoot = shadowRoot ? shadowRoot.querySelector(`#${panelId}`) : null;
        if (panelInRoot) {
            const clearBtn = panelInRoot.querySelector('#hermes-log-clear');
            if (clearBtn) clearBtn.onclick = () => {
                HermesDebug.clearLogs();
                if (statusIndicator) { statusIndicator.textContent = 'Logs cleared'; statusIndicator.style.color = 'var(--hermes-warning-text)'; setTimeout(resetStatusIndicator, 2000); }
            };
        }
    }
    function populateLogViewer() {
        if (!shadowRoot) return;
        const logBody = shadowRoot.querySelector('#hermes-log-body');
        if (!logBody) return;
        logBody.innerHTML = '';
        const logs = HermesDebug.logs();
        if (logs.length === 0) { logBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:10px;">No logs yet.</td></tr>'; return; }
        logs.forEach((log) => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--hermes-panel-border)';
            row.innerHTML = `
                <td style="padding:5px;font-size:0.85em;white-space:nowrap;vertical-align:top;">${new Date(log.timestamp).toLocaleTimeString()}</td>
                <td style="padding:5px;font-size:0.85em;vertical-align:top;">${log.type}</td>
                <td style="padding:5px;font-size:0.85em;word-break:break-all;vertical-align:top;">${log.target||'N/A'}</td>
                <td style="padding:5px;font-size:0.85em;word-break:break-all;vertical-align:top;"><pre style="white-space:pre-wrap;margin:0;font-family:monospace;font-size:0.9em;">${JSON.stringify(log.details,null,2)}</pre></td>
            `;
            logBody.appendChild(row);
        });
    }
    function toggleLogViewer(show) {
        if (!shadowRoot) return;
        let logViewer = shadowRoot.querySelector('#hermes-log-viewer');
        if (show && !logViewer) { createLogViewerPanel(); logViewer = shadowRoot.querySelector('#hermes-log-viewer');}
        if (logViewer) {
            if (show) { populateLogViewer(); logViewer.style.display = 'block'; applyTheme(); }
            else logViewer.style.display = 'none';
        }
    }

    function createTrainerPanel() {
        const panelId = 'hermes-trainer-panel';
        if (shadowRoot && shadowRoot.querySelector(`#${panelId}`)) return;
        const contentHtml = `<p style="margin-bottom:10px;font-size:0.9em;opacity:0.85;">Review unsure fields. Map to profile keys for <strong>${window.location.hostname}</strong> or globally. Saves on select.</p><div id="hermes-skipped-list" style="max-height:50vh;overflow-y:auto;border:1px solid var(--hermes-panel-border);padding:10px;margin-bottom:15px;"></div>`;
        const customButtonsHtml = `<button id="hermes-trainer-refill" class="hermes-button" style="background:var(--hermes-info-text);color:var(--hermes-panel-bg);">Apply Current & Refill</button>`;
        createModal(panelId, 'Hermes Field Trainer', contentHtml, '700px', customButtonsHtml);
        const panelInRoot = shadowRoot ? shadowRoot.querySelector(`#${panelId}`) : null;
        if (panelInRoot) {
            const refillBtn = panelInRoot.querySelector('#hermes-trainer-refill');
            if (refillBtn) refillBtn.onclick = () => {
                runFormFiller(profileData);
                populateTrainerPanel();
                if (statusIndicator) { statusIndicator.textContent = "Form Refilled & Trainer Updated"; statusIndicator.style.color = "var(--hermes-success-text)"; setTimeout(resetStatusIndicator, 2000); }
            };
        }
    }
    async function saveTrainerMapping(fieldIdentifier, context, selectedProfileKey, isGlobal) {
        const contextToSave = isGlobal ? 'global' : context;
        const otherContext = isGlobal ? context : 'global';

        customMappings[contextToSave] = customMappings[contextToSave] || {};

        if (isGlobal && customMappings[otherContext] && customMappings[otherContext][fieldIdentifier]) {
            delete customMappings[otherContext][fieldIdentifier];
            if (Object.keys(customMappings[otherContext]).length === 0) delete customMappings[otherContext];
        }

        if (selectedProfileKey === "_HERMES_IGNORE_FIELD_") {
             customMappings[contextToSave][fieldIdentifier] = "_HERMES_IGNORE_FIELD_";
        } else if (selectedProfileKey) {
             customMappings[contextToSave][fieldIdentifier] = selectedProfileKey;
        } else {
             delete customMappings[contextToSave][fieldIdentifier];
             if (Object.keys(customMappings[contextToSave]).length === 0) delete customMappings[contextToSave];
        }

        try {
            await saveCustomMappings(customMappings);
            if (statusIndicator) { statusIndicator.textContent = "Mapping Saved"; statusIndicator.style.color = "var(--hermes-success-text)"; setTimeout(resetStatusIndicator, 2000); }
            if(selectedProfileKey) {
                 skippedFields = skippedFields.filter(sf => (sf.field.name || sf.field.id || getRobustSelector(sf.field)) !== fieldIdentifier);
            }
            populateTrainerPanel();
        } catch (e) {
             if (statusIndicator) { statusIndicator.textContent = "Mapping Save Failed"; statusIndicator.style.color = "var(--hermes-error-text)"; setTimeout(resetStatusIndicator, 2000); }
        }
    }
    function populateTrainerPanel() {
        if (!shadowRoot) return;
        const listDiv = shadowRoot.querySelector('#hermes-skipped-list');
        if (!listDiv) return;
        listDiv.innerHTML = '';
        if (skippedFields.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center;padding:15px;">No fields need training. Try filling a form.</p>';
            if(trainButton) {trainButton.style.borderColor = '';  trainButton.style.color = '';}
            return;
        }
        skippedFields.forEach((skipped) => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = 'padding:10px;border-bottom:1px solid var(--hermes-panel-border);display:flex;justify-content:space-between;align-items:center;gap:10px;';
            const fieldIdentifier = skipped.field.name || skipped.field.id || getRobustSelector(skipped.field);

            let currentMappedKey = (customMappings[skipped.context] && customMappings[skipped.context][fieldIdentifier]) ||
                                   (customMappings['global'] && customMappings['global'][fieldIdentifier]) ||
                                   skipped.currentGuess || '';
            let isCurrentlyGlobal = customMappings['global'] && customMappings['global'][fieldIdentifier] !== undefined;
            if (customMappings[skipped.context] && customMappings[skipped.context][fieldIdentifier] !== undefined) {
                isCurrentlyGlobal = false;
            }

            itemDiv.innerHTML = `
                <div style="flex-grow:1;">
                    <strong title="${fieldIdentifier}">${skipped.label||fieldIdentifier}</strong>
                    <div style="font-size:0.8em;opacity:0.7;">Page: ${skipped.context} (Score: ${skipped.score ? skipped.score.toFixed(2) : 'N/A'})</div>
                    ${skipped.currentGuess ? `<div style="font-size:0.8em;opacity:0.7;">Initial Guess: ${skipped.currentGuess}</div>` : ''}
                </div>
                <select data-field-id="${fieldIdentifier}" data-context="${skipped.context}" class="hermes-button" style="flex-shrink:0;min-width:150px;">
                    <option value="">-- Select Key --</option>
                    <option value="_HERMES_IGNORE_FIELD_" ${currentMappedKey === "_HERMES_IGNORE_FIELD_" ? 'selected' : ''}>-- Ignore This Field --</option>
                    ${Object.keys(profileData).map(pk => `<option value="${pk}" ${pk === currentMappedKey ? 'selected' : ''}>${pk}</option>`).join('')}
                </select>
                <label style="font-size:0.8em;flex-shrink:0;display:flex;align-items:center;gap:3px;">
                    <input type="checkbox" data-global-map="${fieldIdentifier}" ${isCurrentlyGlobal ? 'checked' : ''}> Global?
                </label>`;
            listDiv.appendChild(itemDiv);

            const selectElement = itemDiv.querySelector('select');
            const globalCheckbox = itemDiv.querySelector('input[type="checkbox"]');

            const handleMappingChange = () => {
                saveTrainerMapping(fieldIdentifier, skipped.context, selectElement.value, globalCheckbox.checked);
            };
            selectElement.onchange = handleMappingChange;
            globalCheckbox.onchange = handleMappingChange;
        });
    }
    function toggleTrainerPanel(show) {
        if (!shadowRoot) return;
        let trainerPanel = shadowRoot.querySelector('#hermes-trainer-panel');
        if (show && !trainerPanel) { createTrainerPanel(); trainerPanel = shadowRoot.querySelector('#hermes-trainer-panel'); }
        if (trainerPanel) {
            if (show) { populateTrainerPanel(); trainerPanel.style.display = 'block'; applyTheme(); }
            else trainerPanel.style.display = 'none';
        }
    }

    function createWhitelistPanel() {
        const panelId = 'hermes-allowlist-panel';
        if (shadowRoot && shadowRoot.querySelector(`#${panelId}`)) return;
        const hostname = window.location.hostname.toLowerCase();
        const contentHtml = `<p style="margin-bottom:15px;font-size:0.9em;opacity:0.85;">Hermes minimizes to a button on allowed domains (shows full UI on click). Add domains (e.g., <code>example.com</code> or <code>*.example.com</code> for subdomains, or <code>*</code> for all).</p>
            <div style="margin-bottom:15px;display:flex;gap:10px;">
                <input type="text" id="hermes-allowlist-input" placeholder="Add domain (e.g., example.com)" style="flex-grow:1;padding:8px;">
                <button id="hermes-allowlist-add" class="hermes-button" style="background:var(--hermes-success-text);color:var(--hermes-panel-bg);white-space:nowrap;">Add Domain</button>
            </div>
            <div id="hermes-allowlist-list" style="max-height:40vh;overflow-y:auto;border:1px solid var(--hermes-panel-border);padding:10px;"></div>`;
        createModal(panelId, 'Manage Allowed Domains', contentHtml, '600px');

        const panelInRoot = shadowRoot ? shadowRoot.querySelector(`#${panelId}`) : null;
        if (!panelInRoot) return;

        const input = panelInRoot.querySelector('#hermes-allowlist-input');
        const addBtn = panelInRoot.querySelector('#hermes-allowlist-add');
        const listDiv = panelInRoot.querySelector('#hermes-allowlist-list');

        const updateListDisplay = () => {
            listDiv.innerHTML = '';
            if (whitelist.length === 0) {
                listDiv.innerHTML = '<p style="text-align:center;padding:10px;">No domains on allowlist.</p>';
                return;
            }
            whitelist.forEach((domain) => {
                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = 'padding:8px;border-bottom:1px solid var(--hermes-panel-border);display:flex;justify-content:space-between;align-items:center;';
                itemDiv.innerHTML = `<span>${domain}</span><button class="hermes-button" style="background:var(--hermes-error-text);color:var(--hermes-panel-bg);padding:5px 10px;">Remove</button>`;
                const removeBtn = itemDiv.querySelector('button');
                removeBtn.onclick = async () => {
                    const newAllowlist = whitelist.filter(d => d !== domain);
                    if (await saveWhitelistToBackground(newAllowlist)) {
                        updateListDisplay();
                        if (statusIndicator) { statusIndicator.textContent = `Removed ${domain}`; statusIndicator.style.color = 'var(--hermes-warning-text)'; setTimeout(resetStatusIndicator, 2000); }
                        if (!isWhitelisted() && isMinimized) toggleMinimizedUI(false);
                    } else {
                         if (statusIndicator) { statusIndicator.textContent = `Failed to remove ${domain}`; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
                    }
                };
                listDiv.appendChild(itemDiv);
            });
        };

        addBtn.onclick = async () => {
            let domainToAdd = input.value.trim().toLowerCase();
            if (!domainToAdd) return;
            if (domainToAdd === '*') {
                if (!confirm("Adding '*' will add all domains to the allowlist, minimizing Hermes everywhere by default. Are you sure?")) return;
            } else if (!domainToAdd.includes('.') && domainToAdd !== '*') {
                alert("Invalid domain format. Please use format like 'example.com' or '*.example.com'.");
                return;
            }
            if (whitelist.includes(domainToAdd)) {
                if (statusIndicator) { statusIndicator.textContent = `${domainToAdd} already on allowlist`; statusIndicator.style.color = 'var(--hermes-warning-text)'; setTimeout(resetStatusIndicator, 2000); }
                return;
            }
            const newAllowlist = [...whitelist, domainToAdd];
            if (await saveWhitelistToBackground(newAllowlist)) {
                input.value = '';
                updateListDisplay();
                if (statusIndicator) { statusIndicator.textContent = `Added ${domainToAdd}`; statusIndicator.style.color = 'var(--hermes-success-text)'; setTimeout(resetStatusIndicator, 2000); }
                if (isWhitelisted() && !isMinimized) toggleMinimizedUI(true);
            } else {
                if (statusIndicator) { statusIndicator.textContent = `Failed to add ${domainToAdd}`; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
            }
        };
        input.onkeypress = (e) => { if (e.key === 'Enter') addBtn.click(); };

        const currentDomainInfo = document.createElement('div');
        currentDomainInfo.style.cssText = 'padding:8px;border:1px solid var(--hermes-panel-border);margin-bottom:15px;border-radius:4px;background:var(--hermes-input-bg);';
        if (isWhitelisted()) {
            currentDomainInfo.innerHTML = `<strong>Current Domain:</strong> ${hostname} (on allowlist)`;
        } else {
            currentDomainInfo.innerHTML = `<strong>Current Domain:</strong> ${hostname} (not on allowlist)`;
            input.value = hostname;
        }
        panelInRoot.querySelector('.hermes-panel-content').prepend(currentDomainInfo);
        updateListDisplay();
    }
    function toggleWhitelistPanel(show) {
        if (!shadowRoot) return;
        let allowlistPanel = shadowRoot.querySelector('#hermes-allowlist-panel');
        if (show && !allowlistPanel) { createWhitelistPanel(); allowlistPanel = shadowRoot.querySelector('#hermes-allowlist-panel'); }
        if (allowlistPanel) {
            if (show) { allowlistPanel.style.display = 'block'; applyTheme(); }
            else allowlistPanel.style.display = 'none';
        }
    }

    function createHelpPanel() {
        const panelId = 'hermes-help-panel';
        if (shadowRoot && shadowRoot.querySelector(`#${panelId}`)) return;
        const contentHtml = `
            <p style="margin-bottom:15px;"><strong>Hermes</strong> automates form filling, records macros, and trains field mappings on web pages.</p>
            <h3 style="margin-top:20px;color:var(--hermes-panel-text);">Features</h3>
            <ul style="list-style:disc;padding-left:20px;margin-bottom:15px;">
                <li><strong>Fill:</strong> Auto-fill forms using your profile data.</li>
                <li><strong>Edit:</strong> Edit your profile as JSON (keys should match field names/labels).</li>
                <li><strong>Record/Save:</strong> Record actions (clicks, inputs) as macros to replay later.</li>
                <li><strong>Macros:</strong> Play or delete recorded macros.</li>
                <li><strong>Logs:</strong> View debug logs (visible in Debug mode).</li>
                <li><strong>Train:</strong> Map fields to profile keys when unsure (requires Learn mode).</li>
                <li><strong>Overlay:</strong> Highlight fillable fields (toggleable).</li>
                <li><strong>Allowlist:</strong> Minimize UI on specific domains (shows full UI on click).</li>
                <li><strong>Theme:</strong> Change UI appearance with various themes.</li>
                <li><strong>Effects:</strong> Add visual effects (Snowflake, Classic/Simple Laser, Classic/Simple Strobe).</li>
                <li><strong>Settings (⚙️):</strong> Configure detailed options for UI (like border thickness) and visual effects (density, colors, speed, etc.) via a JSON editor.</li>
                <li><strong>Bunch:</strong> Compact UI layout (vertical or horizontal).</li>
                <li><strong>Sniff Elements:</strong> Log form elements for debugging.</li>
                <li><strong>Import JSON:</strong> Import profile data from JSON.</li>
            </ul>
            <h3 style="margin-top:20px;color:var(--hermes-panel-text);">Tips</h3>
            <ul style="list-style:disc;padding-left:20px;">
                <li>Drag the ☰ handle to move the UI.</li>
                <li>Use snap buttons (←, →, ↑, ↓, ↖, ↗, ↙, ↘) to align UI to edges/corners.</li>
                <li>Enable Debug mode to access logs and dev tools.</li>
                <li>Use Learn mode to improve field mappings.</li>
                <li>Check the <strong>Settings (⚙️)</strong> panel for advanced customization of UI appearance and effect parameters.</li>
            </ul>`;
        createModal(panelId, 'Hermes Help', contentHtml, '600px');
        const panelInRoot = shadowRoot ? shadowRoot.querySelector(`#${panelId}`) : null;
        if (panelInRoot) {
            const closeBtn = panelInRoot.querySelector('.hermes-panel-close');
            if (closeBtn) closeBtn.onclick = () => { // This is handled by createModal's default close logic now
                // saveDataToBackground(HELP_PANEL_OPEN_KEY_EXT, false); // createModal handles this now
                // helpPanelOpenState = false;
                panelInRoot.style.display = 'none';
            };
        }
    }
    async function toggleHelpPanel(show) {
        if (!shadowRoot) return;
        let helpPanel = shadowRoot.querySelector('#hermes-help-panel');
        if (show && !helpPanel) { createHelpPanel(); helpPanel = shadowRoot.querySelector('#hermes-help-panel'); }

        if (helpPanel) {
            if (show) {
                helpPanel.style.display = 'block';
                applyTheme();
                try {
                    await saveDataToBackground(HELP_PANEL_OPEN_KEY_EXT, true);
                    helpPanelOpenState = true;
                } catch (e) { console.error("Hermes CS: Failed to save help panel opened state", e); }
            } else {
                helpPanel.style.display = 'none';
                try {
                    await saveDataToBackground(HELP_PANEL_OPEN_KEY_EXT, false);
                    helpPanelOpenState = false;
                } catch (e) { console.error("Hermes CS: Failed to save help panel closed state", e); }
            }
        } else if (show) {
            console.error("Hermes CS: Help panel could not be created/found.");
        }
    }

    function setupEffectsCanvas() {
        if (!shadowRoot) { console.warn("Hermes CS: ShadowRoot not ready for effects canvas."); return; }
        if (effectsCanvas && effectsCanvas.parentElement === shadowRoot) { /* Already exists */ }
        else {
            if (effectsCanvas) effectsCanvas.remove();
            effectsCanvas = document.createElement('canvas');
            effectsCanvas.id = 'hermes-effects-canvas';
            shadowRoot.appendChild(effectsCanvas);
        }

        effectsCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483639;pointer-events:none;display:none;';
        effectsCtx = effectsCanvas.getContext('2d');
        resizeEffectsCanvas();
        window.addEventListener('resize', resizeEffectsCanvas);
        updateEffectsRendering();
    }

    function resizeEffectsCanvas() {
        if (effectsCanvas) {
            effectsCanvas.width = window.innerWidth;
            effectsCanvas.height = window.innerHeight;
            if (effectsMode !== 'none' && !isMinimized) {
                if (effectsMode === 'snowflake') initV13Snowflakes();
                if (effectsMode === 'laserV13') initV13Lasers();
                updateEffectsRendering();
            }
        }
    }

    function initV13Snowflakes() {
        snowflakesV13 = [];
        if (!effectsCanvas || !currentSettings.effects || !currentSettings.effects.snowflakesV13) return;
        const settings = currentSettings.effects.snowflakesV13;
        const density = settings.density || 50;

        for (let i = 0; i < density; i++) {
            const size = (settings.minSize || 1) + Math.random() * ((settings.maxSize || 3) - (settings.minSize || 1));
            snowflakesV13.push({
                x: Math.random() * effectsCanvas.width, y: Math.random() * effectsCanvas.height, r: size,
                s: (settings.minSpeed || 0.5) + Math.random() * ((settings.maxSpeed || 1.5) - (settings.minSpeed || 0.5)),
                d: Math.random() * 0.5 - 0.25,
                o: (settings.opacityMin || 0.3) + Math.random() * ((settings.opacityMax || 0.8) - (settings.opacityMin || 0.3)),
                emoji: Array.isArray(settings.emoji) ? settings.emoji[Math.floor(Math.random() * settings.emoji.length)] : settings.emoji,
            });
        }
    }
    function animateV13Snowflakes() {
        if (!effectsCtx || effectsMode !== 'snowflake' || isMinimized || !currentSettings.effects || !currentSettings.effects.snowflakesV13) return;
        const settings = currentSettings.effects.snowflakesV13;
        effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);

        snowflakesV13.forEach(f => {
            f.y += f.s; f.x += f.d;
            if (f.y > effectsCanvas.height + f.r * 2) { f.y = -f.r * 2; f.x = Math.random() * effectsCanvas.width; }
            if (f.x > effectsCanvas.width + f.r * 2) f.x = -f.r * 2; else if (f.x < -f.r * 2) f.x = effectsCanvas.width + f.r * 2;

            if (settings.useEmojiOrShape === 'emoji' && f.emoji) {
                effectsCtx.font = `${f.r * (settings.maxSize / 2.5)}px ${settings.font || 'sans-serif'}`;
                effectsCtx.textAlign = 'center'; effectsCtx.textBaseline = 'middle';
                effectsCtx.fillText(f.emoji, f.x, f.y);
            } else {
                effectsCtx.beginPath(); effectsCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                const color = (settings.baseColor || 'rgba(240,240,240,{alpha})').replace('{alpha}', f.o.toString());
                effectsCtx.fillStyle = color;
                effectsCtx.shadowColor = 'rgba(0,0,0,0.2)'; effectsCtx.shadowBlur = 3;
                effectsCtx.fill();
                effectsCtx.shadowBlur = 0;
            }
        });
        effectAnimationFrameId = requestAnimationFrame(animateV13Snowflakes);
    }

    function initV13Lasers() {
        lasersV13 = [];
        if (!effectsCanvas || !currentSettings.effects || !currentSettings.effects.lasersV13) return;
        const settings = currentSettings.effects.lasersV13;
        const numLines = settings.numLines || 3;

        for (let i = 0; i < numLines; i++) {
            const colorIndex = i % (settings.colors ? settings.colors.length : 1);
            const colorTemplate = (settings.colors && settings.colors[colorIndex]) ? settings.colors[colorIndex] : 'rgba(255,0,0,{alpha})';
            lasersV13.push({
                y: Math.random() * effectsCanvas.height,
                s: (Math.random() * 2 + 0.5) * (Math.random() < 0.5 ? 1 : -1),
                c: colorTemplate.replace('{alpha}', (settings.transparency || 0.3).toString()),
            });
        }
    }
    function animateV13Lasers() {
        if (!effectsCtx || effectsMode !== 'laserV13' || isMinimized || !currentSettings.effects || !currentSettings.effects.lasersV13) return;
        const settings = currentSettings.effects.lasersV13;
        effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);

        lasersV13.forEach(l => {
            l.y += l.s;
            if (l.y > effectsCanvas.height + 10 || l.y < -10) {
                l.y = l.s > 0 ? -10 : effectsCanvas.height + 10;
                const colorIndex = Math.floor(Math.random() * (settings.colors ? settings.colors.length : 1));
                const colorTemplate = (settings.colors && settings.colors[colorIndex]) ? settings.colors[colorIndex] : 'rgba(255,0,0,{alpha})';
                l.c = colorTemplate.replace('{alpha}', (settings.transparency || 0.3).toString());
            }
            effectsCtx.beginPath(); effectsCtx.moveTo(0, l.y); effectsCtx.lineTo(effectsCanvas.width, l.y);
            effectsCtx.strokeStyle = l.c; effectsCtx.lineWidth = settings.lineThickness || 2;
            effectsCtx.stroke();
        });
        effectAnimationFrameId = requestAnimationFrame(animateV13Lasers);
    }

    function animateV13Strobe() {
        if (!effectsCtx || effectsMode !== 'strobeV13' || isMinimized || !currentSettings.effects || !currentSettings.effects.strobeV13) return;
        const settings = currentSettings.effects.strobeV13;
        effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);

        strobeStateV13.phase = (strobeStateV13.phase + (settings.speed || 0.1)) % (Math.PI * 2);
        const baseOpacity = Math.sin(strobeStateV13.phase) * (settings.maxOpacityFactor || 0.3) + (settings.minOpacity || 0.4);
        const alpha = Math.max(0, Math.min(1, baseOpacity)).toFixed(2);

        const colorTemplate = strobeStateV13.phase < Math.PI ?
                              (settings.color1 || 'rgba(255,0,0,{alpha})') :
                              (settings.color2 || 'rgba(0,0,255,{alpha})');
        effectsCtx.fillStyle = colorTemplate.replace('{alpha}', alpha);
        effectsCtx.fillRect(0, 0, effectsCanvas.width, effectsCanvas.height);
        effectAnimationFrameId = requestAnimationFrame(animateV13Strobe);
    }

    function initV14Lasers() { lasersV14 = []; }
    function animateV14Lasers() {
        if (!effectsCtx || effectsMode !== 'laserV14' || isMinimized || !currentSettings.effects || !currentSettings.effects.lasersV14) return;
        const settings = currentSettings.effects.lasersV14;
        effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);

        if (lasersV14.length < 300 && Math.random() < (settings.density || 0.05)) {
            lasersV14.push({
                x: Math.random() * effectsCanvas.width, y: 0,
                speed: (settings.minSpeed || 5) + Math.random() * ((settings.maxSpeed || 15) - (settings.minSpeed || 5)),
                length: (settings.minLength || 20) + Math.random() * ((settings.maxLength || 70) - (settings.minLength || 20))
            });
        }
        lasersV14 = lasersV14.filter(l => l.y < effectsCanvas.height + l.length);
        lasersV14.forEach(l => {
            l.y += l.speed;
            effectsCtx.strokeStyle = settings.color || 'rgba(255, 0, 0, 0.7)';
            effectsCtx.lineWidth = settings.lineWidth || 2;
            effectsCtx.beginPath(); effectsCtx.moveTo(l.x, l.y); effectsCtx.lineTo(l.x, l.y - l.length);
            effectsCtx.stroke();
        });
        effectAnimationFrameId = requestAnimationFrame(animateV14Lasers);
    }

    function animateV14Strobe() {
        if (!effectsCtx || effectsMode !== 'strobeV14' || isMinimized || !currentSettings.effects || !currentSettings.effects.strobeV14) return;
        const settings = currentSettings.effects.strobeV14;
        effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);

        strobeStateV14.phase = (strobeStateV14.phase + (settings.speed || 0.1)) % (Math.PI * 2);
        const opacityValue = (Math.sin(strobeStateV14.phase) * 0.5 + 0.5) * (settings.maxOpacity || 0.2);
        const alpha = Math.max(0, Math.min(1, opacityValue)).toFixed(2);

        effectsCtx.fillStyle = (settings.color || 'rgba(255,255,255,{alpha})').replace('{alpha}', alpha);
        effectsCtx.fillRect(0, 0, effectsCanvas.width, effectsCanvas.height);
        effectAnimationFrameId = requestAnimationFrame(animateV14Strobe);
    }

    function updateEffectsRendering() {
        if (!effectsCtx || !effectsCanvas) return;
        if (effectAnimationFrameId) cancelAnimationFrame(effectAnimationFrameId);
        effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);

        if (effectsMode === 'none' || isMinimized) {
            effectsCanvas.style.display = 'none';
            snowflakesV13 = []; lasersV13 = []; lasersV14 = [];
            strobeStateV13 = { phase: 0, opacity: 0 };
            strobeStateV14 = { phase: 0, opacity: 0 };
            return;
        }
        effectsCanvas.style.display = 'block';

        switch (effectsMode) {
            case 'snowflake': initV13Snowflakes(); animateV13Snowflakes(); break;
            case 'laserV13': initV13Lasers(); animateV13Lasers(); break;
            case 'strobeV13': strobeStateV13 = {phase: 0, opacity:0}; animateV13Strobe(); break;
            case 'laserV14': initV14Lasers(); animateV14Lasers(); break;
            case 'strobeV14': strobeStateV14 = {phase:0, opacity:0}; animateV14Strobe(); break;
        }
    }

    function createEffectsSubmenu() {
        const submenu = document.createElement('div');
        submenu.id = 'hermes-effects-submenu';
        submenu.className = 'hermes-submenu';
        const effectsListConfig = [
            { mode: 'none', name: 'None', emoji: '🚫' },
            { mode: 'snowflake', name: 'Snowflake', emoji: '❄️' },
            { mode: 'laserV13', name: 'Laser (Classic)', emoji: '↔️🟥' },
            { mode: 'strobeV13', name: 'Strobe (Classic)', emoji: '🔄🚨' },
            { mode: 'laserV14', name: 'Laser (Simple)', emoji: '⬇️🟥' },
            { mode: 'strobeV14', name: 'Strobe (Simple)', emoji: '💡' }
        ];
        effectsListConfig.forEach(effect => {
            const button = document.createElement('button');
            button.className = 'hermes-button hermes-submenu-button';
            button.innerHTML = `${effect.emoji} ${effect.name}`;
            button.onclick = async (e) => {
                e.stopPropagation();
                effectsMode = effect.mode;
                try {
                    await saveDataToBackground(EFFECTS_STATE_KEY_EXT, effectsMode);
                    updateEffectsRendering();
                    if (effectsButton) updateButtonAppearance(effectsButton, 'effectsButton', isBunched, effect.emoji);
                    if (statusIndicator) { statusIndicator.textContent = `Effect: ${effect.name}`; statusIndicator.style.color = 'var(--hermes-success-text)'; setTimeout(resetStatusIndicator, 2000); }
                    debugLogs.push({ timestamp: Date.now(), type: 'toggle_cs', target: 'effects', details: { mode: effect.mode } });
                } catch (err) {
                    if (statusIndicator) { statusIndicator.textContent = `Failed to set effect`; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
                    console.error("Hermes CS: Failed to save effect state", err);
                }
                closeAllSubmenus();
            };
            submenu.appendChild(button);
        });
        return submenu;
    }

    function applyTheme() {
        if (!shadowRoot) return;
        const styleSheet = shadowRoot.querySelector('#hermes-styles') || document.createElement('style');
        styleSheet.id = 'hermes-styles';
        let themeVars = '';

        switch (theme) {
            case 'light':
                themeVars = `
                    --hermes-bg:#f8f9fa; --hermes-text:#212529; --hermes-border:#ced4da;
                    --hermes-button-bg:#e9ecef; --hermes-button-text:#212529; --hermes-button-hover-bg:#dee2e6;
                    --hermes-panel-bg:#ffffff; --hermes-panel-text:#212529; --hermes-panel-border:#ced4da;
                    --hermes-input-bg:#fff; --hermes-input-text:#212529; --hermes-input-border:#ced4da;
                    --hermes-accent-bar-bg:#e9ecef; --hermes-highlight-bg:#007bff; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#6c757d; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#007bff; --hermes-link-hover-color:#0056b3;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
             case 'dark':
                themeVars = `
                    --hermes-bg:#2c2c2c; --hermes-text:#e0e0e0; --hermes-border:#555;
                    --hermes-button-bg:#484848; --hermes-button-text:#e0e0e0; --hermes-button-hover-bg:#585858;
                    --hermes-panel-bg:#333333; --hermes-panel-text:#e0e0e0; --hermes-panel-border:#444;
                    --hermes-input-bg:#3a3a3a; --hermes-input-text:#e0e0e0; --hermes-input-border:#666;
                    --hermes-accent-bar-bg:#1e1e1e; --hermes-highlight-bg:#007bff; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:#6cb2eb; --hermes-link-hover-color:#3490dc;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'phoenix':
                themeVars = `
                    --hermes-bg:#1a0000; --hermes-text:#ffcc00; --hermes-border:#ff4500;
                    --hermes-button-bg:#8b0000; --hermes-button-text:#ffcc00; --hermes-button-hover-bg:#ff4500;
                    --hermes-panel-bg:#2c0000; --hermes-panel-text:#ffcc00; --hermes-panel-border:#ff4500;
                    --hermes-input-bg:#3a0000; --hermes-input-text:#ffcc00; --hermes-input-border:#ff4500;
                    --hermes-accent-bar-bg:#ff4500; --hermes-highlight-bg:#ff4500; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:#ff4500; --hermes-link-hover-color:#cc3700;
                    --hermes-text-shadow:0 0 3px rgba(255,69,0,0.5); --hermes-line-height:1.4;
                `;
                break;
            case 'seaGreen':
                themeVars = `
                    --hermes-bg:#e6f3f3; --hermes-text:#004d4d; --hermes-border:#00a3a3;
                    --hermes-button-bg:#b2d8d8; --hermes-button-text:#004d4d; --hermes-button-hover-bg:#00a3a3;
                    --hermes-panel-bg:#f0fafa; --hermes-panel-text:#004d4d; --hermes-panel-border:#00a3a3;
                    --hermes-input-bg:#fff; --hermes-input-text:#004d4d; --hermes-input-border:#00a3a3;
                    --hermes-accent-bar-bg:#008080; --hermes-highlight-bg:#008080; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#aaa; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#008080; --hermes-link-hover-color:#006666;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'auroraGlow':
                themeVars = `
                    --hermes-bg:#1a2b3c; --hermes-text:#a3d9ff; --hermes-border:#4b9cd3;
                    --hermes-button-bg:#2e4b6e; --hermes-button-text:#a3d9ff; --hermes-button-hover-bg:#4b9cd3;
                    --hermes-panel-bg:#223548; --hermes-panel-text:#a3d9ff; --hermes-panel-border:#4b9cd3;
                    --hermes-input-bg:#2e4b6e; --hermes-input-text:#a3d9ff; --hermes-input-border:#4b9cd3;
                    --hermes-accent-bar-bg:#4b9cd3; --hermes-highlight-bg:#4b9cd3; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:#4b9cd3; --hermes-link-hover-color:#3a7aa8;
                    --hermes-text-shadow:0 0 3px rgba(75,156,211,0.5); --hermes-line-height:1.4;
                `;
                break;
            case 'crimsonEmber':
                themeVars = `
                    --hermes-bg:#3d0000; --hermes-text:#ff9999; --hermes-border:#cc0000;
                    --hermes-button-bg:#660000; --hermes-button-text:#ff9999; --hermes-button-hover-bg:#cc0000;
                    --hermes-panel-bg:#4d0000; --hermes-panel-text:#ff9999; --hermes-panel-border:#cc0000;
                    --hermes-input-bg:#660000; --hermes-input-text:#ff9999; --hermes-input-border:#cc0000;
                    --hermes-accent-bar-bg:#cc0000; --hermes-highlight-bg:#cc0000; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:#cc0000; --hermes-link-hover-color:#990000;
                    --hermes-text-shadow:0 0 3px rgba(204,0,0,0.5); --hermes-line-height:1.4;
                `;
                break;
            case 'slateStorm':
                themeVars = `
                    --hermes-bg:#2f3b4c; --hermes-text:#d9e1e8; --hermes-border:#596475;
                    --hermes-button-bg:#3f4e62; --hermes-button-text:#d9e1e8; --hermes-button-hover-bg:#596475;
                    --hermes-panel-bg:#354356; --hermes-panel-text:#d9e1e8; --hermes-panel-border:#596475;
                    --hermes-input-bg:#3f4e62; --hermes-input-text:#d9e1e8; --hermes-input-border:#596475;
                    --hermes-accent-bar-bg:#596475; --hermes-highlight-bg:#596475; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:#596475; --hermes-link-hover-color:#465366;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'classicSlate':
                themeVars = `
                    --hermes-bg:${rgbStringToHex("64 64 64")}; --hermes-text:${rgbStringToHex("255 255 255")}; --hermes-border:${rgbStringToHex("128 128 128")};
                    --hermes-button-bg:${rgbStringToHex("128 128 128")}; --hermes-button-text:${rgbStringToHex("255 255 255")}; --hermes-button-hover-bg:${rgbStringToHex("64 64 64")};
                    --hermes-panel-bg:${rgbStringToHex("128 128 128")}; --hermes-panel-text:${rgbStringToHex("255 255 255")}; --hermes-panel-border:${rgbStringToHex("64 64 64")};
                    --hermes-input-bg:${rgbStringToHex("255 255 255")}; --hermes-input-text:${rgbStringToHex("0 0 0")}; --hermes-input-border:${rgbStringToHex("128 128 128")};
                    --hermes-accent-bar-bg:${rgbStringToHex("64 64 64")}; --hermes-highlight-bg:${rgbStringToHex("64 64 64")}; --hermes-highlight-text:${rgbStringToHex("255 255 255")};
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:${rgbStringToHex("64 64 64")}; --hermes-link-hover-color:${rgbStringToHex("96 96 96")};
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'classicWheat':
                themeVars = `
                    --hermes-bg:${rgbStringToHex("245 222 179")}; --hermes-text:${rgbStringToHex("0 0 0")}; --hermes-border:${rgbStringToHex("139 69 19")};
                    --hermes-button-bg:${rgbStringToHex("222 184 135")}; --hermes-button-text:${rgbStringToHex("0 0 0")}; --hermes-button-hover-bg:${rgbStringToHex("188 143 143")};
                    --hermes-panel-bg:${rgbStringToHex("245 245 220")}; --hermes-panel-text:${rgbStringToHex("0 0 0")}; --hermes-panel-border:${rgbStringToHex("139 69 19")};
                    --hermes-input-bg:${rgbStringToHex("255 255 255")}; --hermes-input-text:${rgbStringToHex("0 0 0")}; --hermes-input-border:${rgbStringToHex("139 69 19")};
                    --hermes-accent-bar-bg:${rgbStringToHex("222 184 135")}; --hermes-highlight-bg:${rgbStringToHex("222 184 135")}; --hermes-highlight-text:${rgbStringToHex("0 0 0")};
                    --hermes-disabled-text:#777; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:${rgbStringToHex("139 69 19")}; --hermes-link-hover-color:${rgbStringToHex("160 82 45")};
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'classicTeal':
                themeVars = `
                    --hermes-bg:${rgbStringToHex("0 128 128")}; --hermes-text:${rgbStringToHex("255 255 255")}; --hermes-border:${rgbStringToHex("32 178 170")};
                    --hermes-button-bg:${rgbStringToHex("32 178 170")}; --hermes-button-text:${rgbStringToHex("255 255 255")}; --hermes-button-hover-bg:${rgbStringToHex("0 139 139")};
                    --hermes-panel-bg:${rgbStringToHex("0 139 139")}; --hermes-panel-text:${rgbStringToHex("255 255 255")}; --hermes-panel-border:${rgbStringToHex("32 178 170")};
                    --hermes-input-bg:${rgbStringToHex("255 255 255")}; --hermes-input-text:${rgbStringToHex("0 0 0")}; --hermes-input-border:${rgbStringToHex("32 178 170")};
                    --hermes-accent-bar-bg:${rgbStringToHex("0 128 128")}; --hermes-highlight-bg:${rgbStringToHex("0 128 128")}; --hermes-highlight-text:${rgbStringToHex("255 255 255")};
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:${rgbStringToHex("32 178 170")}; --hermes-link-hover-color:${rgbStringToHex("0 139 139")};
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'classicSpruce':
                themeVars = `
                    --hermes-bg:${rgbStringToHex("0 100 0")}; --hermes-text:${rgbStringToHex("245 245 220")}; --hermes-border:${rgbStringToHex("34 139 34")};
                    --hermes-button-bg:${rgbStringToHex("34 139 34")}; --hermes-button-text:${rgbStringToHex("245 245 220")}; --hermes-button-hover-bg:${rgbStringToHex("0 100 0")};
                    --hermes-panel-bg:${rgbStringToHex("34 139 34")}; --hermes-panel-text:${rgbStringToHex("245 245 220")}; --hermes-panel-border:${rgbStringToHex("0 100 0")};
                    --hermes-input-bg:${rgbStringToHex("255 255 255")}; --hermes-input-text:${rgbStringToHex("0 0 0")}; --hermes-input-border:${rgbStringToHex("34 139 34")};
                    --hermes-accent-bar-bg:${rgbStringToHex("0 100 0")}; --hermes-highlight-bg:${rgbStringToHex("0 100 0")}; --hermes-highlight-text:${rgbStringToHex("245 245 220")};
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:${rgbStringToHex("34 139 34")}; --hermes-link-hover-color:${rgbStringToHex("0 100 0")};
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'classicStorm':
                themeVars = `
                    --hermes-bg:${rgbStringToHex("105 105 105")}; --hermes-text:${rgbStringToHex("255 255 255")}; --hermes-border:${rgbStringToHex("169 169 169")};
                    --hermes-button-bg:${rgbStringToHex("169 169 169")}; --hermes-button-text:${rgbStringToHex("255 255 255")}; --hermes-button-hover-bg:${rgbStringToHex("128 128 128")};
                    --hermes-panel-bg:${rgbStringToHex("169 169 169")}; --hermes-panel-text:${rgbStringToHex("255 255 255")}; --hermes-panel-border:${rgbStringToHex("105 105 105")};
                    --hermes-input-bg:${rgbStringToHex("255 255 255")}; --hermes-input-text:${rgbStringToHex("0 0 0")}; --hermes-input-border:${rgbStringToHex("169 169 169")};
                    --hermes-accent-bar-bg:${rgbStringToHex("105 105 105")}; --hermes-highlight-bg:${rgbStringToHex("105 105 105")}; --hermes-highlight-text:${rgbStringToHex("255 255 255")};
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:${rgbStringToHex("169 169 169")}; --hermes-link-hover-color:${rgbStringToHex("128 128 128")};
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'rose':
                themeVars = `
                    --hermes-bg:#ffe6e6; --hermes-text:#4a0000; --hermes-border:#ff9999;
                    --hermes-button-bg:#ffcccc; --hermes-button-text:#4a0000; --hermes-button-hover-bg:#ff9999;
                    --hermes-panel-bg:#fff0f0; --hermes-panel-text:#4a0000; --hermes-panel-border:#ff9999;
                    --hermes-input-bg:#fff; --hermes-input-text:#4a0000; --hermes-input-border:#ff9999;
                    --hermes-accent-bar-bg:#ff9999; --hermes-highlight-bg:#ff9999; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#ff9999; --hermes-link-hover-color:#cc6666;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'pumpkin':
                themeVars = `
                    --hermes-bg:#ffedcc; --hermes-text:#3d2600; --hermes-border:#ff9900;
                    --hermes-button-bg:#ffcc80; --hermes-button-text:#3d2600; --hermes-button-hover-bg:#ff9900;
                    --hermes-panel-bg:#fff5e6; --hermes-panel-text:#3d2600; --hermes-panel-border:#ff9900;
                    --hermes-input-bg:#fff; --hermes-input-text:#3d2600; --hermes-input-border:#ff9900;
                    --hermes-accent-bar-bg:#ff9900; --hermes-highlight-bg:#ff9900; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#ff9900; --hermes-link-hover-color:#cc7a00;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'marine':
                themeVars = `
                    --hermes-bg:#e6f3ff; --hermes-text:#002966; --hermes-border:#0066cc;
                    --hermes-button-bg:#b3d9ff; --hermes-button-text:#002966; --hermes-button-hover-bg:#0066cc;
                    --hermes-panel-bg:#f0faff; --hermes-panel-text:#002966; --hermes-panel-border:#0066cc;
                    --hermes-input-bg:#fff; --hermes-input-text:#002966; --hermes-input-border:#0066cc;
                    --hermes-accent-bar-bg:#0066cc; --hermes-highlight-bg:#0066cc; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#0066cc; --hermes-link-hover-color:#004d99;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'rainyDay':
                themeVars = `
                    --hermes-bg:#e6e9ed; --hermes-text:#2e3748; --hermes-border:#6c8294;
                    --hermes-button-bg:#b8c1cc; --hermes-button-text:#2e3748; --hermes-button-hover-bg:#6c8294;
                    --hermes-panel-bg:#f0f2f5; --hermes-panel-text:#2e3748; --hermes-panel-border:#6c8294;
                    --hermes-input-bg:#fff; --hermes-input-text:#2e3748; --hermes-input-border:#6c8294;
                    --hermes-accent-bar-bg:#6c8294; --hermes-highlight-bg:#6c8294; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#6c8294; --hermes-link-hover-color:#536675;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'eggplant':
                themeVars = `
                    --hermes-bg:#f2e6f2; --hermes-text:#3c2f3c; --hermes-border:#663366;
                    --hermes-button-bg:#d9c2d9; --hermes-button-text:#3c2f3c; --hermes-button-hover-bg:#663366;
                    --hermes-panel-bg:#f9f2f9; --hermes-panel-text:#3c2f3c; --hermes-panel-border:#663366;
                    --hermes-input-bg:#fff; --hermes-input-text:#3c2f3c; --hermes-input-border:#663366;
                    --hermes-accent-bar-bg:#663366; --hermes-highlight-bg:#663366; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#663366; --hermes-link-hover-color:#4d264d;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'plum':
                themeVars = `
                    --hermes-bg:#1c0b21; --hermes-text:#e0b0ff; --hermes-border:#9933cc;
                    --hermes-button-bg:#330033; --hermes-button-text:#e0b0ff; --hermes-button-hover-bg:#9933cc;
                    --hermes-panel-bg:#2d1a33; --hermes-panel-text:#e0b0ff; --hermes-panel-border:#9933cc;
                    --hermes-input-bg:#330033; --hermes-input-text:#e0b0ff; --hermes-input-border:#9933cc;
                    --hermes-accent-bar-bg:#9933cc; --hermes-highlight-bg:#9933cc; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:#9933cc; --hermes-link-hover-color:#7a2999;
                    --hermes-text-shadow:0 0 3px rgba(153,51,204,0.5); --hermes-line-height:1.4;
                `;
                break;
            case 'redBlueWhite':
                themeVars = `
                    --hermes-bg:#f5f6f5; --hermes-text:#1c2526; --hermes-border:#c1c2c1;
                    --hermes-button-bg:#c1c2c1; --hermes-button-text:#1c2526; --hermes-button-hover-bg:#a1a2a1;
                    --hermes-panel-bg:#ffffff; --hermes-panel-text:#1c2526; --hermes-panel-border:#c1c2c1;
                    --hermes-input-bg:#ffffff; --hermes-input-text:#1c2526; --hermes-input-border:#c1c2c1;
                    --hermes-accent-bar-bg:#c1c2c1; --hermes-highlight-bg:#0033a0; --hermes-highlight-text:#ffffff;
                    --hermes-disabled-text:#777; --hermes-error-text:#bf0a30; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#0033a0; --hermes-link-hover-color:#002269;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'maple':
                themeVars = `
                    --hermes-bg:#f5e6e6; --hermes-text:#3c1c1c; --hermes-border:#cc3333;
                    --hermes-button-bg:#e6b2b2; --hermes-button-text:#3c1c1c; --hermes-button-hover-bg:#cc3333;
                    --hermes-panel-bg:#fff0f0; --hermes-panel-text:#3c1c1c; --hermes-panel-border:#cc3333;
                    --hermes-input-bg:#fff; --hermes-input-text:#3c1c1c; --hermes-input-border:#cc3333;
                    --hermes-accent-bar-bg:#cc3333; --hermes-highlight-bg:#cc3333; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#cc3333; --hermes-link-hover-color:#991a1a;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'lilac':
                themeVars = `
                    --hermes-bg:#f0e6ff; --hermes-text:#3c2f4d; --hermes-border:#9966cc;
                    --hermes-button-bg:#d9c2ff; --hermes-button-text:#3c2f4d; --hermes-button-hover-bg:#9966cc;
                    --hermes-panel-bg:#f9f2ff; --hermes-panel-text:#3c2f4d; --hermes-panel-border:#9966cc;
                    --hermes-input-bg:#fff; --hermes-input-text:#3c2f4d; --hermes-input-border:#9966cc;
                    --hermes-accent-bar-bg:#9966cc; --hermes-highlight-bg:#9966cc; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#9966cc; --hermes-link-hover-color:#7a5299;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'desert':
                themeVars = `
                    --hermes-bg:#f5e6cc; --hermes-text:#3c2f1c; --hermes-border:#cc9966;
                    --hermes-button-bg:#e6c2a3; --hermes-button-text:#3c2f1c; --hermes-button-hover-bg:#cc9966;
                    --hermes-panel-bg:#fff5e6; --hermes-panel-text:#3c2f1c; --hermes-panel-border:#cc9966;
                    --hermes-input-bg:#fff; --hermes-input-text:#3c2f1c; --hermes-input-border:#cc9966;
                    --hermes-accent-bar-bg:#cc9966; --hermes-highlight-bg:#cc9966; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#dc3545; --hermes-success-text:#28a745;
                    --hermes-warning-text:#ffc107; --hermes-info-text:#17a2b8;
                    --hermes-link-color:#cc9966; --hermes-link-hover-color:#99734d;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
                break;
            case 'brick':
                themeVars = `
                    --hermes-bg:#3c1c1c; --hermes-text:#e6b2b2; --hermes-border:#cc6666;
                    --hermes-button-bg:#662222; --hermes-button-text:#e6b2b2; --hermes-button-hover-bg:#cc6666;
                    --hermes-panel-bg:#4d2a2a; --hermes-panel-text:#e6b2b2; --hermes-panel-border:#cc6666;
                    --hermes-input-bg:#662222; --hermes-input-text:#e6b2b2; --hermes-input-border:#cc6666;
                    --hermes-accent-bar-bg:#cc6666; --hermes-highlight-bg:#cc6666; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:#cc6666; --hermes-link-hover-color:#994d4d;
                    --hermes-text-shadow:0 0 3px rgba(204,102,102,0.5); --hermes-line-height:1.4;
                `;
                break;
            default:
                console.warn(`Hermes CS: Unknown theme "${theme}", defaulting to dark.`);
                theme = 'dark';
                themeVars = `
                    --hermes-bg:#2c2c2c; --hermes-text:#e0e0e0; --hermes-border:#555;
                    --hermes-button-bg:#484848; --hermes-button-text:#e0e0e0; --hermes-button-hover-bg:#585858;
                    --hermes-panel-bg:#333333; --hermes-panel-text:#e0e0e0; --hermes-panel-border:#444;
                    --hermes-input-bg:#3a3a3a; --hermes-input-text:#e0e0e0; --hermes-input-border:#666;
                    --hermes-accent-bar-bg:#1e1e1e; --hermes-highlight-bg:#007bff; --hermes-highlight-text:#fff;
                    --hermes-disabled-text:#777; --hermes-error-text:#f5c6cb; --hermes-success-text:#c3e6cb;
                    --hermes-warning-text:#ffeeba; --hermes-info-text:#bee5eb;
                    --hermes-link-color:#6cb2eb; --hermes-link-hover-color:#3490dc;
                    --hermes-text-shadow:none; --hermes-line-height:1.4;
                `;
        }

        const baseElementStyles = `
            :host {
                all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                box-sizing: border-box; ${themeVars}
            }
            *, *::before, *::after { box-sizing: inherit; }
            #hermes-ui-container {
                position: fixed;
                top: ${state.position.top !== null ? state.position.top + 'px' : '10px'};
                left: ${state.position.left !== null ? state.position.left + 'px' : '10px'};
                background: var(--hermes-bg); color: var(--hermes-text);
                border: 1px solid var(--hermes-border);
                border-width: ${currentSettings.hermesBorderThickness || '1px'};
                border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                z-index: 2147483640; padding: ${isBunched ? '6px' : '8px'};
                display: ${isMinimized ? 'none' : 'flex'};
                flex-direction: ${isBunched ? 'column' : 'row'};
                flex-wrap: ${isBunched ? 'nowrap' : 'wrap'};
                gap: ${isBunched ? '4px' : '5px'};
                align-items: ${isBunched ? 'stretch' : 'center'};
                max-width: ${isBunched ? '200px' : '95vw'};
                font-size: 14px; line-height: var(--hermes-line-height); user-select: none;
            }
            #hermes-minimized-container {
                position: fixed;
                top: ${state.position.top !== null ? state.position.top + 'px' : '10px'};
                left: ${state.position.left !== null ? state.position.left + 'px' : '10px'};
                background: var(--hermes-button-bg); color: var(--hermes-button-text);
                border: 1px solid var(--hermes-border);
                border-width: ${currentSettings.hermesBorderThickness || '1px'};
                border-radius: 50%; width: 40px; height: 40px;
                display: ${isMinimized ? 'flex' : 'none'};
                align-items: center; justify-content: center; cursor: pointer;
                z-index: 2147483640; box-shadow: 0 5px 15px rgba(0,0,0,0.3); font-size: 20px;
            }
            .hermes-button {
                background: var(--hermes-button-bg); color: var(--hermes-button-text);
                border: 1px solid var(--hermes-border); border-radius: 4px;
                padding: ${isBunched ? '6px 4px' : '5px 7px'};
                cursor: pointer; font-size: ${isBunched ? '13px' : '12px'};
                transition: background-color 0.2s, color 0.2s, border-color 0.2s;
                white-space: nowrap; line-height: var(--hermes-line-height);
                text-shadow: var(--hermes-text-shadow); display: flex;
                align-items: center; justify-content: center;
                gap: ${isBunched ? '3px' : '4px'}; flex-shrink: 0;
            }
            .hermes-button:hover { background: var(--hermes-button-hover-bg); }
            .hermes-button:disabled {
                background: var(--hermes-disabled-text) !important; color: var(--hermes-bg) !important;
                cursor: not-allowed; opacity: 0.7;
            }
            #hermes-drag-handle {
                cursor: move; padding: ${isBunched ? '6px 4px' : '6px'};
                background: var(--hermes-accent-bar-bg); color: var(--hermes-button-text);
                border-radius: 4px; display: flex; align-items: center; justify-content: center;
                font-size: ${isBunched ? '14px' : '16px'}; line-height: var(--hermes-line-height);
                align-self: ${isBunched ? 'stretch' : 'center'};
            }
            #hermes-status {
                font-size: ${isBunched ? '10px' : '11px'}; padding: 4px 6px;
                color: var(--hermes-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                line-height: var(--hermes-line-height); text-shadow: var(--hermes-text-shadow);
                margin-top: ${isBunched ? 'auto' : '0'}; text-align: ${isBunched ? 'center' : 'left'};
                background: rgba(0,0,0,0.1); border-radius: 3px;
            }
            .hermes-submenu {
                position: absolute; background: var(--hermes-panel-bg);
                border: 1px solid var(--hermes-panel-border); border-radius: 4px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.25); z-index: 2147483645;
                padding: 4px 0; display: none; max-height: 250px; overflow-y: auto; min-width: 160px;
            }
            .hermes-submenu-button {
                width: 100%; text-align: left; padding: 8px 12px; border: none; background: transparent;
                color: var(--hermes-panel-text); font-size: 14px; line-height: var(--hermes-line-height);
                text-shadow: var(--hermes-text-shadow); display: flex; align-items: center; gap: 6px; border-radius:0;
            }
            .hermes-submenu-button:hover { background: var(--hermes-button-hover-bg); color: var(--hermes-button-text); }
            .hermes-submenu-item-container { display: flex; align-items: center; justify-content: space-between; }
            .hermes-submenu-item-container .hermes-submenu-button { flex-grow: 1; }
            .hermes-submenu-delete-button {
                padding: 6px 8px !important; font-size: 12px !important; min-width: auto !important;
                background: var(--hermes-error-text) !important; color: var(--hermes-panel-bg) !important;
                margin-right: 5px; border-radius: 3px !important; flex-shrink: 0;
            }
            .hermes-submenu-delete-button:hover { opacity: 0.8; }
            .hermes-submenu-empty-message {
                padding: 10px 12px; text-align: center; color: var(--hermes-disabled-text); font-size: 13px;
            }
            .hermes-panel {
                color: var(--hermes-panel-text); background: var(--hermes-panel-bg);
                border-color: var(--hermes-panel-border); z-index: 2147483647 !important;
            }
            .hermes-panel-title {
                margin: -5px -5px 15px -5px; padding: 10px 15px; font-size: 1.25em;
                color: var(--hermes-panel-text); background: var(--hermes-accent-bar-bg);
                border-bottom: 1px solid var(--hermes-panel-border); border-radius: 8px 8px 0 0;
            }
            .hermes-panel-content {
                margin-bottom: 20px; font-size: 0.95em; line-height: var(--hermes-line-height);
                max-height: 60vh; overflow-y: auto; padding-right: 5px;
            }
            .hermes-panel-buttons {
                display: flex; gap: 10px; justify-content: flex-end; padding-top: 15px;
                border-top: 1px solid var(--hermes-panel-border);
                margin: 0 -20px -20px -20px; padding: 15px 20px;
                background: var(--hermes-bg); border-radius: 0 0 8px 8px;
            }
            .hermes-panel input[type="text"], .hermes-panel textarea, .hermes-panel select {
                background: var(--hermes-input-bg); color: var(--hermes-input-text);
                border: 1px solid var(--hermes-input-border); border-radius: 4px;
                padding: 8px; font-size: 14px; line-height: var(--hermes-line-height);
                width: 100%; box-sizing: border-box;
            }
            .hermes-panel input[type="text"]:focus, .hermes-panel textarea:focus, .hermes-panel select:focus {
                outline: none; border-color: var(--hermes-highlight-bg);
                box-shadow: 0 0 0 2px var(--hermes-highlight-bg)40;
            }
            a { color: var(--hermes-link-color); text-decoration: none; }
            a:hover { color: var(--hermes-link-hover-color); text-decoration: underline; }
        `;

        styleSheet.textContent = baseElementStyles;
        if (!shadowRoot.querySelector('#hermes-styles')) {
            shadowRoot.appendChild(styleSheet);
        }

        if (uiContainer && !isMinimized) {
            uiContainer.style.display = 'flex';
            if(fillButton) updateButtonAppearance(fillButton, 'fill', isBunched);
            if(editProfileButton) updateButtonAppearance(editProfileButton, 'editProfile', isBunched);
            if(recordButton) updateButtonAppearance(recordButton, 'record', isBunched);
            if(stopSaveButton) updateButtonAppearance(stopSaveButton, 'stopSave', isBunched);
            const macroBtn = shadowRoot.querySelector('#hermes-macro-button');
            if (macroBtn) updateButtonAppearance(macroBtn, 'macros', isBunched);
            if(viewLogButton) updateButtonAppearance(viewLogButton, 'viewLog', isBunched);
            if(trainButton) updateButtonAppearance(trainButton, 'train', isBunched);
            if(overlayToggle) updateButtonAppearance(overlayToggle, 'overlayToggle', isBunched);
            if(learningToggle) updateButtonAppearance(learningToggle, 'learningToggle', isBunched);
            if(debugToggle) updateButtonAppearance(debugToggle, 'debugToggle', isBunched);
            const themeBtn = shadowRoot.querySelector('#hermes-theme-button');
            if (themeBtn) updateButtonAppearance(themeBtn, 'themeButton', isBunched, themeOptions[theme]?.emoji || '🎨');
            if (effectsButton) {
                 const effectsListDisplay = [
                    { mode: 'none', emoji: '🚫' }, { mode: 'snowflake', emoji: '❄️' },
                    { mode: 'laserV13', emoji: '↔️🟥' }, { mode: 'strobeV13', emoji: '🔄🚨' },
                    { mode: 'laserV14', emoji: '⬇️🟥' }, { mode: 'strobeV14', emoji: '💡' }
                ];
                const activeEffectDisplay = effectsListDisplay.find(ef => ef.mode === effectsMode);
                const currentEffectEmoji = activeEffectDisplay ? activeEffectDisplay.emoji : hermesButtonProperties.effectsButton.emoji;
                updateButtonAppearance(effectsButton, 'effectsButton', isBunched, currentEffectEmoji);
            }
            const bunchBtn = shadowRoot.querySelector('#hermes-bunch-button');
            if (bunchBtn) updateButtonAppearance(bunchBtn, 'bunchButton', isBunched);
            const whitelistBtn = shadowRoot.querySelector('#hermes-whitelist-button');
            if (whitelistBtn) updateButtonAppearance(whitelistBtn, 'whitelistButton', isBunched);
            if (helpButton) updateButtonAppearance(helpButton, 'helpButton', isBunched);
            if (settingsButton) updateButtonAppearance(settingsButton, 'settingsButton', isBunched);
            const sniffBtn = shadowRoot.querySelector('#hermes-sniff-button');
            if (sniffBtn) updateButtonAppearance(sniffBtn, 'sniffButton', isBunched);
            const importBtn = shadowRoot.querySelector('#hermes-import-button');
            if (importBtn) updateButtonAppearance(importBtn, 'importButton', isBunched);

            if (currentSettings.hermesBorderThickness) {
                uiContainer.style.borderWidth = currentSettings.hermesBorderThickness;
                 if (minimizedContainer) minimizedContainer.style.borderWidth = currentSettings.hermesBorderThickness;
            }
        }
    }

    function createThemeSubmenu() {
        const submenu = document.createElement('div');
        submenu.id = 'hermes-theme-submenu';
        submenu.className = 'hermes-submenu';
        Object.keys(themeOptions).forEach(themeKey => {
            const button = document.createElement('button');
            button.className = 'hermes-button hermes-submenu-button';
            button.innerHTML = `${themeOptions[themeKey].emoji} ${themeOptions[themeKey].name}`;
            button.onclick = async (e) => {
                e.stopPropagation();
                theme = themeKey;
                try {
                    await saveDataToBackground(THEME_KEY_EXT, themeKey);
                    applyTheme();
                    if (statusIndicator) { statusIndicator.textContent = `Theme: ${themeOptions[themeKey].name}`; statusIndicator.style.color = 'var(--hermes-success-text)'; setTimeout(resetStatusIndicator, 2000); }
                    debugLogs.push({ timestamp: Date.now(), type: 'toggle_cs', target: 'theme', details: { theme: themeKey } });
                } catch (err) {
                     console.error("Hermes CS: Failed to save theme", err);
                }
                closeAllSubmenus();
            };
            submenu.appendChild(button);
        });
        return submenu;
    }

    async function snapToEdge(edge) {
        if (!uiContainer || !minimizedContainer) return;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const uiRect = uiContainer.getBoundingClientRect();
        const minRect = minimizedContainer.getBoundingClientRect();

        let newTop = parseFloat(uiContainer.style.top) || state.position.top || 10;
        let newLeft = parseFloat(uiContainer.style.left) || state.position.left || 10;
        let currentWidth = uiRect.width;
        let currentHeight = uiRect.height;
        if (isMinimized) { currentWidth = minRect.width || 40; currentHeight = minRect.height || 40; }

        switch (edge) {
            case 'left': newLeft = 10; break;
            case 'right': newLeft = viewportWidth - currentWidth - 10; break;
            case 'top': newTop = 10; break;
            case 'bottom': newTop = viewportHeight - currentHeight - 10; break;
            case 'top-left': newTop = 10; newLeft = 10; break;
            case 'top-right': newTop = 10; newLeft = viewportWidth - currentWidth - 10; break;
            case 'bottom-left': newTop = viewportHeight - currentHeight - 10; newLeft = 10; break;
            case 'bottom-right': newTop = viewportHeight - currentHeight - 10; newLeft = viewportWidth - currentWidth - 10; break;
        }
        newLeft = Math.max(10, Math.min(newLeft, viewportWidth - currentWidth - 10));
        newTop = Math.max(10, Math.min(newTop, viewportHeight - currentHeight - 10));

        state.position.top = newTop; state.position.left = newLeft;
        uiContainer.style.top = `${newTop}px`; uiContainer.style.left = `${newLeft}px`;
        minimizedContainer.style.top = `${newTop}px`; minimizedContainer.style.left = `${newLeft}px`;
        try {
            await saveDataToBackground(POSITION_KEY_EXT, state.position);
            debugLogs.push({ timestamp: Date.now(), type: 'snap_cs', target: 'ui', details: { edge, top: newTop, left: newLeft } });
        } catch (e) { console.error("Hermes CS: Failed to save snapped position", e); }
    }
    function setupDragging() {
        if (!uiContainer) return;
        const dragHandle = uiContainer.querySelector('#hermes-drag-handle');
        if (!dragHandle) { console.warn("Hermes CS: Drag handle not found."); return; }

        dragHandle.onmousedown = (e) => {
            if (e.target !== dragHandle && e.target.tagName === 'BUTTON') return;
            e.preventDefault();

            dragging = true;
            justDragged = false;
            const rect = uiContainer.getBoundingClientRect();
            offset.x = e.clientX - rect.left;
            offset.y = e.clientY - rect.top;
            document.body.style.userSelect = 'none';
            debugLogs.push({ timestamp: Date.now(), type: 'drag_start_cs', target: 'ui', details: { clientX: e.clientX, clientY: e.clientY } });
        };
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            justDragged = true;
            let newLeft = e.clientX - offset.x;
            let newTop = e.clientY - offset.y;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const uiRect = uiContainer.getBoundingClientRect();
            newLeft = Math.max(0, Math.min(newLeft, viewportWidth - uiRect.width));
            newTop = Math.max(0, Math.min(newTop, viewportHeight - uiRect.height));
            uiContainer.style.left = `${newLeft}px`;
            uiContainer.style.top = `${newTop}px`;
            if (minimizedContainer) {
                minimizedContainer.style.left = `${newLeft}px`;
                minimizedContainer.style.top = `${newTop}px`;
            }
            state.position.left = newLeft;
            state.position.top = newTop;
        });
        document.addEventListener('mouseup', async (e) => {
            if (dragging) {
                dragging = false; document.body.style.userSelect = '';
                try {
                    await saveDataToBackground(POSITION_KEY_EXT, state.position);
                    debugLogs.push({ timestamp: Date.now(), type: 'drag_end_cs', target: 'ui', details: { top: state.position.top, left: state.position.left } });
                } catch (err) { console.error("Hermes CS: Failed to save dragged position", err); }
                setTimeout(() => { justDragged = false; }, 50);
            }
        });
    }

    function toggleMinimizedUI(minimize) {
        if (!uiContainer || !minimizedContainer || !shadowRoot) return;
        isMinimized = minimize;

        uiContainer.style.display = isMinimized ? 'none' : 'flex';
        minimizedContainer.style.display = isMinimized ? 'flex' : 'none';

        if (effectsCanvas) {
            effectsCanvas.style.display = isMinimized ? 'none' : (effectsMode !== 'none' ? 'block' : 'none');
        }

        if (isMinimized) {
            removeVisualOverlays();
            stopMutationObserver();
        } else {
            if (showOverlays) applyVisualOverlays();
            startMutationObserver();
            applyTheme();
            uiContainer.style.top = `${state.position.top !== null ? state.position.top + 'px' : '10px'}`;
            uiContainer.style.left = `${state.position.left !== null ? state.position.left + 'px' : '10px'}`;
        }
        updateEffectsRendering();
        debugLogs.push({ timestamp: Date.now(), type: 'ui_minimize_cs', target: 'toggle', details: { isMinimized } });
    }

    function closeAllSubmenus() {
        if (shadowRoot) {
            shadowRoot.querySelectorAll('.hermes-submenu').forEach(submenu => {
                if (submenu.style.display !== 'none') {
                    submenu.style.display = 'none';
                }
            });
        }
    }
    function closeOtherSubmenus(currentSubmenuToKeepOpen) {
        if (shadowRoot) {
            shadowRoot.querySelectorAll('.hermes-submenu').forEach(submenu => {
                if (submenu !== currentSubmenuToKeepOpen && submenu.style.display !== 'none') {
                    submenu.style.display = 'none';
                }
            });
        }
    }

    function setupUI() {
        if (document.querySelector('#hermes-shadow-host')) {
             console.warn("Hermes CS: UI setup aborted, shadow host already exists.");
             return;
        }
        const shadowHost = document.createElement('div');
        shadowHost.id = 'hermes-shadow-host';
        shadowHost.style.position = 'relative'; shadowHost.style.zIndex = '2147483630';
        shadowHost.style.lineHeight = 'normal'; shadowHost.style.fontSize = 'initial';

        (document.body || document.documentElement).appendChild(shadowHost);
        shadowRoot = shadowHost.attachShadow({ mode: 'open' });

        uiContainer = document.createElement('div'); uiContainer.id = 'hermes-ui-container'; shadowRoot.appendChild(uiContainer);
        minimizedContainer = document.createElement('div'); minimizedContainer.id = 'hermes-minimized-container';
        minimizedContainer.innerHTML = '🛠️'; minimizedContainer.onclick = () => toggleMinimizedUI(false); shadowRoot.appendChild(minimizedContainer);

        const dragHandle = document.createElement('div'); dragHandle.id = 'hermes-drag-handle'; dragHandle.innerHTML = '☰'; uiContainer.appendChild(dragHandle);

        fillButton = document.createElement('button'); updateButtonAppearance(fillButton, 'fill', isBunched);
        fillButton.onclick = () => { closeAllSubmenus(); runFormFiller(profileData); }; uiContainer.appendChild(fillButton);

        editProfileButton = document.createElement('button'); updateButtonAppearance(editProfileButton, 'editProfile', isBunched);
        editProfileButton.onclick = () => { closeAllSubmenus(); toggleProfileEditor(true); }; uiContainer.appendChild(editProfileButton);

        recordButton = document.createElement('button'); updateButtonAppearance(recordButton, 'record', isBunched);
        recordButton.onclick = () => { closeAllSubmenus(); startRecording(); }; uiContainer.appendChild(recordButton);

        stopSaveButton = document.createElement('button'); updateButtonAppearance(stopSaveButton, 'stopSave', isBunched);
        stopSaveButton.onclick = () => { closeAllSubmenus(); stopRecording(); }; uiContainer.appendChild(stopSaveButton);

        const macroButton = document.createElement('button'); macroButton.id = 'hermes-macro-button'; updateButtonAppearance(macroButton, 'macros', isBunched); uiContainer.appendChild(macroButton);
        const macroSubmenu = document.createElement('div'); macroSubmenu.id = 'hermes-macro-submenu'; macroSubmenu.className = 'hermes-submenu'; uiContainer.appendChild(macroSubmenu);
        macroButton.onclick = (e) => {
            e.stopPropagation(); closeOtherSubmenus(macroSubmenu);
            const isCurrentlyVisible = macroSubmenu.style.display === 'block';
            macroSubmenu.style.display = isCurrentlyVisible ? 'none' : 'block';
            if (!isCurrentlyVisible) {
                macroSubmenu.style.top = `${macroButton.offsetTop + macroButton.offsetHeight + 2}px`;
                macroSubmenu.style.left = `${macroButton.offsetLeft}px`;
                updateMacroSubmenuContents(macroSubmenu);
            }
        };

        viewLogButton = document.createElement('button'); updateButtonAppearance(viewLogButton, 'viewLog', isBunched);
        viewLogButton.style.display = debugMode ? 'inline-flex' : 'none';
        viewLogButton.onclick = () => { closeAllSubmenus(); toggleLogViewer(true); }; uiContainer.appendChild(viewLogButton);

        trainButton = document.createElement('button'); updateButtonAppearance(trainButton, 'train', isBunched);
        trainButton.style.display = learningMode ? 'inline-flex' : 'none';
        trainButton.onclick = () => { closeAllSubmenus(); runHeuristicTrainerSession(); }; uiContainer.appendChild(trainButton);

        overlayToggle = document.createElement('button'); updateButtonAppearance(overlayToggle, 'overlayToggle', isBunched);
        overlayToggle.onclick = async () => {
            closeAllSubmenus(); const newShowOverlays = !showOverlays;
            try {
                await saveDataToBackground(OVERLAY_STATE_KEY_EXT, newShowOverlays); showOverlays = newShowOverlays;
                updateButtonAppearance(overlayToggle, 'overlayToggle', isBunched);
                if (showOverlays) applyVisualOverlays(); else removeVisualOverlays();
                debugLogs.push({ timestamp: Date.now(), type: 'toggle_cs', target: 'overlay', details: { enabled: showOverlays } });
            } catch (e) { console.error("Hermes CS: Failed to save overlay state", e); }
        }; uiContainer.appendChild(overlayToggle);

        learningToggle = document.createElement('button'); updateButtonAppearance(learningToggle, 'learningToggle', isBunched);
        learningToggle.onclick = async () => {
            closeAllSubmenus(); const newLearningMode = !learningMode;
            try {
                await saveDataToBackground(LEARNING_STATE_KEY_EXT, newLearningMode); learningMode = newLearningMode;
                updateButtonAppearance(learningToggle, 'learningToggle', isBunched);
                if (trainButton) trainButton.style.display = learningMode ? 'inline-flex' : 'none';
                if (statusIndicator) { statusIndicator.textContent = `Learn: ${learningMode ? 'On' : 'Off'}`; statusIndicator.style.color = learningMode ? 'var(--hermes-success-text)' : 'var(--hermes-warning-text)'; setTimeout(resetStatusIndicator, 2000); }
            } catch (e) { console.error("Hermes CS: Failed to save learning state", e); }
        }; uiContainer.appendChild(learningToggle);

        debugToggle = document.createElement('button'); updateButtonAppearance(debugToggle, 'debugToggle', isBunched);
        debugToggle.onclick = async () => {
            closeAllSubmenus(); const newDebugMode = !debugMode;
            try {
                await saveDataToBackground(DEBUG_MODE_KEY_EXT, newDebugMode); debugMode = newDebugMode;
                updateButtonAppearance(debugToggle, 'debugToggle', isBunched);
                if (viewLogButton) viewLogButton.style.display = debugMode ? 'inline-flex' : 'none';
                if (debugMode) { HermesDebug.start(); setupDebugControls(); }
                if (statusIndicator) { statusIndicator.textContent = `Debug: ${debugMode ? 'On' : 'Off'}`; statusIndicator.style.color = debugMode ? 'var(--hermes-success-text)' : 'var(--hermes-warning-text)'; setTimeout(resetStatusIndicator, 2000); }
            } catch (e) { console.error("Hermes CS: Failed to save debug state", e); }
        }; uiContainer.appendChild(debugToggle);

        const themeButtonElement = document.createElement('button'); themeButtonElement.id = 'hermes-theme-button'; updateButtonAppearance(themeButtonElement, 'themeButton', isBunched, themeOptions[theme]?.emoji || '🎨'); uiContainer.appendChild(themeButtonElement);
        const themeSubmenu = createThemeSubmenu(); uiContainer.appendChild(themeSubmenu);
        themeButtonElement.onclick = (e) => {
            e.stopPropagation(); closeOtherSubmenus(themeSubmenu);
            const isCurrentlyVisible = themeSubmenu.style.display === 'block';
            themeSubmenu.style.display = isCurrentlyVisible ? 'none' : 'block';
            if (!isCurrentlyVisible) {
                themeSubmenu.style.top = `${themeButtonElement.offsetTop + themeButtonElement.offsetHeight + 2}px`;
                themeSubmenu.style.left = `${themeButtonElement.offsetLeft}px`;
            }
        };

        effectsButton = document.createElement('button'); effectsButton.id = 'hermes-effects-button';
        const effectsListDisplayInit = [ { mode: 'none', emoji: '🚫' }, { mode: 'snowflake', emoji: '❄️' }, { mode: 'laserV13', emoji: '↔️🟥' }, { mode: 'strobeV13', emoji: '🔄🚨' }, { mode: 'laserV14', emoji: '⬇️🟥' }, { mode: 'strobeV14', emoji: '💡' } ];
        const activeEffectOnInit = effectsListDisplayInit.find(ef => ef.mode === effectsMode);
        const initialEffectEmoji = activeEffectOnInit ? activeEffectOnInit.emoji : hermesButtonProperties.effectsButton.emoji;
        updateButtonAppearance(effectsButton, 'effectsButton', isBunched, initialEffectEmoji); uiContainer.appendChild(effectsButton);
        const effectsSubmenu = createEffectsSubmenu(); uiContainer.appendChild(effectsSubmenu);
        effectsButton.onclick = (e) => {
            e.stopPropagation(); closeOtherSubmenus(effectsSubmenu);
            const isCurrentlyVisible = effectsSubmenu.style.display === 'block';
            effectsSubmenu.style.display = isCurrentlyVisible ? 'none' : 'block';
            if(!isCurrentlyVisible){
                effectsSubmenu.style.top = `${effectsButton.offsetTop + effectsButton.offsetHeight + 2}px`;
                effectsSubmenu.style.left = `${effectsButton.offsetLeft}px`;
            }
        };

        const bunchButtonElement = document.createElement('button'); bunchButtonElement.id = 'hermes-bunch-button';
        updateButtonAppearance(bunchButtonElement, 'bunchButton', isBunched);
        bunchButtonElement.onclick = async () => {
            closeAllSubmenus(); const newIsBunched = !isBunched;
            try {
                await saveDataToBackground(BUNCHED_STATE_KEY_EXT, newIsBunched); isBunched = newIsBunched;
                applyTheme();
            } catch (e) { console.error("Hermes CS: Failed to save bunch state", e); }
        }; uiContainer.appendChild(bunchButtonElement);

        const whitelistButtonElement = document.createElement('button'); whitelistButtonElement.id = 'hermes-whitelist-button';
        updateButtonAppearance(whitelistButtonElement, 'whitelistButton', isBunched);
        whitelistButtonElement.onclick = () => { closeAllSubmenus(); toggleWhitelistPanel(true); }; uiContainer.appendChild(whitelistButtonElement);

        helpButton = document.createElement('button'); helpButton.id = 'hermes-help-button';
        updateButtonAppearance(helpButton, 'helpButton', isBunched);
        helpButton.onclick = () => { closeAllSubmenus(); toggleHelpPanel(true); }; uiContainer.appendChild(helpButton);

        settingsButton = document.createElement('button'); settingsButton.id = 'hermes-settings-main-button';
        updateButtonAppearance(settingsButton, 'settingsButton', isBunched);
        settingsButton.onclick = () => { closeAllSubmenus(); toggleSettingsPanel(true); }; uiContainer.appendChild(settingsButton);

        const snapButtonsContainer = document.createElement('div'); snapButtonsContainer.id = 'hermes-snap-buttons-container';
        snapButtonsContainer.style.display = 'flex'; snapButtonsContainer.style.gap = isBunched ? '2px' : '3px';
        snapButtonsContainer.style.flexWrap = 'wrap';
        if (isBunched) { snapButtonsContainer.style.flexDirection = 'row'; snapButtonsContainer.style.justifyContent = 'center'; }
        const snapButtonsData = [
            { e: '↖', t: 'Snap Top-Left', cb: () => snapToEdge('top-left') }, { e: '↑', t: 'Snap Top', cb: () => snapToEdge('top') },
            { e: '↗', t: 'Snap Top-Right', cb: () => snapToEdge('top-right') }, { e: '←', t: 'Snap Left', cb: () => snapToEdge('left') },
            { e: '→', t: 'Snap Right', cb: () => snapToEdge('right') }, { e: '↙', t: 'Snap Bottom-Left', cb: () => snapToEdge('bottom-left') },
            { e: '↓', t: 'Snap Bottom', cb: () => snapToEdge('bottom') }, { e: '↘', t: 'Snap Bottom-Right', cb: () => snapToEdge('bottom-right') }
        ];
        snapButtonsData.forEach(data => {
            const btn = document.createElement('button'); btn.className = 'hermes-button'; btn.innerHTML = data.e; btn.title = data.t;
            btn.onclick = data.cb; snapButtonsContainer.appendChild(btn);
        });
        uiContainer.appendChild(snapButtonsContainer);

        statusIndicator = document.createElement('div'); statusIndicator.id = 'hermes-status';
        statusIndicator.textContent = 'Hermes Ready'; uiContainer.appendChild(statusIndicator);

        setupEffectsCanvas();
        setupDragging();

        document.addEventListener('click', (e) => {
            if (!shadowRoot) return;
            const path = e.composedPath();
            const clickedInsideShadowHost = path.includes(shadowHost);
            if (!clickedInsideShadowHost) { closeAllSubmenus(); return; }
            const isMacroButtonEl = path.includes(macroButton);
            const isThemeButtonEl = path.includes(themeButtonElement);
            const isEffectsButtonEl = path.includes(effectsButton);
            let clickedInsideSubmenuContent = false;
            for (const el of path) {
                if (el && el.classList && el.classList.contains('hermes-submenu')) {
                    clickedInsideSubmenuContent = true; break;
                }
            }
            if (!isMacroButtonEl && !isThemeButtonEl && !isEffectsButtonEl && !clickedInsideSubmenuContent) {
                closeAllSubmenus();
            }
        }, true);

        debugLogs.push({ timestamp: Date.now(), type: 'ui_setup_cs', target: 'main', details: { initialized: true } });
        console.log("Hermes CS: UI Setup Complete in shadow DOM.");
    }

    function setupAnalysisSnifferPlugin() {
        if(!uiContainer) { console.warn("Hermes CS: UI container not ready for sniffer plugin."); return; }

        const sniffButtonElement = document.createElement('button');
        sniffButtonElement.id = 'hermes-sniff-button';
        updateButtonAppearance(sniffButtonElement, 'sniffButton', isBunched);
        sniffButtonElement.onclick = () => {
            closeAllSubmenus();
            const forms = document.querySelectorAll('form');
            const formData = Array.from(forms).map((form, index) => {
                const fields = form.querySelectorAll('input, select, textarea');
                return {
                    formIndex: index, action: form.action || 'N/A', method: form.method || 'N/A',
                    fields: Array.from(fields).map(field => ({
                        tag: field.tagName, type: field.type || 'N/A', name: field.name || 'N/A',
                        id: field.id || 'N/A', label: getAssociatedLabelText(field) || 'N/A',
                        selector: getRobustSelector(field)
                    }))
                };
            });
            console.log('Hermes CS: Form Elements Sniffed:', formData);
            debugLogs.push({ timestamp: Date.now(), type: 'sniff_cs', target: 'forms', details: formData });
            if (statusIndicator) { statusIndicator.textContent = 'Elements Sniffed'; statusIndicator.style.color = 'var(--hermes-success-text)'; setTimeout(resetStatusIndicator, 2000); }
        };
        uiContainer.appendChild(sniffButtonElement);

        const importButtonElement = document.createElement('button');
        importButtonElement.id = 'hermes-import-button';
        updateButtonAppearance(importButtonElement, 'importButton', isBunched);
        importButtonElement.onclick = () => {
            closeAllSubmenus();
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json,application/json';
            input.onchange = async (e) => { // Made async for saveProfileData
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const jsonData = JSON.parse(event.target.result);
                        if (await saveProfileData(jsonData)) { // saveProfileData is async
                            if (statusIndicator) { statusIndicator.textContent = 'Profile Imported'; statusIndicator.style.color = 'var(--hermes-success-text)'; setTimeout(resetStatusIndicator, 2000); }
                        } else {
                            if (statusIndicator) { statusIndicator.textContent = 'Import Failed'; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
                        }
                    } catch (error) {
                        console.error('Hermes CS: Invalid JSON file for import:', error);
                        if (statusIndicator) { statusIndicator.textContent = 'Invalid JSON file'; statusIndicator.style.color = 'var(--hermes-error-text)'; setTimeout(resetStatusIndicator, 2000); }
                        alert("Error: Could not import profile. Invalid JSON file.\n" + error);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };
        uiContainer.appendChild(importButtonElement);
    }

    async function initialize() {
        console.log("Hermes CS: Initializing content script...");
        chrome.runtime.sendMessage({ type: "GET_HERMES_INITIAL_DATA" }, (initialStateResponse) => {
            if (chrome.runtime.lastError) {
                console.error("Hermes CS: CRITICAL - Error getting initial data:", chrome.runtime.lastError.message);
                profileData = {}; macros = {}; customMappings = {}; whitelist = [];
                currentSettings = JSON.parse(JSON.stringify(defaultSettings));
                theme = 'dark'; isBunched = false; effectsMode = 'none';
                showOverlays = true; learningMode = false; debugMode = false;
                state.position = { top: 10, left: 10 }; helpPanelOpenState = false;
                debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'initial_data_fetch_failed', details: { error: chrome.runtime.lastError.message } });
            } else if (initialStateResponse) {
                console.log("Hermes CS: Received initial data from background:", initialStateResponse);
                profileData = initialStateResponse.profile || {};
                macros = initialStateResponse.macros || {};
                customMappings = initialStateResponse.mappings || {};
                whitelist = initialStateResponse.whitelist || [];
                currentSettings = deepMerge(defaultSettings, initialStateResponse.settings || {});
                theme = initialStateResponse.theme || 'dark';
                isBunched = initialStateResponse.isBunched || false;
                effectsMode = initialStateResponse.effectsMode || 'none';
                showOverlays = initialStateResponse.showOverlays === undefined ? true : initialStateResponse.showOverlays;
                learningMode = initialStateResponse.learningMode || false;
                debugMode = initialStateResponse.debugMode || false;
                state.position = initialStateResponse.uiPosition || { top: 10, left: 10 };
                helpPanelOpenState = initialStateResponse.helpPanelOpen || false;
            } else {
                 console.error("Hermes CS: CRITICAL - Received no or invalid initial data from background. Using defaults.");
                profileData = {}; macros = {}; customMappings = {}; whitelist = [];
                currentSettings = JSON.parse(JSON.stringify(defaultSettings));
                theme = 'dark'; isBunched = false; effectsMode = 'none';
                showOverlays = true; learningMode = false; debugMode = false;
                state.position = { top: 10, left: 10 }; helpPanelOpenState = false;
                debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'initial_data_empty', details: {} });
            }

            const setupAction = () => {
                if (!document.body) {
                    requestAnimationFrame(setupAction); return;
                }
                setupUI();
                setupAnalysisSnifferPlugin();
                applyCurrentSettings();

                if (debugMode) {
                    HermesDebug.start();
                    setupDebugControls();
                }

                if (isWhitelisted()) {
                    toggleMinimizedUI(true);
                } else {
                    toggleMinimizedUI(false);
                    if (showOverlays) applyVisualOverlays();
                    startMutationObserver();
                }

                if (helpPanelOpenState) {
                    toggleHelpPanel(true);
                }
                console.log("Hermes CS: Full initialization complete.");
            };

            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setupAction();
            } else {
                document.addEventListener('DOMContentLoaded', setupAction, {once: true});
            }
        });
    }

    initialize();

})();
