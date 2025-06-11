import { macroEngine } from './macroEngine.ts';
import { fillForm } from './formFiller.ts';
import { applyTheme, getThemeOptions } from './theme.ts';
import { loadSettings, saveSettings, defaultSettings } from './settings.ts';
import { getInitialData, saveDataToBackground } from './storage/index.ts';
import { startSnowflakes } from './effectsEngine.ts';
import { showHelp } from './help.ts';
import { createModal } from './ui/components.js';

let currentTheme = 'dark';

function createThemeMenu(container: HTMLElement) {
    const menu = document.createElement('div');
    menu.style.cssText = 'position:absolute;top:100%;right:0;background:var(--hermes-panel-bg);border:1px solid var(--hermes-panel-border);padding:4px;z-index:2147483646;display:none';
    Object.entries(getThemeOptions()).forEach(([key, opt]) => {
        const btn = document.createElement('button');
        btn.textContent = `${opt.emoji} ${opt.name}`;
        btn.style.display='block';
        btn.onclick = () => {
            currentTheme = key;
            applyTheme(key);
            saveDataToBackground('hermes_theme_ext', key);
            menu.style.display='none';
        };
        menu.appendChild(btn);
    });
    container.appendChild(menu);
    return menu;
}

function showSettings() {
    const content = `<textarea id="hermes-settings-area" style="width:100%;height:200px;box-sizing:border-box;">${JSON.stringify(defaultSettings, null, 2)}</textarea>`;
    const panel = createModal(document.body, 'hermes-settings-panel', 'Hermes Settings', content, '600px', '<button id="hermes-save-settings">Save</button>');
    panel.style.display='block';
    const saveBtn = panel.querySelector('#hermes-save-settings') as HTMLButtonElement | null;
    const area = panel.querySelector('#hermes-settings-area') as HTMLTextAreaElement | null;
    if (saveBtn && area) {
        saveBtn.onclick = () => {
            try {
                const obj = JSON.parse(area.value);
                saveSettings(obj);
                panel.style.display='none';
            } catch(e) {
                alert('Invalid JSON');
            }
        };
    }
}

export async function initUI() {
    const data = await getInitialData();
    const profile = data.profile || {};
    currentTheme = data.theme || 'dark';
    applyTheme(currentTheme);
    await macroEngine.init();

    const container = document.createElement('div');
    container.id = 'hermes-ui';
    container.style.cssText = 'position:fixed;top:10px;right:10px;background:var(--hermes-bg);color:var(--hermes-text);padding:5px;z-index:2147483640;border:1px solid #999';

    const fillBtn = document.createElement('button');
    fillBtn.textContent = 'Fill';
    fillBtn.onclick = () => fillForm(profile);
    container.appendChild(fillBtn);

    const recBtn = document.createElement('button');
    recBtn.textContent = 'Rec';
    recBtn.onclick = () => macroEngine.startRecording();
    container.appendChild(recBtn);

    const stopBtn = document.createElement('button');
    stopBtn.textContent = 'Stop';
    stopBtn.onclick = () => macroEngine.stopRecording();
    container.appendChild(stopBtn);

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

    const themeBtn = document.createElement('button');
    themeBtn.textContent = 'Theme';
    container.appendChild(themeBtn);
    const menu = createThemeMenu(themeBtn);
    themeBtn.onclick = () => {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    };

    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = 'Settings';
    settingsBtn.onclick = showSettings;
    container.appendChild(settingsBtn);

    const helpBtn = document.createElement('button');
    helpBtn.textContent = '?';
    helpBtn.onclick = showHelp;
    container.appendChild(helpBtn);

    document.body.appendChild(container);
    loadSettings();
}
