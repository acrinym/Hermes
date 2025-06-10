import { saveDataToBackground, getInitialData } from './storage/index.ts';

export async function loadWhitelist(): Promise<string[]> {
    const data = await getInitialData();
    return data.whitelist || [];
}

export function saveWhitelist(list: string[]) {
    return saveDataToBackground('hermes_whitelist_ext', list);
}

export function isAllowed(domain: string, list: string[]): boolean {
    if (list.includes('*')) return true;
    return list.some(entry => {
        const clean = entry.startsWith('*.') ? entry.slice(2) : entry;
        return domain === clean || domain.endsWith('.' + clean);
    });
}
