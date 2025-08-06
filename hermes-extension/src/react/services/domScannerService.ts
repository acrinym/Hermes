export interface SiteConfig {
  fields: string[];
  buttons: string[];
  scroll: { x: number; y: number; width: number; height: number };
  viewport: { width: number; height: number };
  lastUpdated: string;
}

import browser from '../utils/browserApi';

function getSelector(el: Element): string {
  if ((el as HTMLElement).id) {
    return `#${(el as HTMLElement).id}`;
  }
  let selector = el.tagName.toLowerCase();
  const nameAttr = el.getAttribute('name');
  if (nameAttr) {
    selector += `[name="${nameAttr}"]`;
    return selector;
  }
  if (el.classList.length > 0) {
    selector += `.${el.classList[0]}`;
  }
  const parent = el.parentElement;
  if (parent) {
    const index = Array.from(parent.children).indexOf(el) + 1;
    selector = `${parent.tagName.toLowerCase()} > ${selector}:nth-child(${index})`;
  }
  return selector;
}

export function scanDOM(): SiteConfig {
  const fieldElements = document.querySelectorAll('input, textarea, [contenteditable]');
  const fields = Array.from(fieldElements).map(getSelector);

  const buttonElements = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"], a[href]');
  const buttons = Array.from(buttonElements).map(getSelector);

  const scroll = {
    x: window.scrollX,
    y: window.scrollY,
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight
  };
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  return {
    fields,
    buttons,
    scroll,
    viewport,
    lastUpdated: new Date().toISOString()
  };
}

export async function ensureSiteConfig() {
  const site = location.hostname.toLowerCase();
  const existing = await browser.runtime.sendMessage({ type: 'GET_SITE_CONFIG', payload: { site } });
  if (existing && existing.success) return;
  const config = scanDOM();
  const result = await browser.runtime.sendMessage({ type: 'SAVE_SITE_CONFIG', payload: { site, config } });
  if (result && result.success) {
    alert(`Hermes: Config saved for ${site}`);
  }
}
