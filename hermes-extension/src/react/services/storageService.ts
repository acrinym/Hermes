// src/react/services/storageService.ts

import browser from '../utils/browserApi';

export function saveDataToBackground(key: string, data: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage(
      { type: 'SAVE_HERMES_DATA', payload: { key, value: data } },
      (response: any) => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError.message);
          return;
        }
        if (response && response.success) {
          resolve(true);
        } else {
          reject(response ? response.error : 'Unknown error');
        }
      }
    );
  });
}

export function getInitialData(): Promise<any> {
  return new Promise(resolve => {
    browser.runtime.sendMessage({ type: 'GET_HERMES_INITIAL_DATA' }, resolve);
  });
}
