import { saveDataToBackground, getInitialData } from './storage/index.ts';
import { defaultSettings } from './defaultSettings.ts';

export interface Settings {
    [key: string]: any;
}

export async function loadSettings(): Promise<Settings> {
    const data = await getInitialData();
    return { ...defaultSettings, ...(data.settings || {}) };
}

export function saveSettings(settings: Settings) {
    return saveDataToBackground('hermes_settings_v1_ext', settings);
}

export { defaultSettings };
