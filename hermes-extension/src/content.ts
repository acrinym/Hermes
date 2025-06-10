import { initUI } from './ui.ts';
import { initEffects } from './effects.ts';
import { initMacros } from './macros.ts';
import { ensureSiteConfig } from './domScanner.ts';

export function init() {
  initUI();
  initEffects();
  initMacros();
  ensureSiteConfig();
}

document.addEventListener('DOMContentLoaded', init);
