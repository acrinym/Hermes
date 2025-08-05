// src/react/services/storageService.ts

export function saveDataToBackground(key: string, data: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'SAVE_HERMES_DATA', payload: { key, value: data } },
      (response: any) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
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
    chrome.runtime.sendMessage({ type: 'GET_HERMES_INITIAL_DATA' }, resolve);
  });
}
