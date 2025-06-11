import { getRoot } from './root.ts';

export function showHelp() {
    const root = getRoot();
    let panel = (root instanceof ShadowRoot ? root.querySelector('#hermes-help') : document.getElementById('hermes-help')) as HTMLElement | null;
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'hermes-help';
        panel.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#fff;padding:10px;border:1px solid #ccc;z-index:2147483641;max-width:300px';
        panel.innerHTML = `<strong>Hermes Help</strong><p>This extension fills forms and records macros.</p>`;
        const close = document.createElement('button');
        close.textContent = 'Close';
        close.onclick = () => panel!.remove();
        panel.appendChild(close);
        if (root instanceof ShadowRoot) {
            root.appendChild(panel);
        } else {
            document.body.appendChild(panel);
        }
    }
}
