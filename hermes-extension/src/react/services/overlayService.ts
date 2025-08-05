import { saveDataToBackground } from './storageService';

let overlayEnabled = false;
let mutationObs: MutationObserver | null = null;

export function initOverlays(enabled: boolean) {
  overlayEnabled = enabled;
  if (overlayEnabled) {
    applyOverlays();
    startObserver();
  }
}

export function toggleOverlays() {
  overlayEnabled = !overlayEnabled;
  saveDataToBackground('hermes_overlay_state_ext', overlayEnabled).catch(e =>
    console.error('Hermes: Failed to save overlay state', e)
  );
  if (overlayEnabled) {
    applyOverlays();
    startObserver();
  } else {
    stopObserver();
    removeOverlays();
  }
}

export function applyOverlays() {
  const fields = document.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >('input, textarea, select');
  fields.forEach(field => {
    const el = field as HTMLElement;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
    el.style.outline = '2px dotted var(--hermes-info-text, blue)';
    el.setAttribute('data-hermes-overlay', 'true');
  });
}

export function removeOverlays() {
  document.querySelectorAll('[data-hermes-overlay]').forEach(el => {
    (el as HTMLElement).style.outline = '';
    el.removeAttribute('data-hermes-overlay');
  });
}

function startObserver() {
  if (mutationObs) mutationObs.disconnect();
  mutationObs = new MutationObserver(() => {
    if (overlayEnabled) applyOverlays();
  });
  if (document.body) {
    mutationObs.observe(document.body, { childList: true, subtree: true });
  }
}

function stopObserver() {
  if (mutationObs) mutationObs.disconnect();
}
