import { t } from '../../i18n.js';
import { saveDataToBackground } from '../storage/index.ts';

let container: HTMLDivElement | null = null;
let minimized: HTMLDivElement | null = null;
let isMinimized = false;
let isBunched = false;
let dragHandle: HTMLDivElement | null = null;
let dockMode: 'none' | 'top' | 'bottom' = 'none';
const position = { top: 10, left: 10 };

export function setupUI(root: HTMLElement = document.body, initialDock: 'none' | 'top' | 'bottom' = 'none') {
  if (container) return container;

  container = document.createElement('div');
  container.id = 'hermes-ui-container';
  container.style.cssText = 'position:fixed;top:10px;left:10px;display:flex;gap:4px;background:var(--hermes-bg);color:var(--hermes-text);padding:4px;border:1px solid var(--hermes-border);z-index:2147483647;';
  root.appendChild(container);

  minimized = document.createElement('div');
  minimized.id = 'hermes-minimized-container';
  minimized.textContent = '🛠️';
  minimized.style.cssText = 'display:none;position:fixed;top:10px;left:10px;cursor:pointer;padding:2px;z-index:2147483647;background:var(--hermes-bg);border:1px solid var(--hermes-border);color:var(--hermes-text);';
  minimized.onclick = () => toggleMinimizedUI(false);
  root.appendChild(minimized);

  dragHandle = document.createElement('div');
  dragHandle.id = 'hermes-drag-handle';
  dragHandle.textContent = '☰';
  dragHandle.style.cssText = 'cursor:move;user-select:none;padding:0 4px;';
  container.appendChild(dragHandle);
  setupDragging(dragHandle);

  dockMode = initialDock;

  const bunchBtn = document.createElement('button');
  bunchBtn.className = 'hermes-button';
  bunchBtn.id = 'hermes-bunch-button';
  bunchBtn.textContent = t('BUNCH');
  bunchBtn.onclick = () => {
    isBunched = !isBunched;
    if (container) container.classList.toggle('hermes-bunched', isBunched);
  };
  container.appendChild(bunchBtn);

  const minBtn = document.createElement('button');
  minBtn.className = 'hermes-button';
  minBtn.id = 'hermes-minimize-button';
  minBtn.textContent = '_';
  minBtn.onclick = () => toggleMinimizedUI(true);
  container.appendChild(minBtn);

  const snapContainer = document.createElement('div');
  snapContainer.id = 'hermes-snap-buttons';
  snapContainer.style.display = 'flex';
  snapContainer.style.gap = '2px';
  const snapData = [
    { edge: 'left', label: '\u2190' },
    { edge: 'right', label: '\u2192' },
    { edge: 'top', label: '\u2191' },
    { edge: 'bottom', label: '\u2193' },
    { edge: 'top-left', label: '\u2196' },
    { edge: 'top-right', label: '\u2197' },
    { edge: 'bottom-left', label: '\u2199' },
    { edge: 'bottom-right', label: '\u2198' },
    { edge: 'dock-top', label: '\u2912' },
    { edge: 'dock-bottom', label: '\u2913' }
  ];
  snapData.forEach(d => {
    const b = document.createElement('button');
    b.className = 'hermes-button';
    b.textContent = d.label;
    b.onclick = () => {
      if (d.edge === 'dock-top') dockToPage('top');
      else if (d.edge === 'dock-bottom') dockToPage('bottom');
      else snapToEdge(d.edge);
    };
    snapContainer.appendChild(b);
  });
  container.appendChild(snapContainer);

  applyDock();

  return container;
}

export function toggleMinimizedUI(minimize: boolean) {
  if (!container || !minimized) return;
  isMinimized = minimize;
  container.style.display = minimize ? 'none' : 'flex';
  minimized.style.display = minimize ? 'flex' : 'none';
  if (!minimize) {
    container.style.left = `${position.left}px`;
    container.style.top = `${position.top}px`;
    applyDock();
  }
}

function setupDragging(handle: HTMLElement) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    offsetX = e.clientX - position.left;
    offsetY = e.clientY - position.top;
    e.preventDefault();
    dockToPage('none');
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const cw = container?.offsetWidth || 0;
    const ch = container?.offsetHeight || 0;
    const newLeft = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - cw));
    const newTop = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - ch));
    position.left = newLeft;
    position.top = newTop;
    if (container) {
      container.style.left = `${newLeft}px`;
      container.style.top = `${newTop}px`;
      const nearSide = newLeft < 10 || newLeft > window.innerWidth - cw - 10;
      if (nearSide) {
        container.classList.add('hermes-bunched');
      } else {
        container.classList.remove('hermes-bunched');
      }
      applyDock();
    }
    if (minimized) {
      minimized.style.left = `${newLeft}px`;
      minimized.style.top = `${newTop}px`;
    }
  });
  document.addEventListener('mouseup', () => {
    dragging = false;
  });
}

function snapToEdge(edge: string) {
  if (!container || !minimized) return;
  dockToPage('none');
  const rect = (isMinimized ? minimized : container).getBoundingClientRect();
  const margin = 10;
  let newLeft = position.left;
  let newTop = position.top;
  switch (edge) {
    case 'left':
      newLeft = margin;
      break;
    case 'right':
      newLeft = window.innerWidth - rect.width - margin;
      break;
    case 'top':
      newTop = margin;
      break;
    case 'bottom':
      newTop = window.innerHeight - rect.height - margin;
      break;
    case 'top-left':
      newTop = margin;
      newLeft = margin;
      break;
    case 'top-right':
      newTop = margin;
      newLeft = window.innerWidth - rect.width - margin;
      break;
    case 'bottom-left':
      newTop = window.innerHeight - rect.height - margin;
      newLeft = margin;
      break;
    case 'bottom-right':
      newTop = window.innerHeight - rect.height - margin;
      newLeft = window.innerWidth - rect.width - margin;
      break;
  }
  newLeft = Math.max(margin, Math.min(newLeft, window.innerWidth - rect.width - margin));
  newTop = Math.max(margin, Math.min(newTop, window.innerHeight - rect.height - margin));
  position.left = newLeft;
  position.top = newTop;
  container.style.left = `${newLeft}px`;
  container.style.top = `${newTop}px`;
  minimized.style.left = `${newLeft}px`;
  minimized.style.top = `${newTop}px`;
  applyDock();
}

function dockToPage(pos: 'none' | 'top' | 'bottom') {
  dockMode = pos;
  saveDataToBackground('hermes_dock_mode_ext', dockMode);
  applyDock();
}

function applyDock() {
  if (!container || !minimized) return;
  const target = isMinimized ? minimized : container;
  const height = target.getBoundingClientRect().height + 10;
  if (dockMode === 'top') {
    container.style.top = '0px';
    container.style.bottom = '';
    minimized.style.top = '0px';
    minimized.style.bottom = '';
    document.body.style.marginTop = `${height}px`;
    document.body.style.marginBottom = '';
  } else if (dockMode === 'bottom') {
    container.style.bottom = '0px';
    container.style.top = '';
    minimized.style.bottom = '0px';
    minimized.style.top = '';
    document.body.style.marginBottom = `${height}px`;
    document.body.style.marginTop = '';
  } else {
    document.body.style.marginTop = '';
    document.body.style.marginBottom = '';
    container.style.bottom = '';
    minimized.style.bottom = '';
  }
}
