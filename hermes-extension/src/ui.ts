// === Hermes UI Core - Merged ShadowDOM Edition ===

import { macroEngine, fillForm, getInitialData, saveDataToBackground, startSnowflakes, startLasers, startCube, stopEffects, setEffect, startLasersV14, startStrobeV14, startConfetti, startBubbles, startStrobe, getRoot } from './localCore.ts';
import { getSettings } from './settings.ts';
import { applyTheme } from './theme.ts';
import { loadSettings, toggleSettingsPanel } from './settings.ts';
import { setupUI, toggleMinimizedUI } from './ui/setup.ts';
import { createModal } from './ui/components.js';
import { configDiscovery, FormPattern, PlatformConfig } from './configDiscovery.ts';
import { isAllowed, loadWhitelist, saveWhitelist } from './allowlist.ts';
import { t } from '../i18n.js';
import { initializeBackendAPI } from './backendConfig.ts';
import { initHighContrast } from './highContrast.ts';
import { initNarrator } from './narrator.tsx';

// Lazy load heavy features
const lazyLoadTrainer = () => import('./trainer.ts').then(m => m.runHeuristicTrainerSession);
const lazyLoadHelp = () => import('./help.ts').then(m => m.showHelp);
const lazyLoadDebug = () => import('./debug.ts').then(m => ({
  setupDebugControls: m.setupDebugControls,
  toggleLogViewer: m.toggleLogViewer,
  addDebugLog: m.addDebugLog,
  startMutationObserver: m.startMutationObserver,
  stopMutationObserver: m.stopMutationObserver
}));
const lazyLoadOverlays = () => import('./overlays.ts').then(m => ({
  toggleOverlays: m.toggleOverlays,
  initOverlays: m.initOverlays
}));
const lazyLoadProductivity = () => import('./productivity.tsx').then(m => m.initAffirmations);
const lazyLoadScratchPad = () => import('./scratchPad.ts').then(m => ({
  initScratchPad: m.initScratchPad,
  toggleScratchPad: m.toggleScratchPad
}));
const lazyLoadSnippets = () => import('./snippets.ts').then(m => ({
  initSnippets: m.initSnippets,
  toggleSnippets: m.toggleSnippets
}));
const lazyLoadTasks = () => import('./tasks.ts').then(m => ({
  initTasks: m.initTasks,
  toggleTasks: m.toggleTasks
}));
const lazyLoadTimer = () => import('./timer.ts').then(m => m.toggleTimer);
const lazyLoadSchedule = () => import('./schedule.ts').then(m => ({
  initSchedule: m.initSchedule,
  toggleSchedule: m.toggleSchedule
}));
const lazyLoadSniffer = () => import('./sniffer.ts').then(m => m.sniffForms);
const lazyLoadProfile = () => import('./profile.ts').then(m => ({
  importProfileFromFile: m.importProfileFromFile,
  exportProfile: m.exportProfile
}));
const lazyLoadHotkeys = () => import('./hotkeys.ts').then(m => m.initHotkeys);

// Shadow DOM root globals
let shadowHost: HTMLDivElement;
let shadowRoot: ShadowRoot;

let profileData: Record<string, any> = {};

// Main UI elements
let macroMenu: HTMLDivElement;
let themeMenu: HTMLDivElement;
let effectsMenu: HTMLDivElement;
let themeBtn: HTMLButtonElement;
let effectsBtn: HTMLButtonElement;
let macrosBtn: HTMLButtonElement;
let allowBtn: HTMLButtonElement;
let helpBtn: HTMLButtonElement;
let tasksBtn: HTMLButtonElement;
let timerBtn: HTMLButtonElement;
let scheduleBtn: HTMLButtonElement;
let overlayBtn: HTMLButtonElement;
let settingsBtn: HTMLButtonElement;
let debugBtn: HTMLButtonElement;
let learnBtn: HTMLButtonElement;
let allowPanel: HTMLElement | null = null;
let currentEffect = 'none';

// === Main Hermes UI Init ===

