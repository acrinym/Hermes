export function showHelp() {
    let panel = document.getElementById('hermes-help');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'hermes-help';
        panel.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#fff;padding:10px;border:1px solid #ccc;z-index:2147483641;max-width:300px';
        panel.innerHTML = `<strong>Hermes Help</strong><p>This extension fills forms and records macros.</p>`;
        const close = document.createElement('button');
        close.textContent = 'Close';
        close.onclick = () => panel!.remove();
        panel.appendChild(close);
        document.body.appendChild(panel);
    }
}
