// Local core functionality - optimized for the extension
// This avoids dependencies on the external core package

export interface ProfileData {
  [key: string]: string;
}

export interface MatchResult {
  key: string | null;
  score: number;
  reason: string;
}

export interface SkippedField {
  field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  label: string;
  guess: string | null;
  score: number;
  reason: string;
}

export interface FormFillSettings {
  collectSkipped?: boolean;
  overwriteExisting?: boolean;
  logSkipped?: boolean;
}

// Advanced state management
export interface HermesState {
  showOverlays: boolean;
  learningMode: boolean;
  debugMode: boolean;
  isRecording: boolean;
  recordedEvents: any[];
  currentMacroName: string;
  debugLogs: any[];
  profileData: ProfileData;
  macros: Record<string, any[]>;
  tasks: any[];
  selectedMacroName: string;
  customMappings: Record<string, string>;
  skippedFields: SkippedField[];
  fieldSelectMode: boolean;
  isMinimized: boolean;
  theme: string;
  isBunched: boolean;
  effectsMode: string;
  dockMode: string;
  notesText: string;
  pomodoroSettings: { work: number; break: number };
  pomodoroRemaining: number;
  pomodoroMode: 'work' | 'break';
  scheduleSettings: any;
  activeRequests: number;
}

// Complete theme system
export const themeOptions = {
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
  brick: { name: 'Brick', emoji: '🧱' },
  sunset: { name: 'Sunset', emoji: '🌇' },
  forest: { name: 'Forest', emoji: '🌳' },
  neon: { name: 'Neon', emoji: '💡' }
};

// Button properties for UI
export const hermesButtonProperties = {
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
  scheduleButton: { emoji: '⏰', text: 'Schedule', bunchedText: 'Sch', title: 'Schedule macro execution' },
  settingsButton: { emoji: '⚙️', text: 'Settings', bunchedText: 'Set', title: 'Configure Hermes settings' },
  tasksButton: { emoji: '🗒️', text: 'Tasks', bunchedText: 'Tsk', title: 'Manage task list' },
  notesButton: { emoji: '📔', text: 'Notes', bunchedText: 'Note', title: 'Open quick notes' },
  timerButton: { emoji: '⏱️', text: 'Timer', bunchedText: 'Tm', title: 'Pomodoro timer' }
};

// Heuristics functions
const stopWords = ['name','first','last','middle','email','phone','address','street','city','state','zip','code','country'];

export function isStopWord(token: string): boolean {
  return stopWords.includes(token.toLowerCase());
}

export function tokenSimilarity(a: string, b: string): number {
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

export function getAssociatedLabelText(field: Element): string {
  const el = field as HTMLElement;
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) return (label.textContent || '').trim();
  }
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    const label = parent.querySelector('label');
    if (label) {
      if ((label as HTMLLabelElement).htmlFor === el.id) return (label.textContent || '').trim();
      if (!label.getAttribute('for') && label.contains(el)) return (label.textContent || '').trim();
      if (label === parent.firstElementChild && el === parent.children[1]) return (label.textContent || '').trim();
    }
    parent = parent.parentElement;
  }
  return '';
}

export function getRobustSelector(element: Element): string {
  if (element.id) return `#${element.id}`;
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) return `.${classes.join('.')}`;
  }
  return element.tagName.toLowerCase();
}

export function getElementIndexPath(element: Element): string {
  const path: string[] = [];
  let current = element;
  while (current && current !== document.body) {
    const index = Array.from(current.parentElement?.children || []).indexOf(current);
    path.unshift(`${current.tagName.toLowerCase()}:nth-child(${index + 1})`);
    current = current.parentElement!;
  }
  return path.join(' > ');
}