export async function initUI() {
  const data = await getInitialData();
  profileData = data.profile || {};
  const theme = data.theme || 'dark';
  const settings = await loadSettings();

  // Initialize backend API connection to Recreated folder
  await initializeBackendAPI();
  initNarrator();

  // ----- SHADOW DOM SETUP -----
  shadowHost = document.createElement('div');
  shadowHost.id = 'hermes-shadow-host';
  document.body.appendChild(shadowHost);
  shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  await initHighContrast();

  // ----- UI ROOT -----
  const container = setupUI(undefined, data.dockMode || 'none', data.isBunched, data.uiPosition);
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
  createButton(t('FILL'), async () => {
    const settings = await getSettings();
    fillForm(profileData, settings);
  });
  createButton(t('TRAIN'), () => lazyLoadTrainer().then(m => m(profileData)));
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
    lazyLoadOverlays().then(m => m.toggleOverlays());
    overlayBtn.style.background = overlayBtn.style.background ? '' : 'lightgreen';
  });
  if (data.showOverlays) overlayBtn.style.background = 'lightgreen';

  // Settings
  settingsBtn = createButton(t('SETTINGS'), () => toggleSettingsPanel(true));

  // Help
  helpBtn = createButton(t('HELP'), () => lazyLoadHelp().then(m => m()));

  // Logs
  createButton(t('LOGS'), () => lazyLoadDebug().then(m => m.toggleLogViewer(true)));

  // Sniff forms
  createButton(t('SNIFF'), () => lazyLoadSniffer().then(m => m()));

  // Import/Export profile
  createButton(t('IMPORT_PROFILE'), () => lazyLoadProfile().then(m => m.importProfileFromFile().then(obj => {
    if (obj) profileData = obj;
  })));
  createButton(t('EXPORT_PROFILE'), () => lazyLoadProfile().then(m => m.exportProfile(profileData)));

  // Scratch pad
  createButton(t('SCRATCH_PAD'), () => lazyLoadScratchPad().then(m => m.toggleScratchPad(true)));

  // Snippets
  createButton(t('SNIPPETS'), () => lazyLoadSnippets().then(m => m.toggleSnippets(true)));

  // Tasks
  tasksBtn = createButton(t('TASKS'), () => lazyLoadTasks().then(m => m.toggleTasks(true)));

  // Pomodoro timer
  timerBtn = createButton(t('TIMER'), () => lazyLoadTimer().then(m => m(true)));

  // Schedule macros
  scheduleBtn = createButton(t('SCHEDULE'), () => lazyLoadSchedule().then(m => m.toggleSchedule(true)));

  // Allowlist
  allowBtn = createButton(t('ALLOWLIST'), () => toggleAllowPanel(true));

  // Backend Configuration
  createButton('BACKEND', () => {
    import('./backendSetup.ts').then(m => m.setupBackendWithAutoDetection().then(success => {
      if (success) {
        console.log('✅ Backend configured successfully');
      } else {
        console.log('⚠️ Backend configuration failed, check server is running');
      }
    }));
  });

  // Debug
  let debugEnabled = !!data.debugMode;
  debugBtn = createButton(t('DEBUG'), () => {
    debugEnabled = !debugEnabled;
    debugEnabled
      ? lazyLoadDebug().then(m => m.startMutationObserver(() => m.addDebugLog('mutation', 'dom', {})))
      : lazyLoadDebug().then(m => m.stopMutationObserver());
    saveDataToBackground('hermes_debug_mode_ext', debugEnabled);
    lazyLoadDebug().then(m => m.addDebugLog('debug_toggle', null, { enabled: debugEnabled }));
  });

  // Learn Mode
  let learning = !!data.learningMode;
  learnBtn = createButton(t('LEARN'), () => {
    learning = !learning;
    saveDataToBackground('hermes_learning_state_ext', learning);
    lazyLoadDebug().then(m => m.addDebugLog('learning_toggle', null, { enabled: learning }));
  });

  // Panel menu closers
  shadowRoot.addEventListener('click', () => closeAllSubmenus());
  container.addEventListener('click', e => e.stopPropagation()); // Prevent bubble up

  // --- Init theme/effects
  applyTheme(theme);
  if (data.effectsMode) setEffect(data.effectsMode);
  lazyLoadOverlays().then(m => m.initOverlays(!!data.showOverlays));
  lazyLoadProductivity().then(m => m(!!data.showAffirmations));
  lazyLoadTasks().then(m => m.initTasks());
  lazyLoadScratchPad().then(m => m.initScratchPad());
  lazyLoadSnippets().then(m => m.initSnippets());
  lazyLoadSchedule().then(m => m.initSchedule());
  await macroEngine.init();
  if (settings.macro) macroEngine.updateSettings(settings.macro);
  lazyLoadHotkeys().then(m => m());

  // --- Allowlist minimized logic
  if (!isAllowed(location.hostname, data.whitelist || [])) {
    toggleMinimizedUI(true);
  }

  // --- Config Discovery UI
  setupDiscoveryUI();

  // Debug
  lazyLoadDebug().then(m => m.setupDebugControls());
  if (debugEnabled) lazyLoadDebug().then(m => m.startMutationObserver(() => m.addDebugLog('mutation', 'dom', {})));
  lazyLoadDebug().then(m => {
    window.addEventListener('beforeunload', m.stopMutationObserver);
  });

  // Help panel open state
  if (data.helpPanelOpen) lazyLoadHelp().then(m => m());

  // First-run welcome modal
  checkFirstRun();
}

