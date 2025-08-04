import { saveDataToBackground } from '../storage/index.ts';
import { t } from '../../i18n.js';
import { speak } from '../narrator.tsx';

export function getPanelBaseStyle() {
  return `display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:500px;max-height:80vh;background:var(--hermes-panel-bg, #FFF);border:1px solid var(--hermes-panel-border, #CCC);border-radius:8px;box-shadow:0 5px 15px rgba(0,0,0,0.3);padding:20px;z-index:2147483647;font-family:sans-serif;color:var(--hermes-panel-text, #000);overflow-y:auto;box-sizing:border-box;`;
}

export function createModal(root, id, title, contentHtml, maxWidth = '600px', customButtonsHtml = '') {
  if (root && root.querySelector(`#${id}`)) {
    root.querySelector(`#${id}`).remove();
  }
  const panel = document.createElement('div');
  panel.id = id;
  panel.className = 'hermes-panel';
  panel.style.cssText = getPanelBaseStyle() + `max-width: ${maxWidth};`;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.tabIndex = -1;

  let buttonsBlock = `<button class="hermes-panel-close hermes-button" aria-label="${t('CLOSE')}">${t('CLOSE')}</button>`;
  if (customButtonsHtml) {
    buttonsBlock = customButtonsHtml.replace(/<button/g, '<button class="hermes-button"') + buttonsBlock;
  }

  panel.innerHTML = `
    <h2 id="${id}-title" class="hermes-panel-title">${title}</h2>
    <div class="hermes-panel-content">${contentHtml}</div>
    <div class="hermes-panel-buttons">${buttonsBlock}</div>`;
  panel.setAttribute('aria-labelledby', `${id}-title`);

  if (root) {
    if (root instanceof ShadowRoot) {
      root.appendChild(panel);
    } else {
      (root.body || root).appendChild(panel);
    }
    const closeButton = panel.querySelector('.hermes-panel-close');
    if (closeButton) closeButton.addEventListener('click', () => {
      panel.style.display = 'none';
      if (id === 'hermes-help-panel') {
        saveDataToBackground('hermes_help_panel_state_ext', false).catch(e => console.error('Hermes CS: Failed to save help panel closed state', e));
      }
    });
    speak(title);
    panel.focus();
  } else {
    console.error('Hermes CS: shadowRoot not available to create modal:', id);
  }
  return panel;
}