export function matchProfileKey(profile: ProfileData, field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): MatchResult {
  let bestKey: string | null = null;
  let bestScore = 0;
  const fieldName = (field.name || field.id || '').toLowerCase();
  const labelText = getAssociatedLabelText(field).toLowerCase();
  const combinedText = `${fieldName} ${labelText}`.trim();
  const tokens = combinedText.split(/\s+/).filter(t => t && !isStopWord(t));

  for (const key in profile) {
    const profileTokens = key.toLowerCase().split(/\s+/);
    let score = 0;
    tokens.forEach(t => {
      profileTokens.forEach(pt => {
        score += tokenSimilarity(t, pt);
      });
    });
    score /= Math.max(tokens.length, profileTokens.length) || 1;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return { key: bestScore >= 0.3 ? bestKey : null, score: bestScore, reason: '' };
}

// Form filler function
export async function fillForm(profile: ProfileData, settings: FormFillSettings): Promise<SkippedField[]> {
  const skipped: SkippedField[] = [];
  const collectSkipped = settings.collectSkipped ?? false;
  const overwriteExisting = settings.overwriteExisting ?? true;
  const logSkipped = settings.logSkipped ?? false;

  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');

  fields.forEach(field => {
    const fieldType = (field as HTMLInputElement).type
      ? (field as HTMLInputElement).type.toLowerCase()
      : (field.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text');

    const match = matchProfileKey(profile, field);
    const key = match.key;

    if (key && profile[key] !== undefined) {
      if (!overwriteExisting && (field as HTMLInputElement).value) return;

      if (fieldType === 'checkbox') {
        (field as HTMLInputElement).checked =
          profile[key].toLowerCase() === 'true' ||
          profile[key] === (field as HTMLInputElement).value;
      } else if (fieldType === 'radio') {
        if ((field as HTMLInputElement).value === profile[key]) {
          (field as HTMLInputElement).checked = true;
        }
      } else {
        (field as HTMLInputElement).value = profile[key];
      }

      field.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (collectSkipped) {
      const label = getAssociatedLabelText(field) || field.name || field.id || 'field';
      const skipData = {
        field,
        label,
        guess: key,
        score: match.score,
        reason: match.reason
      };
      skipped.push(skipData);
      if (logSkipped) console.warn('[formFiller] Skipped:', skipData);
    }
  });

  return skipped;
}

// Storage functions
export function saveDataToBackground(storageKey: string, data: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'SAVE_HERMES_DATA', payload: { key: storageKey, value: data } },
      (response: any) => {
        if (chrome.runtime.lastError) {
          console.error(`Hermes CS: Error saving ${storageKey}:`, chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
          return;
        }
        if (response && response.success) {
          console.log(`Hermes CS: Data for ${storageKey} saved via background.`);
          resolve(true);
        } else {
          const errorMsg = response ? response.error : `Unknown error saving ${storageKey}`;
          console.error(`Hermes CS: Error saving ${storageKey} via background:`, errorMsg);
          reject(errorMsg);
        }
      }
    );
  });
}

export function getInitialData(): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_HERMES_INITIAL_DATA' }, resolve);
  });
}

// Root functions
let uiRoot: ShadowRoot | Document = document;

export function setRoot(root: ShadowRoot | Document) {
  uiRoot = root;
}

export function getRoot(): ShadowRoot | Document {
  return uiRoot;
}

// Advanced effects system
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let flakes: { x: number; y: number; r: number; s: number }[] = [];
let lasers: { x: number; y: number; len: number; s: number }[] = [];
let confettiPieces: { x: number; y: number; vx: number; vy: number; color: string; size: number }[] = [];
let bubbles: { x: number; y: number; r: number; vx: number; vy: number }[] = [];
let strobeState = { phase: 0, opacity: 0 };
let running = false;
let mode: 'none' | 'snow' | 'lasers' | 'cube' | 'confetti' | 'bubbles' | 'strobe' = 'none';

function initCanvas() {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483640';
    
    const root = getRoot();
    if (root instanceof ShadowRoot) {
      root.appendChild(canvas);
    } else {
      document.body.appendChild(canvas);
    }

    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function startSnowflakes() {
  initCanvas();
  flakes = [];
  for (let i = 0; i < 50; i++) {
    flakes.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 2 + Math.random() * 3,
      s: 1 + Math.random()
    });
  }
  if (!running) {
    running = true;
    loop();
  }
  mode = 'snow';
}

export function startLasers() {
  initCanvas();
  lasers = [];
  if (!running) { running = true; loop(); }
  mode = 'lasers';
}

export function startConfetti() {
  initCanvas();
  confettiPieces = [];
  for (let i = 0; i < 100; i++) {
    confettiPieces.push({
      x: Math.random() * window.innerWidth,
      y: -10,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3 + 2,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      size: Math.random() * 5 + 2
    });
  }
  if (!running) { running = true; loop(); }
  mode = 'confetti';
}

export function startBubbles() {
  initCanvas();
  bubbles = [];
  for (let i = 0; i < 20; i++) {
    bubbles.push({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 10,
      r: Math.random() * 20 + 10,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2 - 1
    });
  }
  if (!running) { running = true; loop(); }
  mode = 'bubbles';
}

export function startStrobe() {
  initCanvas();
  strobeState = { phase: 0, opacity: 0 };
  if (!running) { running = true; loop(); }
  mode = 'strobe';
}

export function stopEffects() {
  running = false;
  lasers = [];
  flakes = [];
  confettiPieces = [];
  bubbles = [];
  if (canvas) canvas.style.display = 'none';
  mode = 'none';
}

