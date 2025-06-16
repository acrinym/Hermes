// === Hermes UI Core - Merged ShadowDOM Edition ===

import { macroEngine } from './macroEngine.ts';
import { fillForm } from './formFiller.ts';
import { runHeuristicTrainerSession } from './trainer.ts';
import { applyTheme } from './theme.ts';
import { themeOptions } from './themeOptions.ts';
import { loadSettings, toggleSettingsPanel } from './settings.ts';
import { getInitialData, saveDataToBackground } from './storage/index.ts';
import { startSnowflakes, startLasers, startCube, stopEffects, setEffect } from './effectsEngine.ts';
import { showHelp } from './help.ts';
import { setupUI, toggleMinimizedUI } from './ui/setup.ts';
import { createModal } from './ui/components.js';
import {
  setupDebugControls,
  toggleLogViewer,
  addDebugLog,
  startMutationObserver,
  stopMutationObserver
} from './debug.ts';
import { isAllowed, loadWhitelist, saveWhitelist } from './allowlist.ts';
import { toggleOverlays, initOverlays } from './overlays.ts';
import { t } from '../i18n.js';

// Shadow DOM root globals
let shadowHost: HTMLDivElement;
let shadowRoot: ShadowRoot;

// Main UI elements
let macroMenu: HTMLDivElement;
let themeMenu: HTMLDivElement;
let effectsMenu: HTMLDivElement;
let themeBtn: HTMLButtonElement;
let effectsBtn: HTMLButtonElement;
let macrosBtn: HTMLButtonElement;
let allowBtn: HTMLButtonElement;
let helpBtn: HTMLButtonElement;
let overlayBtn: HTMLButtonElement;
let settingsBtn: HTMLButtonElement;
let debugBtn: HTMLButtonElement;
let learnBtn: HTMLButtonElement;
let allowPanel: HTMLElement | null = null;
let currentEffect = 'none';

// === Main Hermes UI Init ===

