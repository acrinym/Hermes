import { getRoot } from './root.ts';
import { createModal } from './ui/components.js';
import { saveDataToBackground } from './storage/index.ts';

let helpPanel: HTMLElement | null = null;

function createHelpPanel(): HTMLElement {
    const contentHtml = `
        <p style="margin-bottom:15px;"><strong>Hermes</strong> automates form filling, records macros, and trains field mappings on web pages.</p>
        <h3 style="margin-top:15px;color:var(--hermes-panel-text);">Why Use Hermes?</h3>
        <p>Hermes speeds up repetitive data entry and automates complex page interactions. It is especially useful on sites like <strong>BMC Helix/Remedy</strong> where IDs change on every load. By storing DOM paths and fallback coordinates, Hermes can reliably replay your recorded actions.</p>
        <ul style="list-style:disc;padding-left:20px;margin-bottom:15px;">
            <li>Save time by filling forms instantly.</li>
            <li>Record macros that navigate multi-step flows for you.</li>
            <li>Customize the UI with themes, effects and detailed settings.</li>
            <li>Debug mappings and macros using the log viewer and overlays.</li>
        </ul>
        <h3 style="margin-top:20px;color:var(--hermes-panel-text);">Features</h3>
        <ul style="list-style:disc;padding-left:20px;margin-bottom:15px;">
            <li><strong>Fill:</strong> Auto-fill forms using your profile data.</li>
            <li><strong>Edit:</strong> Edit your profile as JSON (keys should match field names/labels).</li>
            <li><strong>Record/Save:</strong> Record actions (clicks, inputs) as macros to replay later.</li>
            <li><strong>Macros:</strong> Play or delete recorded macros.</li>
            <li><strong>Logs:</strong> View debug logs (visible in Debug mode).</li>
            <li><strong>Train:</strong> Map fields to profile keys when unsure (requires Learn mode).</li>
            <li><strong>Overlay:</strong> Highlight fillable fields (toggleable).</li>
            <li><strong>Allowlist:</strong> Minimize UI on specific domains (shows full UI on click).</li>
            <li><strong>Theme:</strong> Change UI appearance with various themes.</li>
            <li><strong>Effects:</strong> Add visual effects (Snowflake, Classic/Simple Laser, Classic/Simple Strobe).</li>
            <li><strong>Settings (⚙️):</strong> Configure detailed options for UI (like border thickness) and visual effects (density, colors, speed, etc.) via a JSON editor.</li>
            <li><strong>Bunch:</strong> Compact UI layout (vertical or horizontal).</li>
            <li><strong>Sniff Elements:</strong> Log form elements for debugging.</li>
            <li><strong>Import JSON:</strong> Import profile data from JSON.</li>
        </ul>
        <h3 style="margin-top:20px;color:var(--hermes-panel-text);">Tips</h3>
        <ul style="list-style:disc;padding-left:20px;">
            <li>Drag the ☰ handle to move the UI.</li>
            <li>Use snap buttons (←, →, ↑, ↓, ↖, ↗, ↙, ↘) to align UI to edges/corners.</li>
            <li>Enable Debug mode to access logs and dev tools.</li>
            <li>Use Learn mode to improve field mappings.</li>
            <li>Check the <strong>Settings (⚙️)</strong> panel for advanced customization of UI appearance and effect parameters.</li>
        </ul>
    `;
    const root = getRoot();
    return createModal(
        root instanceof ShadowRoot ? root : document.body,
        'hermes-help-panel',
        'Hermes Help',
        contentHtml,
        '600px'
    );
}

/**
 * Show or hide the Hermes help panel.
 * @param show - true to show, false to hide
 */
export function toggleHelpPanel(show: boolean) {
    const root = getRoot();

    if (!helpPanel && show) helpPanel = createHelpPanel();
    if (!helpPanel) return;

    helpPanel.style.display = show ? 'block' : 'none';

    saveDataToBackground('hermes_help_panel_state_ext', show)
        .catch(e => console.error('Hermes CS: Failed to persist help state', e));

    // Append if not already in DOM (works for shadow or document)
    if (!root.contains(helpPanel)) {
        root.appendChild(helpPanel);
    }
}

export function showHelp() {
    toggleHelpPanel(true);
}
