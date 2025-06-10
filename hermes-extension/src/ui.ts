import { macroEngine } from './macroEngine.ts';
import { fillForm } from './formFiller.ts';
import { runHeuristicTrainerSession } from './trainer.ts';
import { applyTheme } from './theme.ts';
import { loadSettings } from './settings.ts';
import { getInitialData } from './storage/index.ts';
import { startSnowflakes, stopEffects } from './effectsEngine.ts';
import { showHelp } from './help.ts';
import { setupUI } from './ui/setup.ts';
import {
  setupDebugControls,
  toggleLogViewer,
  addDebugLog,
  startMutationObserver,
  stopMutationObserver
} from './debug.ts';

export async function initUI() {
    const data = await getInitialData();
    const profile = data.profile || {};
    const theme = data.theme || 'dark';
    applyTheme(theme);
    await macroEngine.init();

    const container = document.createElement('div');
    container.id = 'hermes-ui';
    container.style.cssText = 'position:fixed;top:10px;right:10px;background:var(--hermes-bg);color:var(--hermes-text);padding:5px;z-index:2147483640;border:1px solid #999';

    const fillBtn = document.createElement('button');
    fillBtn.textContent = 'Fill';
    fillBtn.onclick = () => fillForm(profile);
    container.appendChild(fillBtn);

    const trainBtn = document.createElement('button');
    trainBtn.textContent = 'Train';
    trainBtn.onclick = () => runHeuristicTrainerSession(profile);
    container.appendChild(trainBtn);

    const recBtn = document.createElement('button');
    recBtn.textContent = 'Rec';
    recBtn.onclick = () => macroEngine.startRecording();
    container.appendChild(recBtn);

    const stopBtn = document.createElement('button');
    stopBtn.textContent = 'Stop';
    stopBtn.onclick = () => macroEngine.stopRecording();
    container.appendChild(stopBtn);

    const playBtn = document.createElement('button');
    playBtn.textContent = 'Play';
    playBtn.onclick = () => {
        const name = prompt('Macro name');
        if (name) macroEngine.play(name);
    };
    container.appendChild(playBtn);

    const fxBtn = document.createElement('button');
    fxBtn.textContent = 'Snow';
    fxBtn.onclick = () => startSnowflakes();
    container.appendChild(fxBtn);

    const helpBtn = document.createElement('button');
    helpBtn.textContent = '?';
    helpBtn.onclick = showHelp;
    container.appendChild(helpBtn);

    const logBtn = document.createElement('button');
    logBtn.textContent = 'Logs';
    logBtn.onclick = () => toggleLogViewer(true);
    container.appendChild(logBtn);

    document.body.appendChild(container);

    setupDebugControls();
    startMutationObserver(() => addDebugLog('mutation', 'dom', {}));
    window.addEventListener('beforeunload', stopMutationObserver);

    // load settings just to demonstrate
    loadSettings();
    setupUI();
}
