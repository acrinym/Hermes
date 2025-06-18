import { createModal } from './ui/components.js';
import { getRoot } from './root.ts';
import { t } from '../i18n.js';
import { saveDataToBackground } from './storage/index.ts';

declare const chrome: any;

const SCRATCH_KEY = 'hermes_scratch_notes_ext';

interface Note { title: string; content: string; }

let notes: Note[] = [];
let current = 0;
let panel: HTMLElement | null = null;
let textArea: HTMLTextAreaElement | null = null;
let tabsContainer: HTMLElement | null = null;

export async function initScratchPad() {
  const data = await new Promise<any>(res => chrome.storage.local.get([SCRATCH_KEY], res));
  try {
    notes = data[SCRATCH_KEY] ? JSON.parse(data[SCRATCH_KEY]) : [{ title: 'Note 1', content: '' }];
  } catch {
    notes = [{ title: 'Note 1', content: '' }];
  }
  setupHotkey();
}

function setupHotkey() {
  document.addEventListener('keydown', e => {
    if (e.altKey && e.shiftKey && e.code === 'KeyV') {
      navigator.clipboard.readText().then(text => {
        notes[current].content += (notes[current].content ? '\n' : '') + text;
        updateContent();
        persist();
      }).catch(err => console.error('Hermes ScratchPad: clipboard read failed', err));
    }
  });
}

function persist() {
  const json = JSON.stringify(notes);
  chrome.storage.local.set({ [SCRATCH_KEY]: json });
  chrome.storage.sync.set({ [SCRATCH_KEY]: json }, () => {});
  saveDataToBackground(SCRATCH_KEY, notes).catch(e => console.error('BG save fail', e));
}

function updateContent() {
  if (textArea) textArea.value = notes[current].content;
  renderTabs();
}

function renderTabs() {
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';
  notes.forEach((n, idx) => {
    const b = document.createElement('button');
    b.className = 'hermes-button';
    b.textContent = n.title;
    if (idx === current) b.style.background = 'lightgreen';
    b.onclick = () => {
      notes[current].content = textArea ? textArea.value : notes[current].content;
      current = idx;
      updateContent();
    };
    tabsContainer!.appendChild(b);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'hermes-button';
  addBtn.textContent = '+';
  addBtn.onclick = () => {
    notes.push({ title: `Note ${notes.length + 1}`, content: '' });
    current = notes.length - 1;
    updateContent();
    persist();
  };
  tabsContainer.appendChild(addBtn);
}

function createPanel(root: HTMLElement | ShadowRoot): HTMLElement {
  const contentHtml = `
    <div id="pad-tabs" style="display:flex;gap:4px;margin-bottom:4px;"></div>
    <textarea id="pad-text" style="width:100%;height:50vh;resize:vertical;"></textarea>
    <div style="margin-top:8px;display:flex;gap:4px;align-items:center;">
      <select id="pad-format">
        <option value="md">MD</option>
        <option value="txt">TXT</option>
        <option value="json">JSON</option>
      </select>
      <button id="pad-export">${t('EXPORT')}</button>
      <button id="pad-drive">${t('SAVE_TO_DRIVE')}</button>
    </div>`;
  const container = createModal(root, 'hermes-scratch-pad', t('SCRATCH_PAD'), contentHtml, '700px');
  panel = container;
  textArea = container.querySelector('#pad-text') as HTMLTextAreaElement;
  tabsContainer = container.querySelector('#pad-tabs') as HTMLElement;
  const exportBtn = container.querySelector('#pad-export') as HTMLButtonElement;
  const formatSel = container.querySelector('#pad-format') as HTMLSelectElement;
  const driveBtn = container.querySelector('#pad-drive') as HTMLButtonElement;

  textArea.oninput = () => {
    notes[current].content = textArea!.value;
    persist();
  };

  exportBtn.onclick = () => exportCurrent(formatSel.value);
  driveBtn.onclick = () => backupToDrive();

  renderTabs();
  updateContent();
  return container;
}

export function toggleScratchPad(show: boolean) {
  const root = getRoot();
  if (!panel && show) panel = createPanel(root instanceof ShadowRoot ? root : document.body);
  if (panel) panel.style.display = show ? 'flex' : 'none';
}

function exportCurrent(fmt: string) {
  let data = '';
  if (fmt === 'json') data = JSON.stringify(notes, null, 2);
  else data = notes[current].content;
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hermes-note.${fmt}`;
  a.click();
  URL.revokeObjectURL(url);
}

function backupToDrive() {
  chrome.identity.getAuthToken({ interactive: true }, token => {
    if (chrome.runtime.lastError || !token) {
      console.error('Drive auth failed', chrome.runtime.lastError);
      return;
    }
    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    }).then(r => {
      if (!r.ok) throw new Error('Drive upload failed');
    }).catch(e => console.error('Drive upload error', e));
  });
}
