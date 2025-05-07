// ==UserScript==
// @name         Hermes System
// @namespace    http://tampermonkey.net/
// @version      2.9.7
// @description  Advanced form filler, macro recorder, and heuristic trainer with draggable UI, theme toggle, and whitelist support.
// @author       YourName
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // === SECTION BREAK ===
    // Part 1/4: Header, Constants, and State Variables
    // Copy this part into Tampermonkey, then proceed to Part 2.

    // =================== Constants & Keys ===================
    const PROFILE_KEY = 'hermes_profile';
    const MACRO_KEY = 'hermes_macros';
    const MAPPING_KEY = 'hermes_mappings';
    const OVERLAY_STATE_KEY = 'hermes_overlay_state';
    const LEARNING_STATE_KEY = 'hermes_learning_state';
    const DEBUG_MODE_KEY = 'hermes_debug_mode';
    const POSITION_KEY = 'hermes_position';
    const WHITELIST_KEY = 'hermes_whitelist';
    const THEME_KEY = 'hermes_theme';

    // =================== State Variables ===================
    let showOverlays = GM_getValue(OVERLAY_STATE_KEY, true);
    let learningMode = GM_getValue(LEARNING_STATE_KEY, false);
    let debugMode = GM_getValue(DEBUG_MODE_KEY, false);
    let uiContainer = null;
    let shadowRoot = null;
    let fillButton = null;
    let editProfileButton = null;
    let recordButton = null;
    let stopSaveButton = null;
    let macroListDropdown = null;
    let playMacroButton = null;
    let deleteMacroButton = null;
    let viewLogButton = null;
    let trainButton = null;
    let overlayToggle = null;
    let learningToggle = null;
    let debugToggle = null;
    let statusIndicator = null;
    let isRecording = false;
    let recordedEvents = [];
    let currentMacroName = '';
    let debugLogs = [];
    let profileData = {};
    let macros = {};
    let customMappings = {};
    let skippedFields = [];
    let isMinimized = false;
    let minimizedContainer = null;
    let theme = GM_getValue(THEME_KEY, 'light');
    const themeOptions = {
        light: { name: 'Light', emoji: '☀️' },
        dark: { name: 'Dark', emoji: '🌙' },
        phoenix: { name: 'Phoenix', emoji: '🦅' },
        seaGreen: { name: 'Sea Green', emoji: '🐢' },
        auroraGlow: { name: 'Aurora Glow', emoji: '🌠' },
        crimsonEmber: { name: 'Crimson Ember', emoji: '🔥' },
        slateStorm: { name: 'Slate Storm', emoji: '⛈️' }
    };
    let justDragged = false;
    let dragging = false;
    let offset = { x: 0, y: 0 };
    const state = {
        position: JSON.parse(GM_getValue(POSITION_KEY, '{"top": null, "left": null}'))
    };

    // === SECTION BREAK ===
    // Part 2/4: Debug Utility and Helper Functions
    // Paste this after Part 1 in Tampermonkey, then proceed to Part 3.

    // =================== Debug Utility ===================
    const HermesDebug = {
        start() {
            console.log('Hermes: Starting debug mode');
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((node) => {
                        let retryCount = 0;
                        const maxRetries = 3;
                        if (node.id === 'hermes-shadow-host' || node.contains(shadowRoot)) {
                            debugLogs.push({
                                timestamp: Date.now(),
                                type: 'mutation',
                                target: 'shadow_host',
                                details: { removed: 'Hermes UI removed' }
                            });
                            console.warn('Hermes: UI removed from DOM, attempting reinjection...');
                            if (retryCount < maxRetries) {
                                setTimeout(setupUI, 500);
                                retryCount++;
                            } else {
                                console.error('Hermes: Max reinjection attempts reached');
                            }
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
            console.log('Hermes: Debug observer started');
        },
        logs() {
            return debugLogs;
        },
        clearLogs() {
            debugLogs = [];
            console.log('Hermes: Debug logs cleared');
        }
    };

    window.HermesDebug = HermesDebug;

    // =================== DevTools Debug Controls ===================
    function setupDebugControls() {
        console.log('Hermes: Setting up debug controls');
        window.hermesDebug = {
            toggleOverlay: () => {
                showOverlays = !showOverlays;
                GM_setValue(OVERLAY_STATE_KEY, showOverlays);
                if (showOverlays) {
                    applyVisualOverlays();
                } else {
                    removeVisualOverlays();
                }
                console.log('Hermes: Overlays toggled:', showOverlays);
            },
            toggleLearning: () => {
                learningMode = !learningMode;
                GM_setValue(LEARNING_STATE_KEY, learningMode);
                console.log('Hermes: Learning mode toggled:', learningMode);
            },
            clearLogs: () => {
                HermesDebug.clearLogs();
            },
            getLogs: () => {
                return HermesDebug.logs();
            }
        };
    }

    function detectDevTools() {
        const threshold = 160;
        const devToolsOpen = window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold;
        if (devToolsOpen && debugMode) {
            console.log('Hermes: DevTools detected, enabling debug controls');
            setupDebugControls();
        }
    }

    window.addEventListener('resize', detectDevTools);
    document.addEventListener('DOMContentLoaded', detectDevTools);

    // =================== Utility Functions ===================
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
            if (label) return label.textContent.trim();
            parent = parent.parentElement;
        }
        return '';
    }

    function getRobustSelector(element) {
        if (element.id) return `#${element.id}`;
        const path = [];
        let current = element;
        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();
            const siblings = Array.from(current.parentElement.children).filter(c => c.tagName === current.tagName);
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-child(${index})`;
            }
            path.unshift(selector);
            current = current.parentElement;
        }
        return path.join(' > ');
    }

    // === SECTION BREAK ===
    // Part 3/4: Core Logic (Form Filler, Macros, Overlays, Trainer)
    // Paste this after Part 2 in Tampermonkey, then proceed to Part 4.

    // =================== Data Loading/Saving ===================
    function loadProfileData() {
        try {
            const profileJson = GM_getValue(PROFILE_KEY, '{}');
            profileData = JSON.parse(profileJson);
            console.log('Hermes: Profile loaded:', profileData);
        } catch (error) {
            console.error('Hermes: Error loading profile:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'profile_load', details: { error: error.message } });
            profileData = {};
        }
        return profileData;
    }

    function saveProfileData(profileData) {
        try {
            GM_setValue(PROFILE_KEY, JSON.stringify(profileData));
            console.log('Hermes: Profile saved:', profileData);
            return true;
        } catch (error) {
            console.error('Hermes: Error saving profile:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'profile_save', details: { error: error.message } });
            return false;
        }
    }

    function loadMacros() {
        try {
            const macrosJson = GM_getValue(MACRO_KEY, '{}');
            macros = JSON.parse(macrosJson);
            console.log('Hermes: Macros loaded:', macros);
        } catch (error) {
            console.error('Hermes: Error loading macros:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'macros_load', details: { error: error.message } });
            macros = {};
        }
        return macros;
    }

    function saveMacros(macros) {
        try {
            GM_setValue(MACRO_KEY, JSON.stringify(macros));
            console.log('Hermes: Macros saved:', macros);
            return true;
        } catch (error) {
            console.error('Hermes: Error saving macros:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'macros_save', details: { error: error.message } });
            return false;
        }
    }

    function loadCustomMappings() {
        try {
            const mappingsJson = GM_getValue(MAPPING_KEY, '{}');
            customMappings = JSON.parse(mappingsJson);
            console.log('Hermes: Mappings loaded:', customMappings);
        } catch (error) {
            console.error('Hermes: Error loading mappings:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'mappings_load', details: { error: error.message } });
            customMappings = {};
        }
        return customMappings;
    }

    function saveCustomMappings(mappings) {
        try {
            GM_setValue(MAPPING_KEY, JSON.stringify(mappings));
            console.log('Hermes: Mappings saved:', mappings);
            return true;
        } catch (error) {
            console.error('Hermes: Error saving mappings:', error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'mappings_save', details: { error: error.message } });
            return false;
        }
    }

    function loadWhitelist() {
        try {
            const whitelistJson = GM_getValue(WHITELIST_KEY, '[]');
            return JSON.parse(whitelistJson);
        } catch (error) {
            console.error("Hermes: Error loading whitelist:", error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'whitelist_load', details: { error: error.message } });
            return [];
        }
    }

    function saveWhitelist(whitelist) {
        try {
            GM_setValue(WHITELIST_KEY, JSON.stringify(whitelist));
            console.log("Hermes: Whitelist saved:", whitelist);
            return true;
        } catch (error) {
            console.error("Hermes: Error saving whitelist:", error);
            debugLogs.push({ timestamp: Date.now(), type: 'error', target: 'whitelist_save', details: { error: error.message } });
            return false;
        }
    }

    function isWhitelisted() {
        const whitelist = loadWhitelist();
        const hostname = window.location.hostname.toLowerCase();
        return whitelist.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    }

    // =================== Core Logic ===================
    function matchProfileKey(context, fieldType, field) {
        let bestKey = null;
        let bestScore = 0;
        const labelText = getAssociatedLabelText(field).toLowerCase();
        const tokens = labelText.split(/\s+/).filter(t => !isStopWord(t));
        for (const key in profileData) {
            const profileTokens = key.toLowerCase().split(/\s+/);
            let score = 0;
            tokens.forEach(t => {
                profileTokens.forEach(pt => {
                    score += tokenSimilarity(t, pt);
                });
            });
            score /= Math.max(tokens.length, profileTokens.length) || 1;
            if (score > bestScore && score > 0.6) {
                bestScore = score;
                bestKey = key;
            }
        }
        if (customMappings[context] && customMappings[context][field.name || field.id]) {
            bestKey = customMappings[context][field.name || field.id];
            bestScore = 1;
        }
        if (learningMode && bestScore < 0.8) {
            skippedFields.push({ field, context, label: labelText });
        }
        return bestKey;
    }

    function runFormFiller(profileData = {}) {
        const context = window.location.hostname;
        const forms = document.querySelectorAll('form');
        let filledCount = 0;
        forms.forEach((form, formIndex) => {
            const fields = form.querySelectorAll('input, select, textarea');
            fields.forEach((field) => {
                const fieldType = field.type || 'text';
                if (['button', 'submit', 'reset', 'hidden'].includes(fieldType)) return;
                const profileKey = matchProfileKey(context, fieldType, field);
                if (profileKey && profileData[profileKey]) {
                    if (fieldType === 'checkbox' || fieldType === 'radio') {
                        field.checked = profileData[profileKey] === field.value;
                    } else {
                        field.value = profileData[profileKey];
                    }
                    dispatchEvents(field);
                    filledCount++;
                    if (showOverlays) {
                        field.style.border = '2px solid green';
                        setTimeout(() => { field.style.border = ''; }, 2000);
                    }
                    debugLogs.push({
                        timestamp: Date.now(),
                        type: 'fill',
                        target: getRobustSelector(field),
                        details: { profileKey, value: profileData[profileKey] }
                    });
                }
            });
        });
        if (statusIndicator) {
            statusIndicator.textContent = `Filled ${filledCount} fields`;
            statusIndicator.style.color = filledCount > 0 ? 'green' : 'orange';
            setTimeout(() => resetStatusIndicator(), 2000);
        }
        console.log(`Hermes: Filled ${filledCount} fields`);
        if (learningMode && skippedFields.length > 0) {
            console.log('Hermes: Skipped fields for training:', skippedFields);
        }
    }

    // =================== Macro Engine ===================
    function recordEvent(e) {
        if (!isRecording) return;
        const selector = getRobustSelector(e.target);
        const eventDetails = {
            type: e.type,
            selector: selector,
            value: e.target.value || null,
            timestamp: Date.now(),
            key: e.key || null,
            button: e.button || null,
            x: e.clientX || null,
            y: e.clientY || null
        };
        recordedEvents.push(eventDetails);
        debugLogs.push({
            timestamp: Date.now(),
            type: 'record',
            target: selector,
            details: eventDetails
        });
        console.log('Hermes: Recorded event:', eventDetails);
    }

    function startRecording() {
        isRecording = true;
        recordedEvents = [];
        currentMacroName = prompt('Enter macro name:') || `macro_${Date.now()}`;
        document.addEventListener('click', recordEvent, true);
        document.addEventListener('input', recordEvent, true);
        document.addEventListener('change', recordEvent, true);
        if (statusIndicator) {
            statusIndicator.textContent = `Recording: ${currentMacroName}`;
            statusIndicator.style.color = 'red';
        }
        console.log('Hermes: Recording started:', currentMacroName);
    }

    function stopRecording() {
        isRecording = false;
        document.removeEventListener('click', recordEvent, true);
        document.removeEventListener('input', recordEvent, true);
        document.removeEventListener('change', recordEvent, true);
        if (currentMacroName && recordedEvents.length > 0) {
            macros[currentMacroName] = recordedEvents;
            saveMacros(macros);
            updateMacroDropdown();
            if (statusIndicator) {
                statusIndicator.textContent = `Saved macro: ${currentMacroName}`;
                statusIndicator.style.color = 'green';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
        } else {
            if (statusIndicator) {
                statusIndicator.textContent = 'No events recorded';
                statusIndicator.style.color = 'orange';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
        }
        console.log('Hermes: Recording stopped:', currentMacroName);
    }

    function playMacro(macroName) {
        const macro = macros[macroName];
        if (!macro) {
            console.error('Hermes: Macro not found:', macroName);
            if (statusIndicator) {
                statusIndicator.textContent = `Macro ${macroName} not found`;
                statusIndicator.style.color = 'red';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
            return;
        }
        let index = 0;
        function executeEvent() {
            if (index >= macro.length) {
                if (statusIndicator) {
                    statusIndicator.textContent = `Macro ${macroName} finished`;
                    statusIndicator.style.color = 'green';
                    setTimeout(() => resetStatusIndicator(), 2000);
                }
                console.log('Hermes: Macro playback finished:', macroName);
                return;
            }
            const event = macro[index];
            const element = document.querySelector(event.selector);
            if (!element) {
                console.warn('Hermes: Element not found for selector:', event.selector);
                debugLogs.push({
                    timestamp: Date.now(),
                    type: 'playback_error',
                    target: event.selector,
                    details: { event }
                });
                index++;
                setTimeout(executeEvent, 100);
                return;
            }
            try {
                if (event.type === 'click') {
                    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: event.x, clientY: event.y }));
                } else if (event.type === 'input' || event.type === 'change') {
                    element.value = event.value || '';
                    dispatchEvents(element);
                }
                debugLogs.push({
                    timestamp: Date.now(),
                    type: 'playback',
                    target: event.selector,
                    details: { event }
                });
                index++;
                setTimeout(executeEvent, 500);
            } catch (error) {
                console.error('Hermes: Error playing event:', error);
                debugLogs.push({
                    timestamp: Date.now(),
                    type: 'playback_error',
                    target: event.selector,
                    details: { error: error.message }
                });
                index++;
                setTimeout(executeEvent, 100);
            }
        }
        if (statusIndicator) {
            statusIndicator.textContent = `Playing: ${macroName}`;
            statusIndicator.style.color = 'blue';
        }
        console.log('Hermes: Starting macro playback:', macroName);
        executeEvent();
    }

    function deleteMacro(macroName) {
        if (macros[macroName]) {
            delete macros[macroName];
            saveMacros(macros);
            updateMacroDropdown();
            if (statusIndicator) {
                statusIndicator.textContent = `Deleted macro: ${macroName}`;
                statusIndicator.style.color = 'orange';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
            console.log('Hermes: Macro deleted:', macroName);
        }
    }

    // =================== Visual Overlays ===================
    function removeVisualOverlays() {
        document.querySelectorAll('[data-hermes-overlay]').forEach((el) => {
            el.style.border = '';
            el.removeAttribute('data-hermes-overlay');
        });
        console.log('Hermes: Visual overlays removed');
    }

    function applyVisualOverlays() {
        if (!showOverlays) return;
        const fields = document.querySelectorAll('input, select, textarea');
        fields.forEach((field) => {
            if (['button', 'submit', 'reset', 'hidden'].includes(field.type)) return;
            field.style.border = '2px solid blue';
            field.setAttribute('data-hermes-overlay', 'true');
        });
        console.log('Hermes: Visual overlays applied');
    }

    // =================== Dynamic DOM Handling ===================
    let observer;
    function startMutationObserver() {
        observer = new MutationObserver((mutations) => {
            let formsChanged = false;
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && (node.tagName === 'FORM' || node.querySelector('form'))) {
                            formsChanged = true;
                        }
                    });
                }
            });
            if (formsChanged) {
                console.log('Hermes: Form changes detected, reapplying overlays and filling');
                removeVisualOverlays();
                applyVisualOverlays();
                runFormFiller(profileData);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('Hermes: Mutation observer started');
    }

    function stopMutationObserver() {
        if (observer) {
            observer.disconnect();
            console.log('Hermes: Mutation observer stopped');
        }
    }

    // =================== Heuristic Trainer Engine ===================
    function analyzeSkippedFields() {
        const tokenMap = {};
        skippedFields.forEach(({ field, context, label }) => {
            const tokens = label.toLowerCase().split(/\s+/).filter(t => !isStopWord(t));
            tokens.forEach(token => {
                tokenMap[token] = tokenMap[token] || [];
                tokenMap[token].push({ field, context, label });
            });
        });
        return tokenMap;
    }

    function generateMappingSuggestions(tokenMap) {
        const suggestions = {};
        for (const token in tokenMap) {
            const fields = tokenMap[token];
            fields.forEach(({ field, context, label }) => {
                let bestKey = null;
                let bestScore = 0;
                for (const key in profileData) {
                    const score = tokenSimilarity(token, key.toLowerCase());
                    if (score > bestScore && score > 0.6) {
                        bestScore = score;
                        bestKey = key;
                    }
                }
                if (bestKey) {
                    suggestions[context] = suggestions[context] || {};
                    suggestions[context][field.name || field.id] = bestKey;
                }
            });
        };
        return suggestions;
    }

    function runHeuristicTrainerSession() {
        if (!skippedFields.length) {
            console.log('Hermes: No skipped fields to train on');
            if (statusIndicator) {
                statusIndicator.textContent = 'No skipped fields';
                statusIndicator.style.color = 'orange';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
            return;
        }
        const tokenMap = analyzeSkippedFields();
        const suggestions = generateMappingSuggestions(tokenMap);
        if (Object.keys(suggestions).length > 0) {
            Object.assign(customMappings, suggestions);
            saveCustomMappings(customMappings);
            console.log('Hermes: New mappings generated:', suggestions);
            if (statusIndicator) {
                statusIndicator.textContent = 'Mappings updated';
                statusIndicator.style.color = 'green';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
            skippedFields = [];
            runFormFiller(profileData);
        } else {
            console.log('Hermes: No new mappings generated');
            if (statusIndicator) {
                statusIndicator.textContent = 'No new mappings';
                statusIndicator.style.color = 'orange';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
        }
    }

    // === SECTION BREAK ===
    // Part 4/4: UI Setup and Initialization
    // Paste this after Part 3 in Tampermonkey, then save (Ctrl+S).

    // =================== UI Creation & Handlers ===================
    function resetStatusIndicator() {
        if (statusIndicator) {
            statusIndicator.textContent = 'Ready';
            statusIndicator.style.color = '#555';
        }
    }

    // --- Profile Editor ---
    function loadProfileDataHandler() {
        const profile = loadProfileData();
        const editor = shadowRoot.querySelector('#hermes-profile-editor');
        const textarea = editor.querySelector('textarea');
        textarea.value = JSON.stringify(profile, null, 2);
    }

    function saveProfileDataHandler() {
        const editor = shadowRoot.querySelector('#hermes-profile-editor');
        const textarea = editor.querySelector('textarea');
        try {
            const newProfile = JSON.parse(textarea.value);
            if (saveProfileData(newProfile)) {
                profileData = newProfile;
                if (statusIndicator) {
                    statusIndicator.textContent = 'Profile saved';
                    statusIndicator.style.color = 'green';
                    setTimeout(() => resetStatusIndicator(), 2000);
                }
            } else {
                if (statusIndicator) {
                    statusIndicator.textContent = 'Failed to save profile';
                    statusIndicator.style.color = 'red';
                    setTimeout(() => resetStatusIndicator(), 2000);
                }
            }
        } catch (error) {
            console.error('Hermes: Invalid profile JSON:', error);
            if (statusIndicator) {
                statusIndicator.textContent = 'Invalid JSON';
                statusIndicator.style.color = 'red';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
        }
    }

    function createProfileEditor() {
        if (shadowRoot.querySelector('#hermes-profile-editor')) return;
        const editor = document.createElement('div');
        editor.id = 'hermes-profile-editor';
        editor.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 100001;
            font-family: sans-serif;
            color: var(--text-color);
        `;
        editor.innerHTML = `
            <h2 style="margin-top: 0; margin-bottom: 15px; text-align: center;">Edit Profile Data</h2>
            <textarea style="width: 100%; height: 50vh; resize: vertical; font-family: monospace; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;"></textarea>
            <div style="margin-top: 10px; text-align: right;">
                <button id="hermes-profile-save" style="padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; background: #5cb85c; color: white; margin-right: 10px;">Save</button>
                <button id="hermes-profile-cancel" style="padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; background: #ccc;">Cancel</button>
            </div>
        `;
        shadowRoot.appendChild(editor);
        loadProfileDataHandler();
        shadowRoot.querySelector('#hermes-profile-save').onclick = saveProfileDataHandler;
        shadowRoot.querySelector('#hermes-profile-cancel').onclick = () => {
            editor.style.display = 'none';
        };
    }

    function toggleProfileEditor(show) {
        if (!shadowRoot.querySelector('#hermes-profile-editor')) {
            createProfileEditor();
        }
        const editor = shadowRoot.querySelector('#hermes-profile-editor');
        if (show) {
            loadProfileDataHandler();
            editor.style.display = 'block';
        } else {
            editor.style.display = 'none';
        }
    }

    // --- Log Viewer ---
    function createLogViewerPanel() {
        if (shadowRoot.querySelector('#hermes-log-viewer')) return;
        const logViewer = document.createElement('div');
        logViewer.id = 'hermes-log-viewer';
        logViewer.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 100001;
            font-family: sans-serif;
            color: var(--text-color);
        `;
        logViewer.innerHTML = `
            <h2 style="margin-top: 0; margin-bottom: 15px; text-align: center;">Debug Logs</h2>
            <table id="hermes-log-table" style="width: 100%; border-collapse: collapse; background: var(--table-bg);">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <th style="padding: 8px; text-align: left;">Timestamp</th>
                        <th style="padding: 8px; text-align: left;">Type</th>
                        <th style="padding: 8px; text-align: left;">Target</th>
                        <th style="padding: 8px; text-align: left;">Details</th>
                    </tr>
                </thead>
                <tbody id="hermes-log-body"></tbody>
            </table>
            <div style="margin-top: 10px; text-align: right;">
                <button id="hermes-log-clear" style="padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; background: #d9534f; color: white; margin-right: 10px;">Clear Logs</button>
                <button id="hermes-log-close" style="padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; background: #ccc;">Close</button>
            </div>
        `;
        shadowRoot.appendChild(logViewer);
        shadowRoot.querySelector('#hermes-log-clear').onclick = () => {
            HermesDebug.clearLogs();
            populateLogViewer();
            if (statusIndicator) {
                statusIndicator.textContent = 'Logs cleared';
                statusIndicator.style.color = 'orange';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
        };
        shadowRoot.querySelector('#hermes-log-close').onclick = () => {
            logViewer.style.display = 'none';
        };
    }

    function populateLogViewer() {
        const logBody = shadowRoot.querySelector('#hermes-log-body');
        if (!logBody) return;
        logBody.innerHTML = '';
        const logs = HermesDebug.logs();
        logs.forEach((log) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">${new Date(log.timestamp).toLocaleTimeString()}</td>
                <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">${log.type}</td>
                <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">${log.target}</td>
                <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">${JSON.stringify(log.details, null, 2)}</td>
            `;
            logBody.appendChild(row);
        });
    }

    function toggleLogViewer(show) {
        if (!shadowRoot.querySelector('#hermes-log-viewer')) {
            createLogViewerPanel();
        }
        const logViewer = shadowRoot.querySelector('#hermes-log-viewer');
        if (show) {
            populateLogViewer();
            logViewer.style.display = 'block';
        } else {
            logViewer.style.display = 'none';
        }
    }

    // --- Trainer Panel ---
    function createTrainerPanel() {
        if (shadowRoot.querySelector('#hermes-trainer-panel')) return;
        const trainerPanel = document.createElement('div');
        trainerPanel.id = 'hermes-trainer-panel';
        trainerPanel.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 100001;
            font-family: sans-serif;
            color: var(--text-color);
        `;
        trainerPanel.innerHTML = `
            <h2 style="margin-top: 0; margin-bottom: 15px; text-align: center;">Heuristic Trainer</h2>
            <p style="margin-bottom: 10px;">Skipped fields: <span id="hermes-skipped-count">${skippedFields.length}</span></p>
            <div id="hermes-skipped-list" style="max-height: 40vh; overflow-y: auto; border: 1px solid var(--border-color); padding: 10px; margin-bottom: 10px;"></div>
            <div style="text-align: right;">
                <button id="hermes-trainer-run" style="padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; background: #5cb85c; color: white; margin-right: 10px;">Run Trainer</button>
                <button id="hermes-trainer-close" style="padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; background: #ccc;">Close</button>
            </div>
        `;
        shadowRoot.appendChild(trainerPanel);
        shadowRoot.querySelector('#hermes-trainer-run').onclick = () => {
            runHeuristicTrainerSession();
            populateTrainerPanel();
        };
        shadowRoot.querySelector('#hermes-trainer-close').onclick = () => {
            trainerPanel.style.display = 'none';
        };
    }

    function populateTrainerPanel() {
        const list = shadowRoot.querySelector('#hermes-skipped-list');
        const count = shadowRoot.querySelector('#hermes-skipped-count');
        if (!list || !count) return;
        count.textContent = skippedFields.length;
        list.innerHTML = skippedFields.length ? '' : '<p style="text-align: center;">No skipped fields.</p>';
        skippedFields.forEach((field, index) => {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 5px; border-bottom: 1px solid var(--border-color);';
            item.textContent = `Field: ${field.label || field.field.name || field.field.id || 'Unknown'} (Context: ${field.context})`;
            list.appendChild(item);
        });
    }

    function toggleTrainerPanel(show) {
        if (!shadowRoot.querySelector('#hermes-trainer-panel')) {
            createTrainerPanel();
        }
        const trainerPanel = shadowRoot.querySelector('#hermes-trainer-panel');
        if (show) {
            populateTrainerPanel();
            trainerPanel.style.display = 'block';
        } else {
            trainerPanel.style.display = 'none';
        }
    }

    // --- Whitelist Panel ---
    function createWhitelistPanel() {
        if (shadowRoot.querySelector('#hermes-whitelist-panel')) return;
        const whitelistPanel = document.createElement('div');
        whitelistPanel.id = 'hermes-whitelist-panel';
        whitelistPanel.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 400px;
            max-height: 80vh;
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 100001;
            font-family: sans-serif;
            color: var(--text-color);
        `;
        whitelistPanel.innerHTML = `
            <h2 style="margin-top: 0; margin-bottom: 15px; text-align: center;">Manage Whitelist</h2>
            <p style="margin-bottom: 10px; font-size: 13px; text-align: center;">Add or remove domains where Hermes minimizes to an emoji.</p>
            <div id="hermes-whitelist-list" style="max-height: 40vh; overflow-y: auto; border: 1px solid var(--border-color); padding: 10px; margin-bottom: 10px;"></div>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input id="hermes-whitelist-input" type="text" placeholder="e.g., x.com" style="flex-grow: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px;">
                <button id="hermes-whitelist-add" style="padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; background: #5cb85c; color: white;">Add</button>
            </div>
            <div style="text-align: right;">
                <button id="hermes-whitelist-close" style="padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; background: #ccc;">Close</button>
            </div>
        `;
        shadowRoot.appendChild(whitelistPanel);
        shadowRoot.querySelector('#hermes-whitelist-add').onclick = () => {
            const input = shadowRoot.querySelector('#hermes-whitelist-input');
            const domain = input.value.trim().toLowerCase();
            if (!/^[a-z0-9-]+\.[a-z]{2,}$/.test(domain)) {
                alert('Invalid domain format (e.g., x.com)');
                return;
            }
            const whitelist = loadWhitelist();
            if (!whitelist.includes(domain)) {
                whitelist.push(domain);
                if (saveWhitelist(whitelist)) {
                    input.value = '';
                    populateWhitelistPanel();
                    statusIndicator.textContent = `Added ${domain} to whitelist`;
                    statusIndicator.style.color = 'green';
                    setTimeout(() => resetStatusIndicator(), 2000);
                } else {
                    alert('Failed to save whitelist');
                }
            }
        };
        shadowRoot.querySelector('#hermes-whitelist-close').onclick = () => toggleWhitelistPanel(false);
    }

    function toggleWhitelistPanel(show) {
        if (!shadowRoot.querySelector('#hermes-whitelist-panel')) createWhitelistPanel();
        const panel = shadowRoot.querySelector('#hermes-whitelist-panel');
        if (show) {
            populateWhitelistPanel();
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }

    function populateWhitelistPanel() {
        const list = shadowRoot.querySelector('#hermes-whitelist-list');
        if (!list) return;
        const whitelist = loadWhitelist();
        list.innerHTML = whitelist.length ? '' : '<p style="text-align: center; padding: 10px;">No domains whitelisted.</p>';
        whitelist.forEach((domain, index) => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid var(--border-color);';
            item.innerHTML = `
                <span>${domain}</span>
                <button data-index="${index}" style="padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; background: #d9534f; color: white;">Remove</button>
            `;
            item.querySelector('button').onclick = () => {
                const whitelist = loadWhitelist();
                whitelist.splice(index, 1);
                if (saveWhitelist(whitelist)) {
                    populateWhitelistPanel();
                    statusIndicator.textContent = `Removed ${domain} from whitelist`;
                    statusIndicator.style.color = 'orange';
                    setTimeout(() => resetStatusIndicator(), 2000);
                } else {
                    alert('Failed to save whitelist');
                }
            };
            list.appendChild(item);
        });
    }

    // --- Macro UI Helpers ---
    function updateMacroDropdown() {
        if (!macroListDropdown) return;
        macroListDropdown.innerHTML = '<option value="">Select Macro</option>';
        Object.keys(macros).forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            macroListDropdown.appendChild(option);
        });
    }

    // --- Theme ---
    function applyTheme() {
        const styleSheet = shadowRoot.querySelector('#hermes-styles') || document.createElement('style');
        styleSheet.id = 'hermes-styles';
        styleSheet.textContent = `
            :host {
                --text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                ${
                    theme === 'light' ? `
                        --background: #f0f0f0;
                        --text-color: #333;
                        --border-color: #999;
                        --panel-bg: #f9f9f9;
                        --table-bg: #fff;
                        --button-bg: #e9e9e9;
                        --button-hover: #dcdcdc;
                        --bar-bg: #f0f0f0;
                    ` : theme === 'dark' ? `
                        --background: #2c2c2c;
                        --text-color: #e0e0e0;
                        --border-color: #555;
                        --panel-bg: #333;
                        --table-bg: #444;
                        --button-bg: #555;
                        --button-hover: #666;
                        --bar-bg: #2c2c2c;
                    ` : theme === 'phoenix' ? `
                        --background: #fff3e0;
                        --text-color: #000;
                        --border-color: #0288d1;
                        --panel-bg: #e1f5fe;
                        --table-bg: #fff;
                        --button-bg: #0288d1;
                        --button-hover: #0277bd;
                        --bar-bg: #b3e5fc;
                    ` : theme === 'seaGreen' ? `
                        --background: #26a69a;
                        --text-color: #000;
                        --border-color: #00796b;
                        --panel-bg: #b2dfdb;
                        --table-bg: #fff;
                        --button-bg: #00897b;
                        --button-hover: #00796b;
                        --bar-bg: #80cbc4;
                    ` : theme === 'auroraGlow' ? `
                        --background: #00695c;
                        --text-color: #ffffff;
                        --border-color: #0288d1;
                        --panel-bg: #4db6ac;
                        --table-bg: #fff;
                        --button-bg: #0288d1;
                        --button-hover: #0277bd;
                        --bar-bg: #ab47bc;
                    ` : theme === 'crimsonEmber' ? `
                        --background: #b71c1c;
                        --text-color: #000000;
                        --border-color: #0288d1;
                        --panel-bg: #ffcdd2;
                        --table-bg: #fff;
                        --button-bg: #d32f2f;
                        --button-hover: #c62828;
                        --bar-bg: #ff5722;
                    ` : theme === 'slateStorm' ? `
                        --background: #455a64;
                        --text-color: #eceff1;
                        --border-color: #0288d1;
                        --panel-bg: #b0bec5;
                        --table-bg: #fff;
                        --button-bg: #546e7a;
                        --button-hover: #455a64;
                        --bar-bg: #0288d1;
                    ` : ''
                }
            }
            #hermes-ui-container, #hermes-minimized-container {
                background: var(--background);
                border-color: var(--border-color);
                color: var(--text-color);
                text-shadow: var(--text-shadow);
            }
            #hermes-ui-container::before {
                content: '';
                display: block;
                height: 4px;
                background: var(--bar-bg);
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                border-radius: 6px 6px 0 0;
            }
            #hermes-profile-editor, #hermes-log-viewer, #hermes-trainer-panel, #hermes-whitelist-panel {
                background: var(--panel-bg);
                color: var(--text-color);
                border-color: var(--border-color);
                text-shadow: var(--text-shadow);
            }
            #hermes-log-table {
                background: var(--table-bg);
            }
            button, select {
                background: var(--button-bg);
                color: var(--text-color);
                border-color: var(--border-color);
                border-radius: 4px;
                text-shadow: var(--text-shadow);
            }
            button:hover {
                background: var(--button-hover);
            }
            #hermes-theme-submenu {
                display: none;
                position: absolute;
                bottom: 100%;
                right: 0;
                background: var(--panel-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                padding: 5px;
                z-index: 1000000;
                flex-direction: column;
                gap: 5px;
            }
            #hermes-theme-submenu button {
                padding: 5px 10px;
                width: 100%;
                text-align: left;
                font-size: 11px;
                cursor: pointer;
                background: var(--button-bg);
                border: none;
                border-radius: 4px;
                color: var(--text-color);
                text-shadow: var(--text-shadow);
            }
            #hermes-theme-submenu button:hover {
                background: var(--button-hover);
            }
        `;
        if (!shadowRoot.querySelector('#hermes-styles')) {
            shadowRoot.appendChild(styleSheet);
        }
    }

    // --- Theme Toggle and Submenu ---
    function createThemeSubmenu() {
        const submenu = document.createElement('div');
        submenu.id = 'hermes-theme-submenu';
        Object.entries(themeOptions).forEach(([key, { name, emoji }]) => {
            const button = document.createElement('button');
            button.textContent = `${emoji} ${name}`;
            button.onclick = () => {
                theme = key;
                GM_setValue(THEME_KEY, theme);
                applyTheme();
                submenu.style.display = 'none';
                statusIndicator.textContent = `Theme: ${name}`;
                statusIndicator.style.color = 'green';
                setTimeout(() => resetStatusIndicator(), 2000);
                debugLogs.push({ timestamp: Date.now(), type: 'toggle', target: 'theme', details: { state: theme } });
            };
            submenu.appendChild(button);
        });
        return submenu;
    }

    const themeToggle = document.createElement('button');
    themeToggle.id = 'hermes-toggle-theme';
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    themeToggle.textContent = `${themeOptions[theme].emoji} Theme`;
    themeToggle.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap; position: relative;';
    themeToggle.onmouseover = () => themeToggle.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
    themeToggle.onmouseout = () => themeToggle.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
    themeToggle.onclick = () => {
        if (justDragged) return;
        const submenu = shadowRoot.querySelector('#hermes-theme-submenu');
        if (submenu.style.display === 'block') {
            submenu.style.display = 'none';
        } else {
            submenu.style.display = 'block';
        }
    };

    // --- Main UI Setup ---
    function setupUI() {
        if (shadowRoot.querySelector('#hermes-ui-container') || shadowRoot.querySelector('#hermes-minimized-container')) {
            return;
        }

        // Create UI container
        uiContainer = document.createElement('div');
        uiContainer.id = 'hermes-ui-container';
        uiContainer.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: var(--background, #f0f0f0);
            border: 1px solid var(--border-color, #999);
            padding: 8px;
            border-radius: 6px;
            font-family: sans-serif;
            font-size: 12px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            align-items: center;
            max-width: 95vw;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            cursor: default;
            user-select: none;
            z-index: 999999;
        `;

        // Create drag handle
        const dragHandle = document.createElement('div');
        dragHandle.style.cssText = `
            width: 20px;
            height: 20px;
            background: var(--button-bg, #ccc);
            border-radius: 4px;
            margin-right: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
        `;
        dragHandle.innerHTML = '☰';

        // Status indicator
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'hermes-status-indicator';
        statusIndicator.style.cssText = 'margin-left: 5px; color: #555; font-size: 11px; white-space: nowrap;';
        resetStatusIndicator();

        // Create buttons
        fillButton = document.createElement('button');
        fillButton.textContent = 'Fill Form';
        fillButton.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        fillButton.onmouseover = () => fillButton.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        fillButton.onmouseout = () => fillButton.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        fillButton.onclick = () => {
            if (justDragged) return;
            runFormFiller(profileData);
        };

        editProfileButton = document.createElement('button');
        editProfileButton.textContent = 'Edit Profile';
        editProfileButton.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        editProfileButton.onmouseover = () => editProfileButton.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        editProfileButton.onmouseout = () => editProfileButton.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        editProfileButton.onclick = () => {
            if (justDragged) return;
            toggleProfileEditor(true);
        };

        recordButton = document.createElement('button');
        recordButton.textContent = 'Record Macro';
        recordButton.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        recordButton.onmouseover = () => recordButton.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        recordButton.onmouseout = () => recordButton.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        recordButton.onclick = () => {
            if (justDragged) return;
            startRecording();
        };

        stopSaveButton = document.createElement('button');
        stopSaveButton.textContent = 'Stop & Save';
        stopSaveButton.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        stopSaveButton.onmouseover = () => stopSaveButton.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        stopSaveButton.onmouseout = () => stopSaveButton.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        stopSaveButton.onclick = () => {
            if (justDragged) return;
            stopRecording();
        };

        macroListDropdown = document.createElement('select');
        macroListDropdown.style.cssText = 'padding: 5px; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; cursor: pointer;';
        updateMacroDropdown();

        playMacroButton = document.createElement('button');
        playMacroButton.textContent = 'Play Macro';
        playMacroButton.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        playMacroButton.onmouseover = () => playMacroButton.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        playMacroButton.onmouseout = () => playMacroButton.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        playMacroButton.onclick = () => {
            if (justDragged) return;
            const macroName = macroListDropdown.value;
            if (macroName) {
                playMacro(macroName);
            } else {
                if (statusIndicator) {
                    statusIndicator.textContent = 'Select a macro';
                    statusIndicator.style.color = 'orange';
                    setTimeout(() => resetStatusIndicator(), 2000);
                }
            }
        };

        deleteMacroButton = document.createElement('button');
        deleteMacroButton.textContent = 'Delete Macro';
        deleteMacroButton.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        deleteMacroButton.onmouseover = () => deleteMacroButton.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        deleteMacroButton.onmouseout = () => deleteMacroButton.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        deleteMacroButton.onclick = () => {
            if (justDragged) return;
            const macroName = macroListDropdown.value;
            if (macroName) {
                deleteMacro(macroName);
            } else {
                if (statusIndicator) {
                    statusIndicator.textContent = 'Select a macro';
                    statusIndicator.style.color = 'orange';
                    setTimeout(() => resetStatusIndicator(), 2000);
                }
            }
        };

        viewLogButton = document.createElement('button');
        viewLogButton.textContent = 'View Logs';
        viewLogButton.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        viewLogButton.onmouseover = () => viewLogButton.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        viewLogButton.onmouseout = () => viewLogButton.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        viewLogButton.onclick = () => {
            if (justDragged) return;
            toggleLogViewer(true);
        };

        trainButton = document.createElement('button');
        trainButton.textContent = 'Train';
        trainButton.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        trainButton.onmouseover = () => trainButton.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        trainButton.onmouseout = () => trainButton.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        trainButton.onclick = () => {
            if (justDragged) return;
            toggleTrainerPanel(true);
        };

        overlayToggle = document.createElement('button');
        overlayToggle.textContent = showOverlays ? 'Overlays: ON' : 'Overlays: OFF';
        overlayToggle.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        overlayToggle.onmouseover = () => overlayToggle.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        overlayToggle.onmouseout = () => overlayToggle.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        overlayToggle.onclick = () => {
            if (justDragged) return;
            showOverlays = !showOverlays;
            GM_setValue(OVERLAY_STATE_KEY, showOverlays);
            overlayToggle.textContent = showOverlays ? 'Overlays: ON' : 'Overlays: OFF';
            if (showOverlays) {
                applyVisualOverlays();
            } else {
                removeVisualOverlays();
            }
            if (statusIndicator) {
                statusIndicator.textContent = `Overlays: ${showOverlays ? 'ON' : 'OFF'}`;
                statusIndicator.style.color = showOverlays ? 'green' : 'orange';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
        };

        learningToggle = document.createElement('button');
        learningToggle.textContent = learningMode ? 'Learning: ON' : 'Learning: OFF';
        learningToggle.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        learningToggle.onmouseover = () => learningToggle.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        learningToggle.onmouseout = () => learningToggle.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        learningToggle.onclick = () => {
            if (justDragged) return;
            learningMode = !learningMode;
            GM_setValue(LEARNING_STATE_KEY, learningMode);
            learningToggle.textContent = learningMode ? 'Learning: ON' : 'Learning: OFF';
            if (statusIndicator) {
                statusIndicator.textContent = `Learning: ${learningMode ? 'ON' : 'OFF'}`;
                statusIndicator.style.color = learningMode ? 'green' : 'orange';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
        };

        debugToggle = document.createElement('button');
        debugToggle.textContent = debugMode ? 'Debug: ON' : 'Debug: OFF';
        debugToggle.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        debugToggle.onmouseover = () => debugToggle.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        debugToggle.onmouseout = () => debugToggle.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        debugToggle.onclick = () => {
            if (justDragged) return;
            debugMode = !debugMode;
            GM_setValue(DEBUG_MODE_KEY, debugMode);
            debugToggle.textContent = debugMode ? 'Debug: ON' : 'Debug: OFF';
            if (debugMode) {
                HermesDebug.start();
            }
            if (statusIndicator) {
                statusIndicator.textContent = `Debug: ${debugMode ? 'ON' : 'OFF'}`;
                statusIndicator.style.color = debugMode ? 'green' : 'orange';
                setTimeout(() => resetStatusIndicator(), 2000);
            }
        };

        // Whitelist button
        const whitelistButton = document.createElement('button');
        whitelistButton.textContent = '🌐 Whitelist';
        whitelistButton.setAttribute('aria-label', 'Manage whitelist');
        whitelistButton.style.cssText = 'padding: 5px 8px; cursor: pointer; border: 1px solid var(--border-color, #aaa); border-radius: 4px; background-color: var(--button-bg, #e9e9e9); font-size: 11px; white-space: nowrap;';
        whitelistButton.onmouseover = () => whitelistButton.style.backgroundColor = 'var(--button-hover, #dcdcdc)';
        whitelistButton.onmouseout = () => whitelistButton.style.backgroundColor = 'var(--button-bg, #e9e9e9)';
        whitelistButton.onclick = () => {
            if (justDragged) return;
            toggleWhitelistPanel(true);
        };

        // Check whitelist
        if (isWhitelisted()) {
            isMinimized = true;
            minimizedContainer = document.createElement('div');
            minimizedContainer.id = 'hermes-minimized-container';
            minimizedContainer.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                width: 40px;
                height: 40px;
                background: var(--background, #f0f0f0);
                border: 1px solid var(--border-color, #999);
                border-radius: 50%;
                display: FJ
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 999999;
                font-size: 24px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                transition: transform 0.3s ease, opacity 0.3s ease;
            `;
            minimizedContainer.innerHTML = '🔥';

            // Append minimized container
            shadowRoot.appendChild(minimizedContainer);

            // Dragging for minimized container
            minimizedContainer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                dragging = true;
                justDragged = false;
                offset.x = e.clientX - (state.position.left || minimizedContainer.offsetLeft);
                offset.y = e.clientY - (state.position.top || minimizedContainer.offsetTop);
                minimizedContainer.style.cursor = 'grabbing';
            });

            document.addEventListener('mousemove', onMinMouseMove);
            document.addEventListener('mouseup', onMinMouseUp);

            function onMinMouseMove(e) {
                if (!dragging) return;
                justDragged = true;
                state.position.top = Math.max(0, Math.min(e.clientY - offset.y, window.innerHeight - 40));
                state.position.left = Math.max(0, Math.min(e.clientX - offset.x, window.innerWidth - 40));
                minimizedContainer.style.top = `${state.position.top}px`;
                minimizedContainer.style.left = `${state.position.left}px`;
                minimizedContainer.style.right = 'auto';
                minimizedContainer.style.bottom = 'auto';
            }

            function onMinMouseUp() {
                if (dragging) {
                    dragging = false;
                    minimizedContainer.style.cursor = 'pointer';
                    GM_setValue(POSITION_KEY, JSON.stringify(state.position));
                    setTimeout(() => { justDragged = false; }, 100);
                }
            }

            minimizedContainer.onclick = () => {
                if (justDragged) return;
                isMinimized = false;
                minimizedContainer.style.display = 'none';
                uiContainer.style.transform = 'translateX(100%)';
                uiContainer.style.opacity = '0';
                shadowRoot.appendChild(uiContainer);
                requestAnimationFrame(() => {
                    uiContainer.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    uiContainer.style.transform = 'translateX(0)';
                    uiContainer.style.opacity = '1';
                    applyToolbarPosition();
                });
            };

            // Apply saved position
            if (state.position.top !== null && state.position.left !== null) {
                minimizedContainer.style.top = `${state.position.top}px`;
                minimizedContainer.style.left = `${state.position.left}px`;
                minimizedContainer.style.right = 'auto';
                minimizedContainer.style.bottom = 'auto';
            }
        } else {
            // Append buttons and theme submenu
            const themeSubmenu = createThemeSubmenu();
            uiContainer.append(
                dragHandle,
                fillButton,
                editProfileButton,
                recordButton,
                stopSaveButton,
                macroListDropdown,
                playMacroButton,
                deleteMacroButton,
                viewLogButton,
                trainButton,
                overlayToggle,
                learningToggle,
                debugToggle,
                themeToggle,
                themeSubmenu,
                whitelistButton,
                statusIndicator
            );

            // Append UI container
            shadowRoot.appendChild(uiContainer);

            // Apply saved position
            const applyToolbarPosition = () => {
                if (state.position.top !== null && state.position.left !== null) {
                    uiContainer.style.top = `${state.position.top}px`;
                    uiContainer.style.left = `${state.position.left}px`;
                    uiContainer.style.right = 'auto';
                    uiContainer.style.bottom = 'auto';
                }
            };
            applyToolbarPosition();

            // Dragging logic for uiContainer
            dragHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                dragging = true;
                justDragged = false;
                offset.x = e.clientX - (state.position.left || uiContainer.offsetLeft);
                offset.y = e.clientY - (state.position.top || uiContainer.offsetTop);
                uiContainer.style.cursor = 'grabbing';
            });

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            function onMouseMove(e) {
                if (!dragging) return;
                justDragged = true;
                state.position.top = Math.max(0, Math.min(e.clientY - offset.y, window.innerHeight - uiContainer.offsetHeight));
                state.position.left = Math.max(0, Math.min(e.clientX - offset.x, window.innerWidth - uiContainer.offsetWidth));
                uiContainer.style.top = `${state.position.top}px`;
                uiContainer.style.left = `${state.position.left}px`;
                uiContainer.style.right = 'auto';
                uiContainer.style.bottom = 'auto';
            }

            function onMouseUp() {
                if (dragging) {
                    dragging = false;
                    uiContainer.style.cursor = 'default';
                    GM_setValue(POSITION_KEY, JSON.stringify(state.position));
                    setTimeout(() => { justDragged = false; }, 100);
                }
            }

            // Prevent button clicks after dragging
            [fillButton, editProfileButton, recordButton, stopSaveButton, playMacroButton, deleteMacroButton, viewLogButton, trainButton, overlayToggle, learningToggle, debugToggle, themeToggle, whitelistButton].forEach(btn => {
                btn._onclick = btn.onclick;
                btn.onclick = (e) => {
                    if (justDragged) {
                        e.stopPropagation();
                        return;
                    }
                    btn._onclick && btn._onclick(e);
                };
            });
        }

        // Apply theme
        applyTheme();

        // Debug logging
        if (debugMode) {
            console.log('Hermes: UIContainer appended:', shadowRoot.querySelector('#hermes-ui-container'));
            console.log('Hermes: MinimizedContainer appended:', shadowRoot.querySelector('#hermes-minimized-container'));
            console.log('Hermes: Position:', state.position);
        }
    }

    // =================== Initialization ===================
    function init() {
        console.log('Hermes: Initializing...');
        profileData = loadProfileData();
        macros = loadMacros();
        customMappings = loadCustomMappings();

        let shadowHost = document.querySelector('#hermes-shadow-host');
        if (!shadowHost) {
            shadowHost = document.createElement('div');
            shadowHost.id = 'hermes-shadow-host';
            document.body.appendChild(shadowHost);
        }

        try {
            shadowRoot = shadowHost.attachShadow({ mode: 'open' });
        } catch (error) {
            console.warn('Hermes: Shadow DOM not supported, falling back to document.body');
            shadowRoot = document.body;
        }

        setupUI();
        updateMacroDropdown();
        applyVisualOverlays();
        startMutationObserver();

        if (debugMode) {
            HermesDebug.start();
        }

        console.log('Hermes: Initialization complete');
    }

    // Run initialization
    init();
})();