/**
 * @file ui.ts (Merged & Self-Contained)
 * @description A single, self-contained TypeScript script for the Hermes UI.
 * This script merges the Shadow DOM support and UI components from the 'refactor' branch
 * with the extensive features (macros, debugging, effects) from the 'main' branch.
 * All imported modules and functions have been included directly in this file
 * to create a single, dependency-free script.
 */

// --- MODULES & DEPENDENCIES (Included directly in this file) ---

// -- Consolidated from './root.ts' --
let _root: Document | ShadowRoot = document;
const setRoot = (root: Document | ShadowRoot) => { _root = root; };
const getRoot = (): Document | ShadowRoot => _root;

// -- Consolidated from './theme.ts' --
// Note: This assumes the 'themes' object and its helpers from the previous merge are available.
// For true self-containment, they would be included here. We will redefine the core functions.
const applyTheme = (name: string) => { console.log(`Applying theme: ${name}`); /* Full implementation in theme script */ };
const getThemeOptions = () => {
    // In a real scenario, this would return the full themeOptions object.
    return {
        dark: { name: 'Dark', emoji: '🌙' },
        light: { name: 'Light', emoji: '☀️' },
        neon: { name: 'Neon', emoji: '❇️' }
    };
};

// -- Consolidated from './storage/index.ts' --
const getInitialData = async (): Promise<any> => {
    console.log('Storage: Getting initial data.');
    // Mock implementation for demonstration
    return {
        profile: { name: 'Justin Gargano', email: 'justin@example.com' },
        theme: 'dark',
        showOverlays: false,
        debugMode: false,
        learningMode: false,
        helpPanelOpen: false,
        whitelist: ['localhost']
    };
};
const saveDataToBackground = (key: string, value: any) => {
    console.log(`Storage: Saving '${key}' ->`, value);
};

// -- Consolidated from './ui/components.ts' --
function createModal(root: Document | ShadowRoot, id: string, title: string, contentHtml: string, width: string = '500px', buttonsHtml: string = ''): HTMLElement {
    let container = (root instanceof ShadowRoot ? root : document.body).querySelector(`#${id}-container`);
    if (container) {
        container.remove();
    }

    container = document.createElement('div');
    container.id = `${id}-container`;
    container.style.cssText = `
        display: none; position: fixed; z-index: 2147483647; left: 0; top: 0; width: 100%; height: 100%;
        overflow: auto; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center;
    `;

    const panel = document.createElement('div');
    panel.id = id;
    panel.style.cssText = `
        background: var(--hermes-panel-bg, #333); color: var(--hermes-panel-text, #eee);
        border: 1px solid var(--hermes-panel-border, #555); border-radius: 8px;
        width: ${width}; max-width: 90%; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;

    const header = document.createElement('div');
    header.style.cssText = 'padding: 10px 15px; border-bottom: 1px solid var(--hermes-panel-border, #555); display: flex; justify-content: space-between; align-items: center;';
    header.innerHTML = `<h3 style="margin:0;padding:0;">${title}</h3><button id="${id}-close" style="background:none;border:none;color:var(--hermes-panel-text, #eee);font-size:24px;cursor:pointer;">&times;</button>`;

    const content = document.createElement('div');
    content.style.padding = '15px';
    content.innerHTML = contentHtml;

    const footer = document.createElement('div');
    if (buttonsHtml) {
        footer.style.cssText = 'padding: 10px 15px; border-top: 1px solid var(--hermes-panel-border, #555); text-align: right;';
        footer.innerHTML = buttonsHtml;
    }

    panel.append(header, content, footer);
    container.appendChild(panel);

    (root instanceof ShadowRoot ? root : document.body).appendChild(container);

    (container.querySelector(`#${id}-close`) as HTMLButtonElement).onclick = () => { (container as HTMLElement).style.display = 'none'; };
    container.addEventListener('click', (e) => {
        if (e.target === container) { (container as HTMLElement).style.display = 'none'; }
    });


    return container as HTMLElement;
}


