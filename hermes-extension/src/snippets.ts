import { createModal } from './ui/components.js';
import { getRoot } from './root.ts';
import { saveDataToBackground } from './storage/index.ts';
import { t } from '../i18n.js';

declare const chrome: any;

const SNIPPETS_KEY = 'hermes_snippets_ext';

interface Snippet { title: string; content: string; }
interface Category { name: string; snippets: Snippet[]; }

let categories: Category[] = [];
let currentCat = 0;
let panel: HTMLElement | null = null;
let listDiv: HTMLElement | null = null;
let titleInput: HTMLInputElement | null = null;
let textArea: HTMLTextAreaElement | null = null;
let tabsDiv: HTMLElement | null = null;

export async function initSnippets() {
  const data = await new Promise<any>(res => chrome.storage.local.get([SNIPPETS_KEY], res));
  try {
    categories = data[SNIPPETS_KEY] ? JSON.parse(data[SNIPPETS_KEY]) : [{ name: 'General', snippets: [] }];
  } catch {
    categories = [{ name: 'General', snippets: [] }];
  }
}

function persist() {
  const json = JSON.stringify(categories);
  chrome.storage.sync.set({ [SNIPPETS_KEY]: json }, () => {});
  saveDataToBackground(SNIPPETS_KEY, categories).catch(e => console.error('BG save fail', e));
}

function renderTabs() {
  if (!tabsDiv) return;
  tabsDiv.innerHTML = '';
  categories.forEach((cat, idx) => {
    const b = document.createElement('button');
    b.className = 'hermes-button';
    b.textContent = cat.name;
    if (idx === currentCat) b.style.background = 'lightgreen';
    b.onclick = () => { currentCat = idx; render(); };
    tabsDiv!.appendChild(b);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'hermes-button';
  addBtn.textContent = '+';
  addBtn.onclick = () => {
    const name = prompt(t('NEW_CATEGORY')); if (!name) return;
    categories.push({ name, snippets: [] });
    currentCat = categories.length - 1;
    persist();
    render();
  };
  tabsDiv.appendChild(addBtn);
}

function renderSnippets() {
  if (!listDiv) return;
  listDiv.innerHTML = '';
  const cat = categories[currentCat];
  cat.snippets.forEach((s, i) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.marginBottom = '4px';
    const span = document.createElement('span');
    span.textContent = s.title;
    span.style.flexGrow = '1';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'hermes-button';
    copyBtn.textContent = t('COPY');
    copyBtn.onclick = () => navigator.clipboard.writeText(s.content);
    const editBtn = document.createElement('button');
    editBtn.className = 'hermes-button';
    editBtn.textContent = '✏️';
    editBtn.onclick = () => {
      titleInput!.value = s.title;
      textArea!.value = s.content;
      currentEditing = i;
    };
    const delBtn = document.createElement('button');
    delBtn.className = 'hermes-button';
    delBtn.textContent = '🗑️';
    delBtn.onclick = () => { cat.snippets.splice(i, 1); persist(); render(); };
    row.append(span, copyBtn, editBtn, delBtn);
    listDiv.appendChild(row);
  });
}

let currentEditing: number | null = null;

function render() {
  renderTabs();
  renderSnippets();
  if (titleInput) titleInput.value = '';
  if (textArea) textArea.value = '';
  currentEditing = null;
}

function createPanel(root: HTMLElement | ShadowRoot): HTMLElement {
  const contentHtml = `
    <div id="snip-tabs" style="display:flex;gap:4px;margin-bottom:4px;"></div>
    <div id="snip-list" style="max-height:30vh;overflow-y:auto;margin-bottom:8px;"></div>
    <input id="snip-title" type="text" placeholder="${t('NEW_SNIPPET')}" style="width:100%;margin-bottom:4px;">
    <textarea id="snip-text" style="width:100%;height:80px;resize:vertical;"></textarea>`;
  const buttonsHtml = `<button id="snip-save">${t('SAVE')}</button>`;
  const container = createModal(root, 'hermes-snippets', t('SNIPPETS'), contentHtml, '500px', buttonsHtml);
  panel = container;
  tabsDiv = container.querySelector('#snip-tabs') as HTMLElement;
  listDiv = container.querySelector('#snip-list') as HTMLElement;
  titleInput = container.querySelector('#snip-title') as HTMLInputElement;
  textArea = container.querySelector('#snip-text') as HTMLTextAreaElement;
  const saveBtn = container.querySelector('#snip-save') as HTMLButtonElement;
  saveBtn.onclick = () => {
    const title = titleInput!.value.trim();
    const text = textArea!.value;
    if (!title) return;
    const cat = categories[currentCat];
    if (currentEditing !== null) {
      cat.snippets[currentEditing] = { title, content: text };
    } else {
      cat.snippets.push({ title, content: text });
    }
    persist();
    render();
  };
  render();
  return container;
}

export function toggleSnippets(show: boolean) {
  const root = getRoot();
  if (!panel && show) panel = createPanel(root instanceof ShadowRoot ? root : document.body);
  if (panel) panel.style.display = show ? 'block' : 'none';
}