export function setEffect(newMode: 'none' | 'snow' | 'lasers' | 'cube' | 'confetti' | 'bubbles' | 'strobe') {
  if (newMode === 'none') { stopEffects(); return; }
  if (newMode === 'snow') { startSnowflakes(); return; }
  if (newMode === 'lasers') { startLasers(); return; }
  if (newMode === 'cube') { startLasers(); return; } // Simplified cube effect
  if (newMode === 'confetti') { startConfetti(); return; }
  if (newMode === 'bubbles') { startBubbles(); return; }
  if (newMode === 'strobe') { startStrobe(); return; }
}

export function getEffect() {
  return mode;
}

// Pomodoro timer system
let pomodoroInterval: number | null = null;
let pomodoroRemaining = 0;
let pomodoroMode: 'work' | 'break' = 'work';
let pomodoroSettings = { work: 25, break: 5 };

export function updatePomodoroDisplay(el: HTMLElement) {
  if (!el) return;
  const m = String(Math.floor(pomodoroRemaining / 60)).padStart(2, '0');
  const s = String(pomodoroRemaining % 60).padStart(2, '0');
  el.textContent = `${m}:${s}`;
}

export function startPomodoro(display: HTMLElement) {
  if (pomodoroInterval) return;
  if (pomodoroRemaining <= 0) {
    pomodoroMode = 'work';
    pomodoroRemaining = (pomodoroSettings.work || 25) * 60;
  }
  updatePomodoroDisplay(display);
  pomodoroInterval = window.setInterval(() => {
    pomodoroRemaining--;
    if (pomodoroRemaining <= 0) {
      if (pomodoroMode === 'work') {
        pomodoroMode = 'break';
        pomodoroRemaining = (pomodoroSettings.break || 5) * 60;
        alert('Break time!');
      } else {
        pomodoroMode = 'work';
        pomodoroRemaining = (pomodoroSettings.work || 25) * 60;
        alert('Back to work!');
      }
    }
    updatePomodoroDisplay(display);
  }, 1000);
}

export function stopPomodoro() {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
  }
}

// Tasks system
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  created: number;
}

export class TaskManager {
  private tasks: Task[] = [];

  async load() {
    const data = await getInitialData();
    this.tasks = data.tasks || [];
  }

  async add(text: string) {
    const task: Task = {
      id: Date.now().toString(),
      text,
      completed: false,
      created: Date.now()
    };
    this.tasks.push(task);
    await saveDataToBackground('hermes_tasks_ext', this.tasks);
    return task;
  }

  async toggle(id: string) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      await saveDataToBackground('hermes_tasks_ext', this.tasks);
    }
  }

  async delete(id: string) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    await saveDataToBackground('hermes_tasks_ext', this.tasks);
  }

  getAll() { return [...this.tasks]; }
  getActive() { return this.tasks.filter(t => !t.completed); }
  getCompleted() { return this.tasks.filter(t => t.completed); }
}

export const taskManager = new TaskManager();

// Notes system
export class NotesManager {
  private notes = '';

  async load() {
    const data = await getInitialData();
    this.notes = data.notes || '';
  }

  async save(text: string) {
    this.notes = text;
    await saveDataToBackground('hermes_notes_ext', this.notes);
  }

  get() { return this.notes; }
}

export const notesManager = new NotesManager();

// Scheduling system
export interface ScheduleSettings {
  selected: string[];
  date: string;
  time: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
}

export class ScheduleManager {
  private settings: ScheduleSettings = {
    selected: [],
    date: '',
    time: '',
    recurrence: 'once'
  };

  async load() {
    const data = await getInitialData();
    this.settings = data.scheduleSettings || this.settings;
  }

  async save(settings: ScheduleSettings) {
    this.settings = settings;
    await saveDataToBackground('hermes_schedule_settings_ext', this.settings);
  }

  async scheduleMacros(macroIds: string[], date: string, time: string, recurrence: string) {
    // This would integrate with your backend API
    console.log('Scheduling macros:', { macroIds, date, time, recurrence });
    // For now, just save the settings
    await this.save({ selected: macroIds, date, time, recurrence: recurrence as any });
  }

  get() { return { ...this.settings }; }
}

export const scheduleManager = new ScheduleManager();

// Debug functions
export function addDebugLog(type: string, target: string | null = null, details: any = {}): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
  const payload = { timestamp: Date.now(), type, target, details };
  chrome.runtime.sendMessage({ type: 'ADD_DEBUG_LOG', payload });
}

