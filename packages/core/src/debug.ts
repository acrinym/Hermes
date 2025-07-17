// Basic translation helper. When running inside the extension the global
// `t` function will be injected, otherwise fall back to identity.
// This avoids a hard dependency on the extension's i18n file.
const t: (key: string) => string =
  (globalThis as any).t || ((key: string) => key);
declare const chrome: any;

export function addDebugLog(type: string, target: string | null = null, details: any = {}): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
  const payload = { timestamp: Date.now(), type, target, details };
  chrome.runtime.sendMessage({ type: 'ADD_DEBUG_LOG', payload });
}

export function getDebugLogs(): Promise<any[]> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_DEBUG_LOGS' }, (res: any) => {
      resolve((res && res.logs) || []);
    });
  });
}

export function clearDebugLogs(): Promise<void> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'CLEAR_DEBUG_LOGS' }, () => resolve());
  });
}

let mutationObs: MutationObserver | null = null;
export function startMutationObserver(callback: () => void): void {
  if (mutationObs) mutationObs.disconnect();
  mutationObs = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
        for (const node of Array.from(m.addedNodes).concat(Array.from(m.removedNodes))) {
          if (node.nodeType === 1 && (node instanceof HTMLElement) &&
            (node.matches('form, input, select, textarea') || node.querySelector('form, input, select, textarea')) ) {
            callback();
            return;
          }
        }
      }
    }
  });
  const observe = () => {
    if (document.body) {
      mutationObs!.observe(document.body, { childList: true, subtree: true });
    }
  };
  if (document.body) observe();
  else document.addEventListener('DOMContentLoaded', observe);
}

export function stopMutationObserver(): void {
  if (mutationObs) mutationObs.disconnect();
}

let logPanel: HTMLElement | null = null;
function createLogViewer(): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'hermes-log-viewer';
  panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);width:90%;max-width:600px;max-height:70vh;background:var(--hermes-panel-bg);border:1px solid var(--hermes-panel-border);color:var(--hermes-panel-text);padding:10px;z-index:2147483647;overflow:auto;font-family:sans-serif';
  panel.innerHTML = `<h2 style="margin-top:0">${t('HERMES_LOGS')}</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th>Time</th><th>Type</th><th>Target</th><th>Details</th></tr></thead><tbody id="hermes-log-body"></tbody></table><div style="margin-top:10px;text-align:right"><button id="hermes-log-clear" class="hermes-button">${t('CLEAR')}</button> <button id="hermes-log-close" class="hermes-button">${t('CLOSE')}</button></div>`;
  document.body.appendChild(panel);
  panel.querySelector('#hermes-log-close')!.addEventListener('click', () => panel.style.display = 'none');
  panel.querySelector('#hermes-log-clear')!.addEventListener('click', async () => { await clearDebugLogs(); await populateLogViewer(); });
  return panel;
}

async function populateLogViewer() {
  if (!logPanel) return;
  const body = logPanel.querySelector('#hermes-log-body') as HTMLElement;
  if (!body) return;
  body.innerHTML = '';
  const logs = await getDebugLogs();
  if (!logs.length) {
    body.innerHTML = `<tr><td colspan="4" style="text-align:center">${t('NO_LOGS')}</td></tr>`;
    return;
  }
  for (const log of logs) {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--hermes-panel-border)';
    row.innerHTML = `<td style="padding:4px">${new Date(log.timestamp).toLocaleTimeString()}</td><td style="padding:4px">${log.type}</td><td style="padding:4px">${log.target || ''}</td><td style="padding:4px;word-break:break-all"><pre style="margin:0;font-family:monospace">${JSON.stringify(log.details, null, 2)}</pre></td>`;
    body.appendChild(row);
  }
}

export async function toggleLogViewer(show: boolean) {
  if (show && !logPanel) {
    logPanel = createLogViewer();
  }
  if (logPanel) {
    if (show) {
      await populateLogViewer();
      logPanel.style.display = 'block';
    } else {
      logPanel.style.display = 'none';
    }
  }
}

export function setupDebugControls() {
  (window as any).hermesDebug = {
    addLog: addDebugLog,
    getLogs: getDebugLogs,
    clearLogs: clearDebugLogs,
    startObserver: startMutationObserver,
    stopObserver: stopMutationObserver,
    showLogs: () => toggleLogViewer(true)
  };
}

