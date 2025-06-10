import { startSnowflakes, stopEffects } from './effectsEngine.ts';

export function initEffects() {
    startSnowflakes();
}

export { stopEffects };