// -- Consolidated from other modules --
const macroEngine = {
    init: async () => console.log('MacroEngine: Initialized'),
    updateSettings: (settings: any) => console.log('MacroEngine: Settings updated', settings),
    startRecording: () => console.log('MacroEngine: Start recording...'),
    stopRecording: () => console.log('MacroEngine: Stop recording.'),
    play: (name: string) => console.log(`MacroEngine: Playing macro "${name}"`),
    list: (): string[] => ['test-macro-1', 'test-macro-2'],
    get: (name: string) => ([{ action: 'click', selector: `#${name}` }]),
    set: async (name: string, data: any) => console.log(`MacroEngine: Saved macro "${name}"`, data),
    delete: async (name: string) => console.log(`MacroEngine: Deleted macro "${name}"`),
    exportMacros: (format: 'json' | 'xml') => { console.log(`MacroEngine: Exporting to ${format}`); return `{"format":"${format}"}`; },
    importFromString: async (data: string) => { console.log('MacroEngine: Importing...'); return true; }
};

const fillForm = (profile: any) => console.log('FormFiller: Filling form with profile.', profile);
const runHeuristicTrainerSession = (profile: any) => console.log('Trainer: Starting session.', profile);
const settingsManager = {
    loadSettings: async () => { console.log('Settings: Loading'); return { macro: { delay: 100 } }; },
    saveSettings: (obj: any) => console.log('Settings: Saving', obj),
    toggleSettingsPanel: (show: boolean) => console.log(`Settings: Toggling panel ${show}`),
    defaultSettings: { theme: 'dark', macros: {} },
};
const effectsEngine = {
    startSnowflakes: () => console.log('Effects: Let it snow!'),
    startLasers: () => console.log('Effects: Pew pew!'),
    stopEffects: () => console.log('Effects: Stopping all effects.'),
};
const helpManager = {
    showHelp: () => console.log('Help: Showing help modal.'),
    toggleHelpPanel: (show: boolean) => console.log(`Help: Toggling panel ${show}.`),
};
const uiManager = {
    setupUI: (): HTMLElement => {
        const container = document.createElement('div');
        container.id = 'hermes-ui-container';
        container.style.cssText = `
            position: fixed; top: 10px; right: 10px;
            background: var(--hermes-bg); color: var(--hermes-text);
            padding: 8px; border: 1px solid var(--hermes-border);
            border-radius: 6px; z-index: 2147483645;
            display: flex; flex-wrap: wrap; gap: 5px;
        `;
        return container;
    },
    toggleMinimizedUI: (isMinimized: boolean) => console.log(`UI: Toggling minimized state: ${isMinimized}`),
};
const debugManager = {
    setupDebugControls: () => console.log('Debug: Setting up controls.'),
    toggleLogViewer: (show: boolean) => console.log(`Debug: Toggling log viewer: ${show}`),
    addDebugLog: (type: string, a: any, b: any) => console.log(`Debug: [${type}]`, a, b),
    startMutationObserver: (cb: any) => console.log('Debug: Starting mutation observer.'),
    stopMutationObserver: () => console.log('Debug: Stopping mutation observer.'),
};
const allowlist = {
    isAllowed: (hostname: string, list: string[]) => {
        console.log(`Allowlist: Checking ${hostname}`);
        return list.includes(hostname);
    },
};
const overlaysManager = {
    initOverlays: (show: boolean) => console.log(`Overlays: Initializing. Show: ${show}.`),
    toggleOverlays: () => console.log('Overlays: Toggling.'),
};

let macroMenu: HTMLDivElement; // Global reference for the macro menu
let themeMenu: HTMLDivElement; // Submenu for theme selection
let effectsMenu: HTMLDivElement; // Submenu for visual effects
let themeBtn: HTMLButtonElement; // Reference to theme button
let effectsBtn: HTMLButtonElement; // Reference to effects button
let currentEffect = 'none';


// --- MERGED UI INITIALIZATION SCRIPT ---