export function getDebugLogs(): Promise<any[]> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_DEBUG_LOGS' }, (res: any) => {
      resolve((res && res.logs) || []);
    });
  });
}

export function clearDebugLogs(): Promise<void> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'CLEAR_DEBUG_LOGS' }, () => resolve());
  });
}

let mutationObs: MutationObserver | null = null;
export function startMutationObserver(callback: () => void): void {
  if (mutationObs) mutationObs.disconnect();
  mutationObs = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
        for (const node of Array.from(m.addedNodes).concat(Array.from(m.removedNodes))) {
          if (node.nodeType === 1 && (node instanceof HTMLElement) &&
            (node.matches('form, input, select, textarea') || node.querySelector('form, input, select, textarea')) ) {
            callback();
            return;
          }
        }
      }
    }
  });
  const observe = () => {
    if (document.body) {
      mutationObs!.observe(document.body, { childList: true, subtree: true });
    }
  };
  if (document.body) observe();
  else document.addEventListener('DOMContentLoaded', observe);
}

export function stopMutationObserver(): void {
  if (mutationObs) mutationObs.disconnect();
}

let logPanel: HTMLElement | null = null;
function createLogViewer(): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'hermes-log-viewer';
  panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);width:90%;max-width:600px;max-height:70vh;background:var(--hermes-panel-bg);border:1px solid var(--hermes-panel-border);color:var(--hermes-panel-text);padding:10px;z-index:2147483647;overflow:auto;font-family:sans-serif';
  panel.innerHTML = `<h2 style="margin-top:0">Hermes Logs</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th>Time</th><th>Type</th><th>Target</th><th>Details</th></tr></thead><tbody id="hermes-log-body"></tbody></table><div style="margin-top:10px;text-align:right"><button id="hermes-log-clear" class="hermes-button">Clear</button> <button id="hermes-log-close" class="hermes-button">Close</button></div>`;
  document.body.appendChild(panel);
  panel.querySelector('#hermes-log-close')!.addEventListener('click', () => panel.style.display = 'none');
  panel.querySelector('#hermes-log-clear')!.addEventListener('click', async () => { await clearDebugLogs(); await populateLogViewer(); });
  return panel;
}

async function populateLogViewer() {
  if (!logPanel) return;
  const body = logPanel.querySelector('#hermes-log-body') as HTMLElement;
  if (!body) return;
  body.innerHTML = '';
  const logs = await getDebugLogs();
  if (!logs.length) {
    body.innerHTML = `<tr><td colspan="4" style="text-align:center">No logs</td></tr>`;
    return;
  }
  for (const log of logs) {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--hermes-panel-border)';
    row.innerHTML = `<td style="padding:4px">${new Date(log.timestamp).toLocaleTimeString()}</td><td style="padding:4px">${log.type}</td><td style="padding:4px">${log.target || ''}</td><td style="padding:4px;word-break:break-all"><pre style="margin:0;font-family:monospace">${JSON.stringify(log.details, null, 2)}</pre></td>`;
    body.appendChild(row);
  }
}

export async function toggleLogViewer(show: boolean) {
  if (show && !logPanel) {
    logPanel = createLogViewer();
  }
  if (logPanel) {
    if (show) {
      await populateLogViewer();
      logPanel.style.display = 'block';
    } else {
      logPanel.style.display = 'none';
    }
  }
}

export function setupDebugControls() {
  (window as any).hermesDebug = {
    addLog: addDebugLog,
    getLogs: getDebugLogs,
    clearLogs: clearDebugLogs,
    startObserver: startMutationObserver,
    stopObserver: stopMutationObserver,
    showLogs: () => toggleLogViewer(true)
  };
}

// Translation functions
export function t(key: string): string {
  return key; // Simplified translation
}

export function setTranslationFunction(translator: (key: string) => string) {
  // Store translation function
}

// Cube effect (simplified)
export function startCube() {
  startLasers(); // Use lasers as cube effect for now
}

// Analysis sniffer
export function analyzeForms() {
  const forms = document.querySelectorAll('form');
  const formData = Array.from(forms).map((form, index) => {
    const fields = form.querySelectorAll('input, select, textarea');
    return {
      formIndex: index,
      action: form.action || 'N/A',
      method: form.method || 'N/A',
      fields: Array.from(fields).map(field => ({
        tag: field.tagName,
        type: (field as HTMLInputElement).type || 'N/A',
        name: (field as HTMLInputElement).name || 'N/A',
        id: field.id || 'N/A',
        label: getAssociatedLabelText(field) || 'N/A',
        selector: getRobustSelector(field)
      }))
    };
  });
  console.log('Hermes: Form Elements Sniffed:', formData);
  addDebugLog('sniff', 'forms', formData);
  return formData;
}