export async function initUI() {
  const data = await getInitialData();
  const profile = data.profile || {};
  const theme = data.theme || 'dark';
  const settings = await loadSettings();

  // ----- SHADOW DOM SETUP -----
  shadowHost = document.createElement('div');
  shadowHost.id = 'hermes-shadow-host';
  document.body.appendChild(shadowHost);
  shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  // ----- UI ROOT -----
  const container = setupUI();
  shadowRoot.appendChild(container);

  // ----- Panel Menus -----
  macroMenu = document.createElement('div');
  macroMenu.className = 'hermes-submenu';
  macroMenu.style.cssText = 'display:none;position:absolute;background:var(--hermes-bg);border:1px solid #999;padding:4px;z-index:2147483647;';
  container.appendChild(macroMenu);

  themeMenu = document.createElement('div');
  themeMenu.className = 'hermes-submenu';
  themeMenu.style.cssText = 'display:none;position:absolute;background:var(--hermes-bg);border:1px solid #999;padding:4px;z-index:2147483647;';
  container.appendChild(themeMenu);

  effectsMenu = document.createElement('div');
  effectsMenu.className = 'hermes-submenu';
  effectsMenu.style.cssText = 'display:none;position:absolute;background:var(--hermes-bg);border:1px solid #999;padding:4px;z-index:2147483647;';
  container.appendChild(effectsMenu);

  // Helper
  const createButton = (text: string, handler: (e: MouseEvent) => void) => {
  const btn = document.createElement('button');
  btn.className = 'hermes-button';
  btn.textContent = text;
  btn.onclick = handler;
  container.appendChild(btn);
  return btn;
  };

  // ----- Main Button Row -----
  createButton(t('FILL'), () => fillForm(profile));
  createButton(t('TRAIN'), () => runHeuristicTrainerSession(profile));
  createButton(t('REC'), () => macroEngine.startRecording());
  createButton(t('STOP'), () => macroEngine.stopRecording());

  // Macros button with panel
  macrosBtn = createButton(t('MACROS_MENU'), (e) => {
  e.stopPropagation();
  const vis = macroMenu.style.display === 'block';
  closeAllSubmenus(macroMenu);
  macroMenu.style.display = vis ? 'none' : 'block';
  if (!vis) updateMacroSubmenuContents(macroMenu);
  });

  // Theme button
  themeBtn = createButton(t('THEME_MENU'), (e) => {
  e.stopPropagation();
  const vis = themeMenu.style.display === 'block';
  closeAllSubmenus(themeMenu);
  themeMenu.style.display = vis ? 'none' : 'block';
  if (!vis) updateThemeSubmenu(themeMenu);
  });

  // Effects button
  effectsBtn = createButton(t('FX_MENU'), (e) => {
  e.stopPropagation();
  const vis = effectsMenu.style.display === 'block';
  closeAllSubmenus(effectsMenu);
  effectsMenu.style.display = vis ? 'none' : 'block';
  if (!vis) updateEffectsSubmenu(effectsMenu);
  });

  // Overlay button
  overlayBtn = createButton(t('OVERLAY'), () => {
  toggleOverlays();
  overlayBtn.style.background = overlayBtn.style.background ? '' : 'lightgreen';
  });
  if (data.showOverlays) overlayBtn.style.background = 'lightgreen';

  // Settings
  settingsBtn = createButton(t('SETTINGS'), () => toggleSettingsPanel(true));

  // Help
  helpBtn = createButton(t('HELP'), () => showHelp());

  // Logs
  createButton(t('LOGS'), () => toggleLogViewer(true));

  // Allowlist
  allowBtn = createButton(t('ALLOWLIST'), () => toggleAllowPanel(true));

  // Debug
  let debugEnabled = !!data.debugMode;
  debugBtn = createButton(t('DEBUG'), () => {
  debugEnabled = !debugEnabled;
  debugEnabled
    ? startMutationObserver(() => addDebugLog('mutation', 'dom', {}))
    : stopMutationObserver();
  saveDataToBackground('hermes_debug_mode_ext', debugEnabled);
  addDebugLog('debug_toggle', null, { enabled: debugEnabled });
  });

  // Learn Mode
  let learning = !!data.learningMode;
  learnBtn = createButton(t('LEARN'), () => {
  learning = !learning;
  saveDataToBackground('hermes_learning_state_ext', learning);
  addDebugLog('learning_toggle', null, { enabled: learning });
  });

  // Panel menu closers
  shadowRoot.addEventListener('click', () => closeAllSubmenus());
  container.addEventListener('click', e => e.stopPropagation()); // Prevent bubble up

  // --- Init theme/effects
  applyTheme(theme);
  if (data.effectsMode) setEffect(data.effectsMode);
  initOverlays(!!data.showOverlays);
  await macroEngine.init();
  if (settings.macro) macroEngine.updateSettings(settings.macro);

  // --- Allowlist minimized logic
  if (!isAllowed(location.hostname, data.whitelist || [])) {
  toggleMinimizedUI(true);
  }

  // Debug
  setupDebugControls();
  if (debugEnabled) startMutationObserver(() => addDebugLog('mutation', 'dom', {}));
  window.addEventListener('beforeunload', stopMutationObserver);

  // Help panel open state
  if (data.helpPanelOpen) showHelp();
}

// === Macro Submenu Contents ===
function updateMacroSubmenuContents(menu: HTMLElement) {
  const existing = menu.querySelector('input.hermes-macro-filter') as HTMLInputElement | null;
  const filter = existing?.value.toLowerCase() || '';
  menu.innerHTML = '';
  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = 'Search macros...';
  search.className = 'hermes-macro-filter';
  search.style.cssText = 'width:100%;margin-bottom:4px;';
  search.value = existing?.value || '';
  search.oninput = () => updateMacroSubmenuContents(menu);
  menu.appendChild(search);

  const allNames = macroEngine.list();
  const names = allNames.filter(n => n.toLowerCase().includes(filter));
  const createSubButton = (text: string, handler: (e: MouseEvent) => void) => {
  const btn = document.createElement('button');
  btn.className = 'hermes-button';
  btn.textContent = text;
  btn.onclick = handler;
  btn.style.width = 'auto';
  btn.style.textAlign = 'left';
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
    createModal(shadowRoot, 'confirm-delete-modal', `Delete "${name}"?`,
      '<p>This action cannot be undone.</p>', '300px',
      `<button id="confirm-delete-btn">Delete</button>`
    );
    const modal = shadowRoot.querySelector('#confirm-delete-modal-container') as HTMLElement;
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
  menu.innerHTML = `<div style="padding: 5px; color: var(--hermes-disabled-text);">${t('NO_MACROS')}</div>`;
  const msg = allNames.length ? 'No macros found.' : 'No macros recorded.';
  const div = document.createElement('div');
  div.style.cssText = 'padding:5px;color:var(--hermes-disabled-text);';
  div.textContent = msg;
  menu.appendChild(div);
  }
  const importBtn = createSubButton(t('IMPORT_MACROS'), () => importMacrosFromFile());
  menu.appendChild(importBtn);
  if (names.length) {
  const exportBtn = createSubButton(t('EXPORT_MACROS'), () => exportMacros());
  if (allNames.length) {
  const exportBtn = createSubButton('Export All Macros...', () => exportMacros());
  menu.appendChild(exportBtn);
  }
}

// === Macro Editor Panel ===
function toggleMacroEditor(show: boolean, macroName?: string) {
  const panelId = 'hermes-macro-editor';
  let panelContainer = shadowRoot.querySelector(`#${panelId}-container`) as HTMLElement;
  if (show && !panelContainer) {
  const contentHtml = `
    <select id="hermes-macro-edit-select" style="width:100%;margin-bottom:10px;"></select>
    <textarea id="hermes-macro-edit-text" style="width:100%;height:50vh;resize:vertical;font-family:monospace;padding:10px;box-sizing:border-box;"></textarea>
  `;
  const buttonsHtml = `<button id="hermes-macro-edit-save">Save Macro</button>`;
  panelContainer = createModal(shadowRoot, panelId, t('MACRO_EDITOR'), contentHtml, '700px', buttonsHtml);
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
    const errContainer = createModal(shadowRoot, 'json-error-modal', t('INVALID_JSON'), `<p>${e.message}</p>`, '300px', `<button id="err-ok-btn">${t('OK')}</button>`);
    errContainer.style.display = 'flex';
    (errContainer.querySelector('#err-ok-btn') as HTMLElement).onclick = () => errContainer.style.display = 'none';
    }
  };
  populate();
  }
  if (panelContainer) panelContainer.style.display = show ? 'flex' : 'none';
}

