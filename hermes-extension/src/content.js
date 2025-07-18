import { initUI } from './ui.ts';
import { toggleMinimizedUI } from './ui/setup.ts';
import { t } from '../i18n.js';

// Lazy load non-essential features
const lazyLoadEffects = () => import('./effects.ts').then(m => m.initEffects());
const lazyLoadMacros = () => import('./macros.ts').then(m => m.initMacros());
const lazyLoadOnboarding = () => import('./onboarding.ts').then(m => m.checkOnboarding());
const lazyLoadDomScanner = () => import('./domScanner.ts').then(m => m.ensureSiteConfig());

export async function init() {
  // Initialize core UI first
  initUI();
  
  // Lazy load other features after a short delay
  setTimeout(async () => {
    try {
      await Promise.all([
        lazyLoadEffects(),
        lazyLoadMacros(),
        lazyLoadOnboarding(),
        lazyLoadDomScanner()
      ]);
    } catch (error) {
      console.warn('Hermes: Some features failed to load:', error);
    }
  }, 100);
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