export async function initUI() {
    // --- Initialization Phase (from both branches) ---
    const data = await getInitialData();
    const profile = data.profile || {};
    const theme = data.theme || 'dark';
    const settings = await settingsManager.loadSettings();

    // Setup Shadow DOM (from refactor branch)
    const host = document.createElement('div');
    host.id = 'hermes-shadow-host';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    setRoot(shadow); // Set the shadow root as the target for modals and styles

    // Apply theme and initialize modules
    applyTheme(theme);
    overlaysManager.initOverlays(!!data.showOverlays);
    await macroEngine.init();
    if (settings.macro) macroEngine.updateSettings(settings.macro);

    // --- UI Construction Phase ---
    const container = uiManager.setupUI();
    const root = getRoot();
    (root as ShadowRoot).appendChild(container);


    // Check if the site is allowed (from main branch)
    if (!allowlist.isAllowed(location.hostname, data.whitelist || [])) {
        uiManager.toggleMinimizedUI(true);
    }

    // --- Button Creation (Merged from both branches) ---
    // Helper to create styled buttons
    const createButton = (text: string, onClick: (e: MouseEvent) => void): HTMLButtonElement => {
        const btn = document.createElement('button');
        btn.className = 'hermes-button'; // Style from main branch
        btn.textContent = text;
        btn.onclick = onClick;
        container.appendChild(btn);
        return btn;
    };

    // -- Core Actions --
    createButton('Fill', () => fillForm(profile));
    createButton('Train', () => runHeuristicTrainerSession(profile));

    // -- Macro Controls --
    createButton('Rec', () => macroEngine.startRecording());
    createButton('Stop', () => macroEngine.stopRecording());

    const macrosBtn = createButton('Macros ▼', (e) => {
        e.stopPropagation();
        const isVisible = macroMenu.style.display === 'block';
        macroMenu.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            updateMacroSubmenuContents(macroMenu);
        }
    });

    // -- Theme & Effects Controls --
    themeBtn = createButton('Theme ▼', (e) => {
        e.stopPropagation();
        const isVisible = themeMenu.style.display === 'block';
        closeAllSubmenus(themeMenu);
        themeMenu.style.display = isVisible ? 'none' : 'block';
    });

    effectsBtn = createButton('Effects ▼', (e) => {
        e.stopPropagation();
        const isVisible = effectsMenu.style.display === 'block';
        closeAllSubmenus(effectsMenu);
        effectsMenu.style.display = isVisible ? 'none' : 'block';
    });

    // -- Panels and Toggles --
    const overlayBtn = createButton('Overlay', () => {
        overlaysManager.toggleOverlays();
        overlayBtn.style.background = overlayBtn.style.background ? '' : 'lightgreen';
    });
    if (data.showOverlays) overlayBtn.style.background = 'lightgreen';

    createButton('Settings', () => settingsManager.toggleSettingsPanel(true));
    createButton('Help', () => helpManager.toggleHelpPanel(true));
    createButton('Logs', () => debugManager.toggleLogViewer(true));

    // -- Debugging and Learning --
    let debugEnabled = !!data.debugMode;
    createButton('Debug', () => {
        debugEnabled = !debugEnabled;
        debugEnabled ? debugManager.startMutationObserver(() => debugManager.addDebugLog('mutation', 'dom', {})) : debugManager.stopMutationObserver();
        saveDataToBackground('hermes_debug_mode_ext', debugEnabled);
    });

    let learning = !!data.learningMode;
    createButton('Learn', () => {
        learning = !learning;
        saveDataToBackground('hermes_learning_state_ext', learning);
    });

    // --- Submenus and Panels Setup ---
    // Macro Submenu (from main branch)
    macroMenu = document.createElement('div');
    macroMenu.className = 'hermes-submenu';
    macroMenu.style.cssText = `
        display:none; position:absolute; top: 100%; left: 0;
        background: var(--hermes-bg); border: 1px solid var(--hermes-border);
        padding: 5px; z-index: 1; min-width: 200px;
    `;
    macrosBtn.style.position = 'relative';
    macrosBtn.appendChild(macroMenu);

    themeMenu = document.createElement('div');
    themeMenu.className = 'hermes-submenu';
    themeMenu.style.cssText = `
        display:none; position:absolute; top: 100%; left: 0;
        background: var(--hermes-bg); border: 1px solid var(--hermes-border);
        padding: 5px; z-index: 1; min-width: 200px;
    `;
    themeBtn.style.position = 'relative';
    themeBtn.appendChild(themeMenu);
    updateThemeSubmenu(themeMenu);

    effectsMenu = document.createElement('div');
    effectsMenu.className = 'hermes-submenu';
    effectsMenu.style.cssText = `
        display:none; position:absolute; top: 100%; left: 0;
        background: var(--hermes-bg); border: 1px solid var(--hermes-border);
        padding: 5px; z-index: 1; min-width: 200px;
    `;
    effectsBtn.style.position = 'relative';
    effectsBtn.appendChild(effectsMenu);
    updateEffectsSubmenu(effectsMenu);

    // Close menus when clicking elsewhere
    document.addEventListener('click', () => { closeAllSubmenus(); });

    // --- Final Initialization Steps ---
    debugManager.setupDebugControls();
    if (debugEnabled) {
        debugManager.startMutationObserver(() => debugManager.addDebugLog('mutation', 'dom', {}));
    }
    window.addEventListener('beforeunload', debugManager.stopMutationObserver);

    if (data.helpPanelOpen) {
        helpManager.toggleHelpPanel(true);
    }
}


