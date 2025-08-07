// src/react/services/marketplaceService.ts

import { saveDataToBackground } from './storageService';

export interface MarketplacePlugin {
  name: string;
  description: string;
  version: string;
  downloadUrl: string;
}

const MANIFEST_URL = 'https://example.com/marketplace.json';

export async function fetchMarketplaceManifest(): Promise<MarketplacePlugin[]> {
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch manifest: ${res.status}`);
  }
  const data = await res.json();
  return data.plugins || [];
}

export async function downloadPlugin(plugin: MarketplacePlugin): Promise<boolean> {
  const res = await fetch(plugin.downloadUrl);
  if (!res.ok) {
    throw new Error(`Failed to download plugin: ${res.status}`);
  }
  const content = await res.text();
  await saveDataToBackground(`plugin_${plugin.name}`, content);
  return true;
}
