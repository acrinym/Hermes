import { startSnowflakes, startLasers, startCube, stopEffects } from './localCore';

export function initEffects() {
  startSnowflakes();
}

export function enableLasers() {
  startLasers();
}

export function enableCube() {
  startCube();
}

export { stopEffects };