function checkFirstRun() {
  const FIRST_RUN_KEY = 'hermes_first_run_ext';
  getInitialData().then(data => {
    const isFirstRun = !data || data[FIRST_RUN_KEY] === undefined;
    if (isFirstRun) {
      showFirstRunModal();
      saveDataToBackground(FIRST_RUN_KEY, false);
    }
  });
}

function showFirstRunModal() {
  const root = getRoot();
  const modalId = 'hermes-first-run-modal';
  
  if (root instanceof ShadowRoot && root.querySelector(`#${modalId}`)) return;
  
  const contentHtml = `
    <p>Welcome to <strong>Hermes</strong>! Here's a quick overview:</p>
    <ul style="list-style:disc;padding-left:20px;margin:10px 0;">
      <li><strong>Fill</strong> - auto-fill forms using your profile</li>
      <li><strong>Train</strong> - improve field detection accuracy</li>
      <li><strong>Record/Stop</strong> - capture macros for automation</li>
      <li><strong>Play</strong> - replay saved macros</li>
      <li><strong>Settings</strong> - customize behavior and themes</li>
    </ul>
    <p>Drag the ☰ handle to move the toolbar anywhere on the page.</p>
    <p style="color:var(--hermes-secondary-text);font-size:0.9em;">This message will only appear once.</p>`;
  
  createModal(modalId, 'Hermes Quick Start', contentHtml, '450px');
  
  const modal = root instanceof ShadowRoot ? root.querySelector(`#${modalId}`) : document.querySelector(`#${modalId}`);
  if (modal && modal instanceof HTMLElement) {
    modal.style.display = 'block';
  }
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
    hr.style.cssText = 'border: none; border-top: 1px solid var(--herMES-border); margin: 5px 0;';
    menu.appendChild(hr);
  } else {
    const msg = allNames.length ? 'No macros found.' : 'No macros recorded.';
    const div = document.createElement('div');
    div.style.cssText = 'padding:5px;color:var(--hermes-disabled-text);';
    div.textContent = msg;
    menu.appendChild(div);
  }

  const importBtn = createSubButton(t('IMPORT_MACROS'), () => importMacrosFromFile());
  menu.appendChild(importBtn);

  if (names.length) {
    const exportBtn = createSubButton(t('EXPORT_MACROS'), () => exportMacrosToFile(names));
    menu.appendChild(exportBtn);
  }

  if (allNames.length) {
    const exportAllBtn = createSubButton(t('EXPORT_ALL_MACROS'), () => exportMacrosToFile());
    menu.appendChild(exportAllBtn);
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
    const buttonsHtml = `<button id="hermes-macro-edit-save">Save Macro</button><button id="hermes-macro-edit-add-wait">Add Wait</button>`;
    panelContainer = createModal(shadowRoot, panelId, t('MACRO_EDITOR'), contentHtml, '700px', buttonsHtml);
    const panel = panelContainer.querySelector(`#${panelId}`) as HTMLElement;
    const selectEl = panel.querySelector('#hermes-macro-edit-select') as HTMLSelectElement;
    const textArea = panel.querySelector('#hermes-macro-edit-text') as HTMLTextAreaElement;
    const saveBtn = panel.querySelector('#hermes-macro-edit-save') as HTMLButtonElement;
    const waitBtn = panel.querySelector('#hermes-macro-edit-add-wait') as HTMLButtonElement;

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

    waitBtn.onclick = () => {
      try {
        const arr = textArea.value ? JSON.parse(textArea.value) : [];
        arr.push({ type: 'wait', duration: 1000 });
        textArea.value = JSON.stringify(arr, null, 2);
      } catch (e) {
        alert('Invalid JSON in macro');
      }
    };
    populate();
  }
  if (panelContainer) panelContainer.style.display = show ? 'flex' : 'none';
}

// === Theme and Effects Panels ===
interface ThemeInfo {
  name: string;
  emoji: string;
}

