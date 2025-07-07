import { getRoot } from './root.ts';
import { createModal } from './ui/components.js';
import { saveDataToBackground } from './storage/index.ts';
import { t } from '../i18n.js';

let panel: HTMLElement | null = null;

function createPanel(): HTMLElement {
  const content = `<p>${t('ONBOARD_MSG')}</p>`;
  const root = getRoot();
  const buttons = `<button id="hermes-onboard-ok">${t('OK')}</button>`;
  const p = createModal(
    root instanceof ShadowRoot ? root : document.body,
    'hermes-onboard-panel',
    t('ONBOARD_TITLE'),
    content,
    '400px',
    buttons
  );
  p.querySelector('#hermes-onboard-ok')?.addEventListener('click', () => {
    p.style.display = 'none';
    saveDataToBackground('hermes_onboarded_ext', true).catch(e =>
      console.error('Hermes CS: failed to save onboarding', e)
    );
  });
  return p;
}

export function checkOnboarding() {
  chrome.storage.local.get(['hermes_onboarded_ext'], data => {
    if (!data.hermes_onboarded_ext) {
      if (!panel) panel = createPanel();
      panel.style.display = 'block';
    }
  });
}
