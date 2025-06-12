import { createModal } from './ui/components.js';

export function showHelp() {
    const html = `
        <p>Hermes automates form filling and can record macros of your actions.</p>
        <ul style="list-style:disc;padding-left:20px;">
            <li><strong>Fill</strong> forms using your saved profile.</li>
            <li><strong>Record</strong> clicks and inputs for later playback.</li>
            <li>Switch <strong>themes</strong> and enable fun visual effects.</li>
            <li>Manage an allowlist so Hermes stays out of the way on other sites.</li>
        </ul>`;
    let panel = document.getElementById('hermes-help') as HTMLElement | null;
    if (!panel) {
        panel = createModal(document.body, 'hermes-help', 'Hermes Help', html, '500px');
    }
    panel.style.display = 'block';
}
