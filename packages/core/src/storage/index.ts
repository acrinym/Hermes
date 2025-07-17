declare const chrome: any;
export function saveDataToBackground(storageKey: string, data: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'SAVE_HERMES_DATA', payload: { key: storageKey, value: data } },
      (response: any) => {
        if (chrome.runtime.lastError) {
          console.error(`Hermes CS: Error saving ${storageKey}:`, chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
          return;
        }
        if (response && response.success) {
          console.log(`Hermes CS: Data for ${storageKey} saved via background.`);
          resolve(true);
        } else {
          const errorMsg = response ? response.error : `Unknown error saving ${storageKey}`;
          console.error(`Hermes CS: Error saving ${storageKey} via background:`, errorMsg);
          reject(errorMsg);
        }
      }
    );
  });
}

export function getInitialData(): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_HERMES_INITIAL_DATA' }, resolve);
  });
}
