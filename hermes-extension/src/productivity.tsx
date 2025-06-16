import React, { useEffect, useState } from 'react';
import { saveDataToBackground } from './storage/index.ts';
import { t } from '../i18n.js';

const AFFIRM_KEY = 'hermes_affirmations_state_ext';
let overlayEl: HTMLDivElement | null = null;

function parseRGB(str: string): [number, number, number] {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)] : [255, 255, 255];
}

function brightness([r, g, b]: [number, number, number]): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function adjust([r, g, b]: [number, number, number], amt: number): [number, number, number] {
  return [
    Math.max(0, Math.min(255, r + amt)),
    Math.max(0, Math.min(255, g + amt)),
    Math.max(0, Math.min(255, b + amt))
  ];
}

function getTextColor(): string {
  const rgb = parseRGB(getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)');
  const delta = brightness(rgb) > 128 ? -60 : 60;
  const [r, g, b] = adjust(rgb, delta);
  return `rgb(${r},${g},${b})`;
}

function showOverlay() {
  if (!overlayEl) {
    overlayEl = document.createElement('div');
    overlayEl.id = 'hermes-affirm';
    overlayEl.textContent = 'You are doing great!';
    overlayEl.style.cssText =
      'position:fixed;bottom:10px;right:10px;padding:8px 12px;border-radius:4px;font-family:sans-serif;z-index:2147483647;pointer-events:none;';
    document.body.appendChild(overlayEl);
  }
  overlayEl.style.color = getTextColor();
  overlayEl.style.display = 'block';
}

function hideOverlay() {
  if (overlayEl) overlayEl.style.display = 'none';
}

export function initAffirmations(enabled: boolean) {
  if (enabled) showOverlay();
}

export function setAffirmations(enabled: boolean) {
  saveDataToBackground(AFFIRM_KEY, enabled).catch(e => console.error('Affirm save failed', e));
  if (enabled) showOverlay();
  else hideOverlay();
}

export function AffirmationToggle() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    chrome.storage.local.get([AFFIRM_KEY], res => setEnabled(!!res[AFFIRM_KEY]));
  }, []);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setEnabled(val);
    setAffirmations(val);
  };
  return (
    <label>
      <input type="checkbox" checked={enabled} onChange={onChange} /> {t('ENABLE_AFFIRM')}
    </label>
  );
}
