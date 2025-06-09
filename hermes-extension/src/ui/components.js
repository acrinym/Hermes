import { saveDataToBackground } from '../storage/index.js';

export function getPanelBaseStyle() {
    return `display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:500px;max-height:80vh;background:var(--hermes-panel-bg, #FFF);border:1px solid var(--hermes-panel-border, #CCC);border-radius:8px;box-shadow:0 5px 15px rgba(0,0,0,0.3);padding:20px;z-index:2147483647;font-family:sans-serif;color:var(--hermes-panel-text, #000);overflow-y:auto;box-sizing:border-box;`;
}

export function createModal(shadowRoot, id, title, contentHtml, maxWidth = '600px', customButtonsHtml = '') {
    if (shadowRoot && shadowRoot.querySelector(`#${id}`)) {
        shadowRoot.querySelector(`#${id}`).remove();
    }
    const panel = document.createElement('div');
    panel.id = id;
    panel.className = 'hermes-panel';
    panel.style.cssText = getPanelBaseStyle() + `max-width: ${maxWidth};`;

    let buttonsBlock = `<button class="hermes-panel-close hermes-button">Close</button>`;
    if (customButtonsHtml) {
        buttonsBlock = customButtonsHtml.replace(/<button/g, '<button class="hermes-button"') + buttonsBlock;
    }

    panel.innerHTML = `
        <h2 class="hermes-panel-title">${title}</h2>
        <div class="hermes-panel-content">${contentHtml}</div>
        <div class="hermes-panel-buttons">${buttonsBlock}</div>`;

    if (shadowRoot) {
        shadowRoot.appendChild(panel);
        const closeButton = panel.querySelector('.hermes-panel-close');
        if (closeButton) closeButton.addEventListener('click', () => {
            panel.style.display = 'none';
            if (id === 'hermes-help-panel') {
                saveDataToBackground('hermes_help_panel_state_ext', false).catch(e => console.error('Hermes CS: Failed to save help panel closed state', e));
            }
        });
    } else {
        console.error('Hermes CS: shadowRoot not available to create modal:', id);
    }
    return panel;
}
