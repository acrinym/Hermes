import { saveDataToBackground, getInitialData } from './storage/index.ts';
import { createModal } from './ui/components.js';
import { updateMacroSettings } from './macros.ts';
import { defaultSettings } from './defaultSettings.ts';
import { refreshHotkeys } from "./hotkeys.ts";

export interface Settings {
  [key: string]: any;
}

let currentSettings: Settings = {};
let settingsPanel: HTMLElement | null = null;

export function getSettings(): Settings {
  return currentSettings;
}

export async function loadSettings(): Promise<Settings> {
  const data = await getInitialData();
  currentSettings = { ...defaultSettings, ...(data.settings || {}) };
  return currentSettings;
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  try {
    await saveDataToBackground('hermes_settings_v1_ext', settings);
    currentSettings = settings;
    return true;
  } catch (e) {
    console.error('Hermes: Failed to save settings', e);
    return false;
  }
}

function populatePanel() {
  if (!settingsPanel) return;
  const textarea = settingsPanel.querySelector('#hermes-settings-json') as HTMLTextAreaElement | null;
  const useCoords = settingsPanel.querySelector('#hermes-setting-useCoords') as HTMLInputElement | null;
  const recordMouse = settingsPanel.querySelector('#hermes-setting-recordMouse') as HTMLInputElement | null;
  const relativeCoords = settingsPanel.querySelector('#hermes-setting-relativeCoords') as HTMLInputElement | null;
  const simSlider = settingsPanel.querySelector('#hermes-setting-similarity') as HTMLInputElement | null;
  const simValue = settingsPanel.querySelector('#hermes-sim-value') as HTMLElement | null;
  const recordKey = settingsPanel.querySelector('#hermes-setting-recordHotkey') as HTMLInputElement | null;
  const playKey = settingsPanel.querySelector('#hermes-setting-playHotkey') as HTMLInputElement | null;
  if (textarea) textarea.value = JSON.stringify(currentSettings, null, 2);
  if (useCoords) useCoords.checked = !!currentSettings?.macro?.useCoordinateFallback;
  if (recordMouse) recordMouse.checked = !!currentSettings?.macro?.recordMouseMoves;
  if (relativeCoords) relativeCoords.checked = !!currentSettings?.macro?.relativeCoordinates;
  if (simSlider) {
    simSlider.value = String(currentSettings?.macro?.similarityThreshold ?? 0.5);
    if (simValue) simValue.textContent = simSlider.value;
  }
  if (recordKey) recordKey.value = currentSettings.recordHotkey || '';
  if (playKey) playKey.value = currentSettings.playMacroHotkey || '';
}

export function createSettingsPanel(): HTMLElement {
  if (settingsPanel) return settingsPanel;

  const contentHtml = `
    <textarea id="hermes-settings-json" style="width:100%;height:40vh;min-height:200px;resize:vertical;font-family:monospace;padding:10px;box-sizing:border-box;"></textarea>
    <div style="margin-top:10px;">
      <label><input type="checkbox" id="hermes-setting-useCoords"> Use coordinate fallback</label><br>
      <label><input type="checkbox" id="hermes-setting-recordMouse"> Record mouse movements</label><br>
      <label><input type="checkbox" id="hermes-setting-relativeCoords"> Track element movement</label><br>
      <label>Similarity Threshold: <input type="range" id="hermes-setting-similarity" min="0" max="1" step="0.05" style="width:150px;"><span id="hermes-sim-value"></span></label>
      <label>Record Hotkey: <input type="text" id="hermes-setting-recordHotkey" style="width:120px;"></label><br>
      <label>Play Hotkey: <input type="text" id="hermes-setting-playHotkey" style="width:120px;"></label>
    </div>`;
  const buttonsHtml = `
    <button id="hermes-settings-save-btn">Save & Apply</button>
    <button id="hermes-settings-defaults-btn">Load Defaults</button>`;

  settingsPanel = createModal(document.body as any, 'hermes-settings-panel', 'Hermes Settings', contentHtml, '750px', buttonsHtml);

  const textarea = settingsPanel.querySelector('#hermes-settings-json') as HTMLTextAreaElement;
  const useCoords = settingsPanel.querySelector('#hermes-setting-useCoords') as HTMLInputElement;
  const recordMouse = settingsPanel.querySelector('#hermes-setting-recordMouse') as HTMLInputElement;
  const relativeCoords = settingsPanel.querySelector('#hermes-setting-relativeCoords') as HTMLInputElement;
  const simSlider = settingsPanel.querySelector('#hermes-setting-similarity') as HTMLInputElement;
  const simValue = settingsPanel.querySelector('#hermes-sim-value') as HTMLElement;
  const recordKey = settingsPanel.querySelector('#hermes-setting-recordHotkey') as HTMLInputElement;
  const playKey = settingsPanel.querySelector('#hermes-setting-playHotkey') as HTMLInputElement;

  if (simSlider) simSlider.oninput = () => {
    if (simValue) simValue.textContent = simSlider.value;
  };

  settingsPanel.querySelector('#hermes-settings-save-btn')?.addEventListener('click', async () => {
    try {
      const newSettings = JSON.parse(textarea.value);
      newSettings.macro = newSettings.macro || {};
      newSettings.macro.useCoordinateFallback = useCoords.checked;
      newSettings.macro.recordMouseMoves = recordMouse.checked;
      newSettings.macro.relativeCoordinates = relativeCoords.checked;
      newSettings.macro.similarityThreshold = parseFloat(simSlider.value);
      newSettings.recordHotkey = recordKey.value.trim();
      newSettings.playMacroHotkey = playKey.value.trim();
      const ok = await saveSettings(newSettings);
      updateMacroSettings(newSettings.macro);
      refreshHotkeys();
      alert(ok ? 'Settings saved' : 'Failed to save settings');
    } catch (err: any) {
      alert('Invalid JSON: ' + err.message);
    }
  });

  settingsPanel.querySelector('#hermes-settings-defaults-btn')?.addEventListener('click', () => {
    textarea.value = JSON.stringify(defaultSettings, null, 2);
    useCoords.checked = !!defaultSettings?.macro?.useCoordinateFallback;
    recordMouse.checked = !!defaultSettings?.macro?.recordMouseMoves;
    relativeCoords.checked = !!defaultSettings?.macro?.relativeCoordinates;
    simSlider.value = String(defaultSettings?.macro?.similarityThreshold ?? 0.5);
    if (simValue) simValue.textContent = simSlider.value;
    recordKey.value = defaultSettings.recordHotkey;
    playKey.value = defaultSettings.playMacroHotkey;
  });

  populatePanel();
  return settingsPanel;
}

export function toggleSettingsPanel(show: boolean) {
  if (!settingsPanel && show) settingsPanel = createSettingsPanel();
  if (!settingsPanel) return;
  if (show) {
    populatePanel();
    settingsPanel.style.display = 'block';
  } else {
    settingsPanel.style.display = 'none';
  }
}

export { defaultSettings };