// === Theme and Effects Panels ===
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
    themeBtn.textContent = t('THEME_MENU');
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
  { mode: 'cube', name: 'Cube 3D' }
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
    if (opt.mode === 'snow') startSnowflakes();
    else if (opt.mode === 'laser') startLasers();
    else if (opt.mode === 'cube') startCube();
    else stopEffects();
    saveDataToBackground('hermes_effects_state_ext', opt.mode);
    menu.style.display = 'none';
  };
  menu.appendChild(btn);
  });
}

// === Allowlist Panel ===
async function createAllowPanel() {
  const list = await loadWhitelist();
  const html = `<input id="hermes-allow-input" style="width:70%"> <button id="hermes-allow-add">${t('ADD')}</button><ul id="hermes-allow-list"></ul>`;
  allowPanel = createModal(shadowRoot, 'hermes-allow-panel', t('ALLOWED_DOMAINS'), html, '400px');
  const input = allowPanel.querySelector('#hermes-allow-input') as HTMLInputElement;
  const addBtn = allowPanel.querySelector('#hermes-allow-add') as HTMLButtonElement;
  const listEl = allowPanel.querySelector('#hermes-allow-list') as HTMLUListElement;
  const render = (arr: string[]) => {
  listEl.innerHTML = '';
  arr.forEach(d => {
    const li = document.createElement('li');
    const del = document.createElement('button');
    del.textContent = 'X';
    del.onclick = async () => {
    const idx = arr.indexOf(d); if (idx >= 0) arr.splice(idx, 1); await saveWhitelist(arr); render(arr);
    };
    li.textContent = d + ' ';
    li.appendChild(del);
    listEl.appendChild(li);
  });
  };
  render(list);
  addBtn.onclick = async () => {
  if (input.value) { list.push(input.value.trim()); await saveWhitelist(list); input.value = ''; render(list); }
  };
}

function toggleAllowPanel(show: boolean) {
  if (!allowPanel && show) { createAllowPanel(); }
  if (allowPanel) allowPanel.style.display = show ? 'block' : 'none';
}

// === Macro Export/Import ===
function exportMacros() {
  const format = 'json';
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
    const errContainer = createModal(shadowRoot, 'import-error-modal', t('IMPORT_FAILED'), '<p>The selected file was not a valid Hermes macro file.</p>', '300px', `<button id="err-ok-btn">${t('OK')}</button>`);
    errContainer.style.display = 'flex';
    (errContainer.querySelector('#err-ok-btn') as HTMLElement).onclick = () => errContainer.style.display = 'none';
    }
  };
  reader.readAsText(file);
  };
  input.click();
}

// === Helper: Close All Menus ===
function closeAllSubmenus(except?: HTMLElement) {
  [macroMenu, themeMenu, effectsMenu].forEach(menu => {
  if (menu && menu !== except) menu.style.display = 'none';
  });
}

