import { createModal } from './ui/components.js';
import { getRoot } from './root.ts';
import { t } from '../i18n.js';

declare const chrome: any;

let panel: HTMLElement | null = null;
let displayEl: HTMLElement | null = null;
let interval: any = null;
let remaining = 0;
let mode: 'work' | 'break' = 'work';
const WORK_MIN = 25;
const BREAK_MIN = 5;

function updateDisplay() {
  if (!displayEl) return;
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  displayEl.textContent = `${m}:${s}`;
}

function tick() {
  remaining--;
  if (remaining <= 0) {
    if (mode === 'work') {
      mode = 'break';
      remaining = BREAK_MIN * 60;
      alert(t('BREAK_TIME'));
    } else {
      mode = 'work';
      remaining = WORK_MIN * 60;
      alert(t('BACK_TO_WORK'));
    }
  }
  updateDisplay();
}

function startTimer() {
  if (interval) return;
  if (remaining <= 0) {
    mode = 'work';
    remaining = WORK_MIN * 60;
  }
  updateDisplay();
  interval = setInterval(tick, 1000);
}

function stopTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

function createPanel(root: HTMLElement | ShadowRoot): HTMLElement {
  const html = `
    <div id="hermes-timer-display" style="text-align:center;font-size:2em;margin-bottom:10px;">00:00</div>
    <div style="display:flex;gap:10px;justify-content:center;">
      <button id="hermes-timer-start" class="hermes-button" style="background:var(--hermes-success-text);color:var(--hermes-panel-bg);">${t('START')}</button>
      <button id="hermes-timer-stop" class="hermes-button" style="background:var(--hermes-error-text);color:var(--hermes-panel-bg);">${t('STOP')}</button>
    </div>`;
  const container = createModal(root, 'hermes-timer-panel', t('TIMER'), html, '300px');
  panel = container;
  displayEl = container.querySelector('#hermes-timer-display') as HTMLElement;
  updateDisplay();
  const startBtn = container.querySelector('#hermes-timer-start') as HTMLButtonElement;
  const stopBtn = container.querySelector('#hermes-timer-stop') as HTMLButtonElement;
  if (startBtn) startBtn.onclick = () => startTimer();
  if (stopBtn) stopBtn.onclick = () => stopTimer();
  return container;
}

export function toggleTimer(show: boolean) {
  const root = getRoot();
  if (!panel && show) panel = createPanel(root instanceof ShadowRoot ? root : document.body);
  if (panel) panel.style.display = show ? 'block' : 'none';
}
