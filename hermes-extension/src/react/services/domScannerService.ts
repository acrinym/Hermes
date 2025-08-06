// src/react/services/domScannerService.ts
export interface ElementConfig {
  selector: string;
  type: string;
  name: string;
}

export interface SiteConfig {
  elements: ElementConfig[];
  lastUpdated: string;
}

import { browserApi } from '../utils/browserApi';

function getSelector(el: Element): string {
  if ((el as HTMLElement).id) {
    return `#${(el as HTMLElement).id}`;
  }
  if (el.tagName === 'BODY') return 'BODY';
  if (!el.parentElement) return el.tagName;

  const siblings = Array.from(el.parentElement.children);
  const sameTagSiblings = siblings.filter(e => e.tagName === el.tagName);
  const index = sameTagSiblings.indexOf(el);

  let selector = el.tagName.toLowerCase();
  if (sameTagSiblings.length > 1) {
    selector += `:nth-of-type(${index + 1})`;
  }

  return `${getSelector(el.parentElement)} > ${selector}`;
}

export function scanDOM(): SiteConfig {
  const inputs = document.querySelectorAll('input, button, select, textarea');
  const elements: ElementConfig[] = [];
  inputs.forEach(el => {
    const input = el as HTMLInputElement;
    if (input.type === 'hidden' || input.type === 'submit') return;
    elements.push({
      selector: getSelector(input),
      type: input.tagName.toLowerCase(),
      name: input.name || input.id || input.placeholder || `unnamed-${input.type}`,
    });
  });

  return {
    elements,
    lastUpdated: new Date().toISOString(),
  };
}

export async function ensureSiteConfig() {
  const site = location.hostname.toLowerCase();
  const existing = await browserApi.runtime.sendMessage({ type: 'GET_SITE_CONFIG', payload: { site } });
  if (existing && existing.success) return;

  const config = scanDOM();
  const result = await browserApi.runtime.sendMessage({ type: 'SAVE_SITE_CONFIG', payload: { site, config } });
  if (result && result.success) {
    alert(`Hermes: Config saved for ${site}`);
  }
}