// Import/Export system
export function exportProfile(profile: ProfileData): string {
  return JSON.stringify(profile, null, 2);
}

export function importProfile(jsonData: string): ProfileData {
  try {
    return JSON.parse(jsonData);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

// Macro engine (enhanced)
export class MacroEngine {
  private macros: Record<string, any[]> = {};
  private recording = false;
  private events: any[] = [];

  async init() {
    // Load macros from storage
    const data = await getInitialData();
    this.macros = data.macros || {};
  }

  startRecording() {
    this.recording = true;
    this.events = [];
    console.log('Hermes: Started recording macro');
  }

  stopRecording() {
    this.recording = false;
    console.log('Hermes: Stopped recording macro');
  }

  play(name: string, instant = false) {
    const macro = this.macros[name];
    if (macro) {
      console.log(`Hermes: Playing macro ${name} (instant: ${instant})`);
      // Enhanced playback with proper event simulation
      this.executeMacro(macro, instant);
    }
  }

  private async executeMacro(macro: any[], instant: boolean) {
    for (const event of macro) {
      if (!instant) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const element = document.querySelector(event.selector);
      if (!element) continue;

      switch (event.type) {
        case 'click':
          element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          break;
        case 'input':
          (element as HTMLInputElement).value = event.value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        case 'keydown':
          element.dispatchEvent(new KeyboardEvent('keydown', { key: event.key, bubbles: true }));
          break;
      }
    }
  }

  async set(name: string, events: any[]) {
    this.macros[name] = events;
    return saveDataToBackground('hermes_macros_ext', this.macros);
  }

  async delete(name: string) {
    if (!(name in this.macros)) return false;
    delete this.macros[name];
    return saveDataToBackground('hermes_macros_ext', this.macros);
  }

  updateSettings(settings: any) {
    // Update macro settings
  }

  exportMacros(format: 'json' | 'xml' = 'json', names?: string[]): string {
    const subset: Record<string, any[]> = names
      ? names.reduce((obj, n) => {
          if (this.macros[n]) obj[n] = this.macros[n];
          return obj;
        }, {} as Record<string, any[]>)
      : this.macros;
    return JSON.stringify(subset, null, 2);
  }

  async importFromString(data: string): Promise<boolean> {
    try {
      const obj = JSON.parse(data);
      this.macros = { ...this.macros, ...obj };
      return saveDataToBackground('hermes_macros_ext', this.macros);
    } catch {
      return false;
    }
  }

  async rename(oldName: string, newName: string) {
    if (!(oldName in this.macros)) return false;
    if (oldName === newName) return true;
    this.macros[newName] = this.macros[oldName];
    delete this.macros[oldName];
    return saveDataToBackground('hermes_macros_ext', this.macros);
  }

  async import(obj: Record<string, any[]>) {
    this.macros = { ...this.macros, ...obj };
    return saveDataToBackground('hermes_macros_ext', this.macros);
  }

  list() { return Object.keys(this.macros); }
  get(name: string) { return this.macros[name]; }
  getAll() { return { ...this.macros }; }
}

export const macroEngine = new MacroEngine();

// Animation loop for effects
function loop() {
  if (!ctx || !canvas) return;
  canvas.style.display = 'block';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  switch (mode) {
    case 'snow':
      flakes.forEach(f => {
        f.y += f.s;
        if (f.y > canvas!.height) f.y = -f.r;
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      });
      break;

    case 'lasers':
      if (Math.random() < 0.05) {
        lasers.push({
          x: Math.random() * canvas.width,
          y: 0,
          len: 20 + Math.random() * 60,
          s: 5 + Math.random() * 10
        });
      }
      lasers.forEach(l => {
        if (!ctx) return;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,0,0,0.7)';
        ctx.lineWidth = 2;
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x, l.y + l.len);
        ctx.stroke();
        l.y += l.s;
      });
      lasers = lasers.filter(l => l.y < canvas!.height);
      break;

    case 'confetti':
      confettiPieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        if (!ctx) return;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      confettiPieces = confettiPieces.filter(p => p.y < canvas!.height);
      break;

    case 'bubbles':
      bubbles.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      bubbles = bubbles.filter(b => b.y > -b.r);
      break;

    case 'strobe':
      strobeState.phase += 0.1;
      strobeState.opacity = Math.sin(strobeState.phase) * 0.5 + 0.5;
      if (!ctx) return;
      ctx.fillStyle = `rgba(255,255,255,${strobeState.opacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
  }

  if (running) requestAnimationFrame(loop);
} 