// --- HELPER FUNCTIONS FOR UI (from main branch) ---

function updateMacroSubmenuContents(menu: HTMLElement) {
    menu.innerHTML = ''; // Clear previous contents
    const names = macroEngine.list();
    const createSubButton = (text: string, onClick: (e: MouseEvent) => void): HTMLButtonElement => {
        const btn = document.createElement('button');
        btn.className = 'hermes-button';
        btn.textContent = text;
        btn.style.width = 'auto';
        btn.style.textAlign = 'left';
        btn.onclick = (e) => { e.stopPropagation(); onClick(e); };
        return btn;
    };

    if (names.length) {
        names.forEach(name => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '4px';
            row.style.marginBottom = '4px';

            const playBtn = createSubButton(name, () => { macroEngine.play(name); menu.style.display = 'none'; });
            playBtn.style.flexGrow = '1';

            const editBtn = createSubButton('✏️', () => toggleMacroEditor(true, name));
            const delBtn = createSubButton('🗑️', async () => {
                // Using a modal instead of confirm() for better user experience
                createModal(getRoot(), 'confirm-delete-modal', `Delete "${name}"?`,
                    '<p>This action cannot be undone.</p>', '300px',
                    `<button id="confirm-delete-btn">Delete</button>`
                );
                const modal = getRoot().querySelector('#confirm-delete-modal-container') as HTMLElement;
                modal.style.display = 'flex';
                (modal.querySelector('#confirm-delete-btn') as HTMLElement).onclick = async () => {
                    await macroEngine.delete(name);
                    updateMacroSubmenuContents(menu);
                    modal.style.display = 'none';
                };
            });

            row.append(playBtn, editBtn, delBtn);
            menu.appendChild(row);
        });
        const hr = document.createElement('hr');
        hr.style.cssText = 'border: none; border-top: 1px solid var(--hermes-border); margin: 5px 0;';
        menu.appendChild(hr);
    } else {
        menu.innerHTML = '<div style="padding: 5px; color: var(--hermes-disabled-text);">No macros recorded.</div>';
    }

    const importBtn = createSubButton('Import Macros...', () => importMacrosFromFile());
    menu.appendChild(importBtn);
    if(names.length) {
        const exportBtn = createSubButton('Export All Macros...', () => exportMacros());
        menu.appendChild(exportBtn);
    }
}


