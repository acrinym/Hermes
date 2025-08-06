import { saveDataToBackground } from './storageService';
import { browserApi } from '../utils/browserApi';

const AFFIRM_KEY = 'hermes_affirmations_state_ext';
let overlayEl: HTMLDivElement | null = null;

const affirmations = [
  'You are capable of amazing things.',
  'Your hard work will pay off.',
  'Stay positive and strong.',
  'Believe in your abilities.',
  'Every step forward is a victory.',
  'You are a problem-solving genius.',
];

function getRandomAffirmation() {
  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

function showAffirmation() {
  if (!overlayEl) {
    overlayEl = document.createElement('div');
    overlayEl.style.position = 'fixed';
    overlayEl.style.bottom = '20px';
    overlayEl.style.right = '20px';
    overlayEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlayEl.style.color = 'white';
    overlayEl.style.padding = '10px 20px';
    overlayEl.style.borderRadius = '5px';
    overlayEl.style.zIndex = '2147483647';
    overlayEl.style.opacity = '0';
    overlayEl.style.transition = 'opacity 0.5s';
    document.body.appendChild(overlayEl);
  }

  overlayEl.textContent = getRandomAffirmation();
  overlayEl.style.opacity = '1';

  setTimeout(() => {
    if (overlayEl) {
      overlayEl.style.opacity = '0';
    }
  }, 4000);
}

export function setAffirmations(enabled: boolean) {
  saveDataToBackground(AFFIRM_KEY, enabled);
  if (enabled) {
    showAffirmation();
    setInterval(showAffirmation, 600000); // every 10 minutes
  }
}

export function getAffirmationState(): Promise<boolean> {
  return new Promise(resolve => {
    if (!browserApi?.storage?.local) {
      resolve(false);
      return;
    }
    browserApi.storage.local.get([AFFIRM_KEY], res => resolve(!!res[AFFIRM_KEY]));
  });
}