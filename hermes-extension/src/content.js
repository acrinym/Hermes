import { initUI } from './ui.ts';
import { toggleMinimizedUI } from './ui/setup.ts';
import { initEffects } from './effects.ts';
import { initMacros } from './macros.ts';
import { ensureSiteConfig } from './domScanner.ts';
import { checkOnboarding } from './onboarding.ts';

export function init() {
  initUI();
  initEffects();
  initMacros();
  ensureSiteConfig();
  checkOnboarding();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // If the content script runs after DOMContentLoaded, init immediately
  init();
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SET_ENABLED') {
    toggleMinimizedUI(!msg.payload.enabled);
  }
});
