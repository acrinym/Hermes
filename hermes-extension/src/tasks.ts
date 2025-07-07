import { createModal } from './ui/components.js';
import { getRoot } from './root.ts';
import { saveDataToBackground } from './storage/index.ts';
import { t } from '../i18n.js';

declare const chrome: any;

const TASKS_KEY = 'hermes_tasks_ext';

interface Task { text: string; done: boolean; }

let tasks: Task[] = [];
let panel: HTMLElement | null = null;

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
  chrome.storage.local.set({ [TASKS_KEY]: json });
  saveDataToBackground(TASKS_KEY, tasks).catch(e => console.error('BG save fail', e));
}

function render(listDiv: HTMLElement) {
  listDiv.innerHTML = '';
  tasks.forEach((t, i) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.marginBottom = '5px';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.onchange = () => { tasks[i].done = cb.checked; persist(); render(listDiv); };
    const span = document.createElement('span');
    span.textContent = t.text;
    span.style.marginLeft = '5px';
    if (t.done) span.style.textDecoration = 'line-through';
    const del = document.createElement('button');
    del.className = 'hermes-button';
    del.textContent = '✖';
    del.style.marginLeft = 'auto';
    del.onclick = () => { tasks.splice(i, 1); persist(); render(listDiv); };
    row.append(cb, span, del);
    listDiv.appendChild(row);
  });
}

function createPanel(root: HTMLElement | ShadowRoot): HTMLElement {
  const contentHtml = `
    <div id="tasks-list" style="max-height:40vh;overflow-y:auto;margin-bottom:10px;"></div>
    <div style="display:flex;gap:5px;">
      <input id="task-input" type="text" placeholder="${t('NEW_TASK')}" style="flex:1;">
      <button id="task-add" class="hermes-button">${t('ADD')}</button>
    </div>`;
  const container = createModal(root, 'hermes-tasks-panel', t('TASKS'), contentHtml, '400px');
  const listDiv = container.querySelector('#tasks-list') as HTMLElement;
  const inputEl = container.querySelector('#task-input') as HTMLInputElement;
  const addBtn = container.querySelector('#task-add') as HTMLButtonElement;
  const redraw = () => render(listDiv);
  addBtn.onclick = () => {
    const text = inputEl.value.trim();
    if (text) {
      tasks.push({ text, done: false });
      persist();
      inputEl.value = '';
      redraw();
    }
  };
  redraw();
  panel = container;
  return container;
}

export function toggleTasksPanel(show: boolean) {
  const root = getRoot();
  if (!panel && show) panel = createPanel(root instanceof ShadowRoot ? root : document.body);
  if (panel) panel.style.display = show ? 'block' : 'none';
}