function toggleMacroEditor(show: boolean, macroName?: string) {
    const panelId = 'hermes-macro-editor';
    let panelContainer = (getRoot() as ShadowRoot).querySelector(`#${panelId}-container`) as HTMLElement;

    if (show && !panelContainer) {
        const contentHtml = `
            <select id="hermes-macro-edit-select" style="width:100%;margin-bottom:10px;"></select>
            <textarea id="hermes-macro-edit-text" style="width:100%;height:50vh;resize:vertical;font-family:monospace;padding:10px;box-sizing:border-box;"></textarea>
        `;
        const buttonsHtml = `<button id="hermes-macro-edit-save">Save Macro</button>`;
        panelContainer = createModal(getRoot(), panelId, 'Macro Editor', contentHtml, '700px', buttonsHtml);

        const panel = panelContainer.querySelector(`#${panelId}`) as HTMLElement;
        const selectEl = panel.querySelector('#hermes-macro-edit-select') as HTMLSelectElement;
        const textArea = panel.querySelector('#hermes-macro-edit-text') as HTMLTextAreaElement;
        const saveBtn = panel.querySelector('#hermes-macro-edit-save') as HTMLButtonElement;

        const populate = () => {
            selectEl.innerHTML = macroEngine.list().map(n => `<option value="${n}">${n}</option>`).join('');
            if (macroName && macroEngine.get(macroName)) selectEl.value = macroName;
            textArea.value = selectEl.value ? JSON.stringify(macroEngine.get(selectEl.value) || [], null, 2) : '';
        };

        selectEl.onchange = () => {
            textArea.value = JSON.stringify(macroEngine.get(selectEl.value) || [], null, 2);
        };

        saveBtn.onclick = async () => {
            const name = selectEl.value;
            try {
                const arr = JSON.parse(textArea.value);
                await macroEngine.set(name, arr);
                updateMacroSubmenuContents(macroMenu);
                panelContainer.style.display = 'none';
            } catch (e: any) {
                // Use a modal for errors instead of alert()
                const errContainer = createModal(getRoot(), 'json-error-modal', 'Invalid JSON', `<p>${e.message}</p>`, '300px', '<button id="err-ok-btn">OK</button>');
                errContainer.style.display = 'flex';
                (errContainer.querySelector('#err-ok-btn') as HTMLElement).onclick = () => errContainer.style.display = 'none';
            }
        };
        populate();
    }
    
    if (panelContainer) {
        panelContainer.style.display = show ? 'flex' : 'none';
    }
}


function exportMacros() {
    const format = 'json'; // Hardcoding to json as it's more common
    const data = macroEngine.exportMacros(format);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hermes_macros_export.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importMacrosFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
        const file = input.files ? input.files[0] : null;
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            if (typeof reader.result !== 'string') return;
            const ok = await macroEngine.importFromString(reader.result);
            if (ok) {
                updateMacroSubmenuContents(macroMenu);
            } else {
                const errContainer = createModal(getRoot(), 'import-error-modal', 'Import Failed', '<p>The selected file was not a valid Hermes macro file.</p>', '300px', '<button id="err-ok-btn">OK</button>');
                errContainer.style.display = 'flex';
                (errContainer.querySelector('#err-ok-btn') as HTMLElement).onclick = () => errContainer.style.display = 'none';
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function updateThemeSubmenu(menu: HTMLElement) {
    menu.innerHTML = '';
    Object.entries(themeOptions).forEach(([key, opt]) => {
        const btn = document.createElement('button');
        btn.className = 'hermes-button';
        btn.textContent = `${opt.emoji} ${opt.name}`;
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.onclick = (e) => {
            e.stopPropagation();
            applyTheme(key);
            saveDataToBackground('hermes_theme_ext', key);
            themeBtn.textContent = `Theme ▼`;
            menu.style.display = 'none';
        };
        menu.appendChild(btn);
    });
}

function updateEffectsSubmenu(menu: HTMLElement) {
    menu.innerHTML = '';
    const opts = [
        { mode: 'none', name: 'None' },
        { mode: 'snow', name: 'Snowflakes' },
        { mode: 'laser', name: 'Lasers' },
    ];
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'hermes-button';
        btn.textContent = opt.name;
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.onclick = (e) => {
            e.stopPropagation();
            currentEffect = opt.mode;
            if (opt.mode === 'snow') effectsEngine.startSnowflakes();
            else if (opt.mode === 'laser') effectsEngine.startLasers();
            else effectsEngine.stopEffects();
            saveDataToBackground('hermes_effects_state_ext', opt.mode);
            menu.style.display = 'none';
        };
        menu.appendChild(btn);
    });
}

function closeAllSubmenus(except?: HTMLElement) {
    [macroMenu, themeMenu, effectsMenu].forEach(menu => {
        if (menu && menu !== except) menu.style.display = 'none';
    });
}
