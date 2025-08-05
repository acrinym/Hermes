// src/react/services/storageService.ts
import { browserApi } from '../utils/browserApi';

const SETTINGS_KEY = 'hermes_settings_v1_ext';
const MACROS_KEY = 'hermes_macros_ext';

export function saveDataToBackground(key: string, data: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    browserApi.runtime.sendMessage(
      { type: 'SAVE_HERMES_DATA', payload: { key, value: data } },
      (response: any) => {
        if (browserApi.runtime.lastError) {
          reject(browserApi.runtime.lastError.message);
          return;
        }
        if (response && response.success) {
          resolve(true);
        } else {
          reject(response.error || 'Failed to save data');
        }
      }
    );
  });
}

export function getInitialData(): Promise<any> {
  return new Promise(resolve => {
    browserApi.runtime.sendMessage({ type: 'GET_HERMES_INITIAL_DATA' }, resolve);
  });
}

export function exportBackup(): Promise<string> {
  return new Promise((resolve, reject) => {
    browserApi.storage.local.get([SETTINGS_KEY, MACROS_KEY], (data: any) => {
      if (browserApi.runtime.lastError) {
        reject(browserApi.runtime.lastError.message);
        return;
      }
      const out = {
        settings: data[SETTINGS_KEY] || {},
        macros: data[MACROS_KEY] || {},
      };
      resolve(JSON.stringify(out, null, 2));
    });
  });
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  return new Promise((resolve, reject) => {
    browserApi.storage.local.set(
      {
        [SETTINGS_KEY]: parsed.settings || {},
        [MACROS_KEY]: parsed.macros || {},
      },
      () => {
        if (browserApi.runtime.lastError) {
          reject(browserApi.runtime.lastError.message);
        } else {
          resolve();
        }
      }
    );
  });
}