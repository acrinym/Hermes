import { initUI } from './ui.ts';
import { initEffects } from './effects.ts';
import { initMacros } from './macros.ts';

export function init() {
  initUI();
  initEffects();
  initMacros();
}

document.addEventListener('DOMContentLoaded', init);
