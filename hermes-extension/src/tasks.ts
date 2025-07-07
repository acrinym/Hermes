import { createModal } from './ui/components.js';
import { getRoot } from './root.ts';
import { saveDataToBackground } from './storage/index.ts';
import { t } from '../i18n.js';

declare const chrome: any;

const TASKS_KEY = 'hermes_tasks_ext';

interface Task { text: string; done: boolean; }

let tasks: Task[] = [];
let panel: HTMLElement | null = null;
let listDiv: HTMLElement | null = null;
let inputEl: HTMLInputElement | null = null;

export async function initTasks() {
  const data = await new Promise<any>(res => chrome.storage.local.get([TASKS_KEY], res));
  try {
    tasks = data[TASKS_KEY] ? JSON.parse(data[TASKS_KEY]) : [];
  } catch {
    tasks = [];
  }
}

function persist() {
  const json = JSON.stringify(tasks);
  chrome.storage.sync.set({ [TASKS_KEY]: json }, () => {});
  saveDataToBackground(TASKS_KEY, tasks).catch(e => console.error('BG save fail', e));
}

function render() {
  if (!listDiv) return;
  listDiv.innerHTML = '';
  tasks.forEach((t, i) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.marginBottom = '5px';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.onchange = () => { tasks[i].done = cb.checked; persist(); render(); };
    const span = document.createElement('span');
    span.textContent = t.text;
    span.style.marginLeft = '5px';
    if (t.done) span.style.textDecoration = 'line-through';
    const del = document.createElement('button');
    del.className = 'hermes-button';
    del.textContent = '✖';
    del.style.marginLeft = 'auto';
    del.onclick = () => { tasks.splice(i, 1); persist(); render(); };
    item.appendChild(cb);
    item.appendChild(span);
    item.appendChild(del);
    listDiv.appendChild(item);
  });
}

function createPanel(root: HTMLElement | ShadowRoot): HTMLElement {
  const contentHtml = `
    <div id="hermes-tasks-list" style="max-height:40vh;overflow-y:auto;margin-bottom:10px;"></div>
    <div style="display:flex;gap:5px;">
      <input id="hermes-task-input" type="text" placeholder="${t('NEW_TASK')}" style="flex:1;">
      <button id="hermes-task-add" class="hermes-button" style="background:var(--hermes-success-text);color:var(--hermes-panel-bg);">${t('ADD')}</button>
    </div>`;
  const container = createModal(root, 'hermes-tasks-panel', t('TASKS'), contentHtml, '400px');
  panel = container;
  listDiv = container.querySelector('#hermes-tasks-list') as HTMLElement;
  inputEl = container.querySelector('#hermes-task-input') as HTMLInputElement;
  const addBtn = container.querySelector('#hermes-task-add') as HTMLButtonElement;
  render();
  if (addBtn) addBtn.onclick = () => {
    const text = inputEl.value.trim();
    if (text) {
      tasks.push({ text, done: false });
      inputEl.value = '';
      persist();
      render();
    }
  };
  return container;
}

export function toggleTasks(show: boolean) {
  const root = getRoot();
  if (!pane
l && show) panel = createPanel(root instanceof ShadowRoot ? root : document.body);
  if (panel) panel.style.display = show ? 'block' : 'none';
}