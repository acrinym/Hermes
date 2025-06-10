import { initUI } from './ui';
import { initEffects } from './effects';
import { initMacros } from './macros';

export function init() {
  initUI();
  initEffects();
  initMacros();
}

document.addEventListener('DOMContentLoaded', init);
