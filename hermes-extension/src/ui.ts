import { macroEngine } from './macroEngine.ts';
import { fillForm } from './formFiller.ts';
import { runHeuristicTrainerSession } from './trainer.ts';
import { applyTheme } from './theme.ts';
import { loadSettings, toggleSettingsPanel } from './settings.ts';
import { getInitialData, saveDataToBackground } from './storage/index.ts';
import { startSnowflakes, startLasers, stopEffects } from './effectsEngine.ts';
import { toggleHelpPanel } from './help.ts';
import { setupUI, toggleMinimizedUI } from './ui/setup.ts';
import { createModal } from './ui/components.js';
import {
  setupDebugControls,
  toggleLogViewer,
  addDebugLog,
  startMutationObserver,
  stopMutationObserver
} from './debug.ts';
import { isAllowed } from './allowlist.ts';
import { initOverlays, toggleOverlays } from './overlays.ts';

let macroMenu: HTMLDivElement;

export async function initUI() {
    const data = await getInitialData();
    const profile = data.profile || {};
    const theme = data.theme || 'dark';
    applyTheme(theme);
    initOverlays(!!data.showOverlays);
    await macroEngine.init();
    const settings = await loadSettings();
    if (settings.macro) macroEngine.updateSettings(settings.macro);

    const container = setupUI();
    const allowed = isAllowed(location.hostname, data.whitelist || []);
    if (!allowed) toggleMinimizedUI(true);

    const fillBtn = document.createElement('button');
    fillBtn.textContent = 'Fill';
    fillBtn.onclick = () => fillForm(profile);
    container.appendChild(fillBtn);

    const trainBtn = document.createElement('button');
    trainBtn.textContent = 'Train';
    trainBtn.onclick = () => runHeuristicTrainerSession(profile);
    container.appendChild(trainBtn);

    const recBtn = document.createElement('button');
    recBtn.textContent = 'Rec';
    recBtn.onclick = () => macroEngine.startRecording();
    container.appendChild(recBtn);

    const stopBtn = document.createElement('button');
    stopBtn.textContent = 'Stop';
    stopBtn.onclick = () => macroEngine.stopRecording();
    container.appendChild(stopBtn);

    const macrosBtn = document.createElement('button');
    macrosBtn.textContent = 'Macros';
    container.appendChild(macrosBtn);

    macroMenu = document.createElement('div');
    macroMenu.style.cssText = 'display:none;position:absolute;background:var(--hermes-bg);border:1px solid #999;padding:4px;z-index:2147483647;';
    container.appendChild(macroMenu);

    const updateMacroDropdown = () => {
        updateMacroSubmenuContents(macroMenu);
    };

    macrosBtn.onclick = (e) => {
        e.stopPropagation();
        const visible = macroMenu.style.display === 'block';
        macroMenu.style.display = visible ? 'none' : 'block';
        if (!visible) {
            const rect = macrosBtn.getBoundingClientRect();
            macroMenu.style.left = `${rect.left}px`;
            macroMenu.style.top = `${rect.bottom + 2}px`;
            updateMacroDropdown();
        }
    };

    document.addEventListener('click', () => { macroMenu.style.display = 'none'; });

    const playBtn = document.createElement('button');
    playBtn.textContent = 'Play';
    playBtn.onclick = () => {
        const name = prompt('Macro name');
        if (name) macroEngine.play(name);
    };
    container.appendChild(playBtn);

    const fxBtn = document.createElement('button');
    fxBtn.textContent = 'Snow';
    fxBtn.onclick = () => startSnowflakes();
    container.appendChild(fxBtn);

    const overlayBtn = document.createElement('button');
    overlayBtn.textContent = 'Overlay';
    overlayBtn.onclick = () => {
        toggleOverlays();
        overlayBtn.style.background = overlayBtn.style.background ? '' : 'lightgreen';
    };
    if (data.showOverlays) overlayBtn.style.background = 'lightgreen';
    container.appendChild(overlayBtn);

    const helpBtn = document.createElement('button');
    helpBtn.textContent = '?';
    helpBtn.onclick = () => toggleHelpPanel(true);
    container.appendChild(helpBtn);

    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = 'Settings';
    settingsBtn.onclick = () => toggleSettingsPanel(true);
    container.appendChild(settingsBtn);

    const logBtn = document.createElement('button');
    logBtn.textContent = 'Logs';
    logBtn.onclick = () => toggleLogViewer(true);
    container.appendChild(logBtn);

    const debugBtn = document.createElement('button');
    let debugEnabled = !!data.debugMode;
    debugBtn.textContent = 'Debug';
    debugBtn.onclick = () => {
        debugEnabled = !debugEnabled;
        if (debugEnabled) {
            startMutationObserver(() => addDebugLog('mutation','dom',{}));
        } else {
            stopMutationObserver();
        }
        saveDataToBackground('hermes_debug_mode_ext', debugEnabled);
    };
    container.appendChild(debugBtn);

    const learnBtn = document.createElement('button');
    let learning = !!data.learningMode;
    learnBtn.textContent = 'Learn';
    learnBtn.onclick = () => {
        learning = !learning;
        saveDataToBackground('hermes_learning_state_ext', learning);
    };
    container.appendChild(learnBtn);

    const laserBtn = document.createElement('button');
    laserBtn.textContent = 'Lasers';
    laserBtn.onclick = () => startLasers();
    container.appendChild(laserBtn);

    const stopFxBtn = document.createElement('button');
    stopFxBtn.textContent = 'FX Off';
    stopFxBtn.onclick = () => stopEffects();
    container.appendChild(stopFxBtn);

    setupDebugControls();
    if (debugEnabled) {
        startMutationObserver(() => addDebugLog('mutation', 'dom', {}));
    }
    window.addEventListener('beforeunload', stopMutationObserver);

    // open help panel if it was previously left open
    if (data.helpPanelOpen) {
        toggleHelpPanel(true);
    }

    // load settings just to demonstrate
    loadSettings();
}