async function updateThemeSubmenu(menu: HTMLElement) {
  menu.innerHTML = '';
  const data = await getInitialData();
  const allThemes: Record<string, ThemeInfo> = {
    ...(data.builtInThemes as Record<string, ThemeInfo> || {}),
    ...(data.customThemes as Record<string, ThemeInfo> || {})
  };
  Object.entries(allThemes).forEach(([key, opt]) => {
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
    { mode: 'strobe', name: 'Strobe' },
    { mode: 'laserV14', name: 'Lasers V14' },
    { mode: 'strobeV14', name: 'Strobe V14' },
    { mode: 'confetti', name: 'Confetti' },
    { mode: 'bubbles', name: 'Bubbles' },
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
      else if (opt.mode === 'strobe') startStrobe();
      else if (opt.mode === 'laserV14') startLasersV14();
      else if (opt.mode === 'strobeV14') startStrobeV14();
      else if (opt.mode === 'confetti') startConfetti();
      else if (opt.mode === 'bubbles') startBubbles();
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
function exportMacrosToFile(names?: string[]) {
  const format = 'json';
  const data = macroEngine.exportMacros(format, names);
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

// === Config Discovery UI ===
function setupDiscoveryUI() {
  // Discovery button
  const discoveryButton = document.createElement('button');
  discoveryButton.id = 'hermes-discovery-button';
  discoveryButton.className = 'hermes-button';
  discoveryButton.innerHTML = '🔍 Discovery';
  discoveryButton.title = 'Start/Stop Config Discovery';
  discoveryButton.onclick = () => toggleDiscoveryPanel();
  shadowRoot.appendChild(discoveryButton);

  // Discovery status indicator
  const discoveryStatus = document.createElement('div');
  discoveryStatus.id = 'hermes-discovery-status';
  discoveryStatus.style.cssText = 'font-size:10px;color:var(--hermes-disabled-text);text-align:center;margin-top:2px;';
  discoveryStatus.textContent = 'Discovery Ready';
  shadowRoot.appendChild(discoveryStatus);

  updateDiscoveryStatus();
}

function updateDiscoveryStatus() {
  const status = document.getElementById('hermes-discovery-status');
  if (!status) return;

  if (configDiscovery.isDiscoveryActive()) {
    status.textContent = '🔍 Discovering...';
    status.style.color = 'var(--hermes-success-text)';
  } else {
    status.textContent = 'Discovery Ready';
    status.style.color = 'var(--hermes-disabled-text)';
  }
}

function toggleDiscoveryPanel() {
  const panelId = 'hermes-discovery-panel';
  let panel = shadowRoot?.querySelector(`#${panelId}-container`) as HTMLElement;

  if (!panel) {
    const contentHtml = `
      <div id="hermes-discovery-controls">
        <button id="hermes-start-discovery" class="hermes-button" style="background:var(--hermes-success-text);color:var(--hermes-panel-bg);">Start Discovery</button>
        <button id="hermes-stop-discovery" class="hermes-button" style="background:var(--hermes-error-text);color:var(--hermes-panel-bg);display:none;">Stop Discovery</button>
      </div>
      <div id="hermes-discovery-info" style="margin-top:10px;padding:10px;background:var(--hermes-panel-bg-secondary);border-radius:4px;">
        <h4>Platform Detection</h4>
        <div id="hermes-platform-info">Analyzing page...</div>
      </div>
      <div id="hermes-discovery-results" style="margin-top:10px;">
        <h4>Discovered Patterns</h4>
        <div id="hermes-patterns-list">No patterns discovered yet.</div>
      </div>
    `;
    
    panel = createModal(shadowRoot!, panelId, 'Config Discovery', contentHtml, '600px');
    
    const startBtn = panel.querySelector('#hermes-start-discovery') as HTMLButtonElement;
    const stopBtn = panel.querySelector('#hermes-stop-discovery') as HTMLButtonElement;
    
    startBtn.onclick = async () => {
      const domain = window.location.hostname;
      await configDiscovery.startDiscovery(domain);
      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';
      updateDiscoveryStatus();
      updateDiscoveryInfo();
      updateDiscoveryResults();
    };
    
    stopBtn.onclick = async () => {
      const config = await configDiscovery.stopDiscovery();
      startBtn.style.display = 'inline-block';
      stopBtn.style.display = 'none';
      updateDiscoveryStatus();
      updateDiscoveryInfo();
      updateDiscoveryResults();
      
      if (config) {
        showDiscoverySuccess(config);
      }
    };
  }

  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    if (panel.style.display === 'flex') {
      updateDiscoveryInfo();
      updateDiscoveryResults();
    }
  }
}

function updateDiscoveryInfo() {
  const infoDiv = document.getElementById('hermes-platform-info');
  if (!infoDiv) return;

  const session = configDiscovery.getCurrentSession();
  if (session) {
    const platform = detectPlatform();
    const hints = session.metadata.platformHints;
    
    infoDiv.innerHTML = `
      <p><strong>Domain:</strong> ${session.domain}</p>
      <p><strong>Platform:</strong> ${platform}</p>
      <p><strong>Forms Found:</strong> ${session.metadata.formsCount}</p>
      <p><strong>Fields Found:</strong> ${session.metadata.fieldsCount}</p>
      <p><strong>Hints:</strong> ${hints.join(', ') || 'None detected'}</p>
    `;
  } else {
    infoDiv.innerHTML = '<p>No active discovery session.</p>';
  }
}

function updateDiscoveryResults() {
  const resultsDiv = document.getElementById('hermes-patterns-list');
  if (!resultsDiv) return;

  const patterns = configDiscovery.getDiscoveredPatterns();
  
  if (patterns.length === 0) {
    resultsDiv.innerHTML = '<p>No patterns discovered yet.</p>';
    return;
  }

  resultsDiv.innerHTML = patterns.map(pattern => {
    const largeTextFields = pattern.fields.filter(f => f.isLargeText);
    const workNotesFields = pattern.fields.filter(f => f.textAreaConfig?.template === 'work_notes');
    const notesFields = pattern.fields.filter(f => f.textAreaConfig?.template === 'notes');
    
    return `
      <div style="margin-bottom:10px;padding:10px;border:1px solid var(--hermes-panel-border);border-radius:4px;">
        <h5>${pattern.name}</h5>
        <p><strong>Confidence:</strong> ${Math.round(pattern.confidence * 100)}%</p>
        <p><strong>Fields:</strong> ${pattern.fields.length}</p>
        ${largeTextFields.length > 0 ? `<p><strong>Large Text Areas:</strong> ${largeTextFields.length}</p>` : ''}
        ${workNotesFields.length > 0 ? `<p><strong>Work Notes Fields:</strong> ${workNotesFields.length}</p>` : ''}
        ${notesFields.length > 0 ? `<p><strong>Notes Fields:</strong> ${notesFields.length}</p>` : ''}
        <details>
          <summary>Field Details</summary>
          <ul style="margin-top:5px;">
            ${pattern.fields.map(field => {
              let fieldInfo = `${field.label || field.name} (${field.type}) - ${Math.round(field.confidence * 100)}%`;
              if (field.isLargeText) {
                fieldInfo += ' 📝';
                if (field.textAreaConfig?.template) {
                  fieldInfo += ` [${field.textAreaConfig.template}]`;
                }
              }
              return `<li>${fieldInfo}</li>`;
            }).join('')}
          </ul>
        </details>
      </div>
    `;
  }).join('');
}

function showDiscoverySuccess(config: PlatformConfig) {
  const successHtml = `
    <div style="text-align:center;padding:20px;">
      <h3>✅ Discovery Complete!</h3>
      <p><strong>Platform:</strong> ${config.platform}</p>
      <p><strong>Patterns Found:</strong> ${config.patterns.length}</p>
      <p><strong>Macros Generated:</strong> ${config.macros.length}</p>
      <p>Config has been saved and is ready for use!</p>
    </div>
  `;
  
  const successModal = createModal(shadowRoot!, 'hermes-discovery-success', 'Discovery Success', successHtml, '400px');
  successModal.style.display = 'flex';
  
  // Auto-close after 3 seconds
  setTimeout(() => {
    successModal.style.display = 'none';
  }, 3000);
}

function detectPlatform(): string {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  
  if (url.includes('servicenow') || title.includes('service now')) return 'ServiceNow';
  if (url.includes('remedy') || title.includes('bmc remedy')) return 'BMC Remedy';
  if (url.includes('salesforce') || title.includes('salesforce')) return 'Salesforce';
  if (url.includes('jira') || title.includes('jira')) return 'Jira';
  if (url.includes('zendesk') || title.includes('zendesk')) return 'Zendesk';
  if (url.includes('freshdesk') || title.includes('freshdesk')) return 'Freshdesk';
  
  return 'Unknown Platform';
}