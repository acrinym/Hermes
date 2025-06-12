const THEME_KEY = 'hermes_theme_ext';
const CUSTOM_THEMES_KEY = 'hermes_custom_themes_ext';

const themeSelect = document.getElementById('themeSelect');
const exportBtn = document.getElementById('exportThemes');
const importBtn = document.getElementById('importThemes');
const importFile = document.getElementById('importFile');

// Apply translations
document.title = t('HERMES_OPTIONS');
document.querySelector('h1').textContent = t('HERMES_OPTIONS');
document.querySelector('label').childNodes[0].nodeValue = t('THEME_LABEL');
exportBtn.textContent = t('EXPORT_THEMES');
importBtn.textContent = t('IMPORT_THEMES');

function populateThemes(builtIn, custom, current) {
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

function importThemes(files) {
    if (!files.length) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const obj = JSON.parse(reader.result);
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
importFile.addEventListener('change', () => importThemes(importFile.files));

document.addEventListener('DOMContentLoaded', load);
