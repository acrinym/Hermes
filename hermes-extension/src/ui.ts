import { macroEngine } from './macroEngine.ts';
import { fillForm } from './formFiller.ts';
import { runHeuristicTrainerSession } from './trainer.ts';
import { applyTheme } from './theme.ts';
import { loadSettings } from './settings.ts';
import { getInitialData, saveDataToBackground } from './storage/index.ts';
import { startSnowflakes, startLasers, stopEffects } from './effectsEngine.ts';
import { showHelp } from './help.ts';
import { setupUI, toggleMinimizedUI } from './ui/setup.ts';
import {
  setupDebugControls,
  toggleLogViewer,
  addDebugLog,
  startMutationObserver,
  stopMutationObserver
} from './debug.ts';
import { isAllowed } from './allowlist.ts';

export async function initUI() {
    const data = await getInitialData();
    const profile = data.profile || {};
    const theme = data.theme || 'dark';
    applyTheme(theme);
    await macroEngine.init();

    const container = setupUI();
    const allowed = isAllowed(location.hostname, data.whitelist || []);
    if (!allowed) toggleMinimizedUI(true);

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

    const debugBtn = document.createElement('button');
    let debugEnabled = !!data.debugMode;
    debugBtn.textContent = 'Debug';
    debugBtn.onclick = () => {
        debugEnabled = !debugEnabled;
        if (debugEnabled) {
            startMutationObserver(() => addDebugLog('mutation','dom',{}));
        } else {
            stopMutationObserver();
        }
        saveDataToBackground('hermes_debug_mode_ext', debugEnabled);
    };
    container.appendChild(debugBtn);

    const learnBtn = document.createElement('button');
    let learning = !!data.learningMode;
    learnBtn.textContent = 'Learn';
    learnBtn.onclick = () => {
        learning = !learning;
        saveDataToBackground('hermes_learning_state_ext', learning);
    };
    container.appendChild(learnBtn);

    const laserBtn = document.createElement('button');
    laserBtn.textContent = 'Lasers';
    laserBtn.onclick = () => startLasers();
    container.appendChild(laserBtn);

    const stopFxBtn = document.createElement('button');
    stopFxBtn.textContent = 'FX Off';
    stopFxBtn.onclick = () => stopEffects();
    container.appendChild(stopFxBtn);

    setupDebugControls();
    if (debugEnabled) {
        startMutationObserver(() => addDebugLog('mutation', 'dom', {}));
    }
    window.addEventListener('beforeunload', stopMutationObserver);

    // load settings just to demonstrate
    loadSettings();
}
