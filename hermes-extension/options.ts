const THEME_KEY = 'hermes_theme_ext';
const CUSTOM_THEMES_KEY = 'hermes_custom_themes_ext';

declare const chrome: any;

const themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
const exportBtn = document.getElementById('exportThemes') as HTMLButtonElement;
const importBtn = document.getElementById('importThemes') as HTMLButtonElement;
const importFile = document.getElementById('importFile') as HTMLInputElement;

function populateThemes(
    builtIn: Record<string, any>,
    custom: Record<string, any>,
    current: string
) {
    themeSelect.innerHTML = '';
    const allThemes = { ...builtIn, ...custom };
    Object.keys(allThemes).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${allThemes[key].emoji} ${allThemes[key].name}`;
        if (key === current) opt.selected = true;
        themeSelect.appendChild(opt);
    });
}

function load() {
    chrome.storage.local.get([THEME_KEY, CUSTOM_THEMES_KEY, 'hermes_built_in_themes'], (data) => {
        const builtIn = data.hermes_built_in_themes ? JSON.parse(data.hermes_built_in_themes) : {};
        const custom = data[CUSTOM_THEMES_KEY] ? JSON.parse(data[CUSTOM_THEMES_KEY]) : {};
        const current = data[THEME_KEY] || 'dark';
        populateThemes(builtIn, custom, current);
    });
}

function saveTheme() {
    const val = themeSelect.value;
    chrome.storage.local.set({ [THEME_KEY]: val }, () => {
        console.log('Theme saved', val);
    });
}

function exportThemes() {
    chrome.storage.local.get([CUSTOM_THEMES_KEY], (data) => {
        const blob = new Blob([data[CUSTOM_THEMES_KEY] || '{}'], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hermes-themes.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function importThemes(files: FileList) {
    if (!files.length) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const obj = JSON.parse(reader.result as string);
            chrome.storage.local.set({ [CUSTOM_THEMES_KEY]: JSON.stringify(obj) }, load);
        } catch (e) {
            console.error('Invalid theme JSON', e);
        }
    };
    reader.readAsText(file);
}

themeSelect.addEventListener('change', saveTheme);
exportBtn.addEventListener('click', exportThemes);
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', () => {
    if (importFile.files) {
        importThemes(importFile.files);
    }
});

document.addEventListener('DOMContentLoaded', load);
