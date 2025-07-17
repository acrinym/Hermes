import { startSnowflakes, startLasers, startCube, stopEffects } from '@hermes/core';

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