function updateMacroSubmenuContents(menu: HTMLElement) {
    menu.innerHTML = '';
    const names = macroEngine.list();
    if (names.length) {
        names.forEach(name => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '2px';

            const play = document.createElement('button');
            play.textContent = name;
            play.onclick = (e) => { e.stopPropagation(); macroEngine.play(name); menu.style.display = 'none'; };

            const edit = document.createElement('button');
            edit.textContent = '✏️';
            edit.onclick = (e) => { e.stopPropagation(); toggleMacroEditor(true, name); };

            const del = document.createElement('button');
            del.textContent = '🗑️';
            del.onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Delete macro "${name}"?`)) {
                    await macroEngine.delete(name);
                    updateMacroSubmenuContents(menu);
                }
            };

            row.append(play, edit, del);
            menu.appendChild(row);
        });
        const importBtn = document.createElement('button');
        importBtn.textContent = 'Import Macros';
        importBtn.style.marginTop = '4px';
        importBtn.onclick = (e) => { e.stopPropagation(); importMacrosFromFile(); };
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Macros';
        exportBtn.style.marginTop = '4px';
        exportBtn.onclick = (e) => { e.stopPropagation(); exportMacros(); };
        menu.appendChild(importBtn);
        menu.appendChild(exportBtn);
    } else {
        const msg = document.createElement('div');
        msg.textContent = 'No macros recorded.';
        menu.appendChild(msg);
        const importBtn = document.createElement('button');
        importBtn.textContent = 'Import Macros';
        importBtn.style.marginTop = '4px';
        importBtn.onclick = (e) => { e.stopPropagation(); importMacrosFromFile(); };
        menu.appendChild(importBtn);
    }
}

function createMacroEditorPanel() {
    const panelId = 'hermes-macro-editor';
    if (document.getElementById(panelId)) return;
    const contentHtml = `<select id="hermes-macro-edit-select" style="width:100%;margin-bottom:10px;"></select>` +
        `<textarea id="hermes-macro-edit-text" style="width:100%;height:50vh;resize:vertical;font-family:monospace;padding:10px;box-sizing:border-box;"></textarea>`;
    const customButtonsHtml = `<button id="hermes-macro-edit-save" style="background:var(--hermes-success-text);color:var(--hermes-panel-bg);">Save Macro</button>`;
    const panel = createModal(document.body, panelId, 'Macro Editor', contentHtml, '700px', customButtonsHtml);

    const selectEl = panel.querySelector('#hermes-macro-edit-select') as HTMLSelectElement;
    const textArea = panel.querySelector('#hermes-macro-edit-text') as HTMLTextAreaElement;
    const populate = () => {
        selectEl.innerHTML = macroEngine.list().map(n => `<option value="${n}">${n}</option>`).join('');
        if (selectEl.value) textArea.value = JSON.stringify(macroEngine.get(selectEl.value) || [], null, 2);
        else textArea.value = '';
    };
    populate();
    selectEl.onchange = () => {
        textArea.value = JSON.stringify(macroEngine.get(selectEl.value) || [], null, 2);
    };
    const saveBtn = panel.querySelector('#hermes-macro-edit-save') as HTMLButtonElement;
    saveBtn.onclick = async () => {
        const name = selectEl.value;
        try {
            const arr = JSON.parse(textArea.value);
            await macroEngine.set(name, arr);
            updateMacroSubmenuContents(macroMenu);
            panel.style.display = 'none';
        } catch (e: any) {
            alert('Invalid JSON: ' + e.message);
        }
    };
}

function toggleMacroEditor(show: boolean, macroName?: string) {
    let panel = document.getElementById('hermes-macro-editor') as HTMLDivElement | null;
    if (show && !panel) { createMacroEditorPanel(); panel = document.getElementById('hermes-macro-editor') as HTMLDivElement; }
    if (!panel) return;
    const selectEl = panel.querySelector('#hermes-macro-edit-select') as HTMLSelectElement;
    const textArea = panel.querySelector('#hermes-macro-edit-text') as HTMLTextAreaElement;
    if (show) {
        panel.style.display = 'block';
        selectEl.innerHTML = macroEngine.list().map(n => `<option value="${n}">${n}</option>`).join('');
        if (macroName && macroEngine.get(macroName)) selectEl.value = macroName;
        textArea.value = selectEl.value ? JSON.stringify(macroEngine.get(selectEl.value) || [], null, 2) : '';
    } else {
        panel.style.display = 'none';
    }
}

function exportMacros() {
    const format: 'json' | 'xml' = 'json';
    const data = macroEngine.exportMacros(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hermes_macros_export.${format === 'json' ? 'json' : 'xml'}`;
    a.click();
    URL.revokeObjectURL(url);
}

function importMacrosFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.xml,application/json,application/xml,text/xml';
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
                console.error('Hermes: Invalid macro file');
                alert('Invalid macro file');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
