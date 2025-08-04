import React, { useEffect, useState } from 'react';
import { t } from '../i18n.js';

declare const chrome: any;

const NARRATOR_KEY = 'hermes_narrator_enabled_ext';
let enabled = false;

function speak(text: string) {
  if (!enabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utter);
}

function onFocus(e: FocusEvent) {
  const el = e.target as HTMLElement;
  if (!el) return;
  const label = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '';
  if (label) speak(label.trim());
}

export function initNarrator() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([NARRATOR_KEY], res => {
      enabled = !!res[NARRATOR_KEY];
      if (enabled) document.addEventListener('focusin', onFocus);
    });
  }
}

export function setNarrator(val: boolean) {
  enabled = val;
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [NARRATOR_KEY]: val });
  }
  if (enabled) document.addEventListener('focusin', onFocus);
  else document.removeEventListener('focusin', onFocus);
}

export function NarratorToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([NARRATOR_KEY], res => setOn(!!res[NARRATOR_KEY]));
    }
  }, []);
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setOn(val);
    setNarrator(val);
    if (val) speak(t('NARRATOR_ENABLED'));
    else speak(t('NARRATOR_DISABLED'));
  };
  return (
    <label>
      <input type="checkbox" checked={on} onChange={handle} /> {t('ENABLE_NARRATOR')}
    </label>
  );
}

export { speak };
