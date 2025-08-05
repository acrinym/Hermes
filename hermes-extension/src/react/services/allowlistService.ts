import { saveDataToBackground, getInitialData } from './storageService';

export async function loadWhitelist(): Promise<string[]> {
  const data = await getInitialData();
  return data.whitelist || [];
}

export function saveWhitelist(list: string[]) {
  return saveDataToBackground('hermes_whitelist_ext', list);
}
