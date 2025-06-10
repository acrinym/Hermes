import { startSnowflakes, startLasers, stopEffects } from './effectsEngine.ts';

export function initEffects() {
    startSnowflakes();
}

export function enableLasers() {
    startLasers();
}

export { stopEffects };
