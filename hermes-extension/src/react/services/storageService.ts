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

export function exportData(): void {
  chrome.storage.local.get(null, data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hermes-data.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

export function importData(files: FileList | null): void {
  if (!files || !files.length) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result as string);
      chrome.storage.local.set(obj);
    } catch (e) {
      console.error('Invalid backup JSON', e);
    }
  };
  reader.readAsText(files[0]);
}
