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

/**
 * Exports specific user data (settings and macros) to a JSON file.
 * This combines the specific key targeting from 'main' with the download logic.
 */
export function exportData(): void {
  // Logic is from the 'main' branch, ensuring we only get specific keys
  browserApi.storage.local.get([SETTINGS_KEY, MACROS_KEY], (data: any) => {
    if (browserApi.runtime.lastError) {
      console.error(browserApi.runtime.lastError.message);
      return;
    }

    // We structure the output object explicitly for safety
    const dataToExport = {
      [SETTINGS_KEY]: data[SETTINGS_KEY] || {},
      [MACROS_KEY]: data[MACROS_KEY] || {},
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hermes-data.json';
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

/**
 * Imports user data from a JSON file, only setting the recognized keys.
 * This uses the async/await pattern from 'main' for cleaner asynchronous code.
 * The function signature is adapted to match what the UI component expects.
 */
export async function importData(files: FileList | null): Promise<void> {
  if (!files || !files.length) {
    console.log('No file selected for import.');
    return;
  }
  
  const file = files[0];
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    // Explicitly prepare the data to be set, ignoring other keys in the file
    const dataToImport = {
      [SETTINGS_KEY]: parsed[SETTINGS_KEY] || {},
      [MACROS_KEY]: parsed[MACROS_KEY] || {},
    };

    // Use a Promise wrapper for the callback-based set API for robust error handling
    await new Promise<void>((resolve, reject) => {
      browserApi.storage.local.set(dataToImport, () => {
        if (browserApi.runtime.lastError) {
          reject(browserApi.runtime.lastError.message);
        } else {
          resolve();
          // You might want to reload the page or notify the user of success here
          alert('Data imported successfully! The page will now reload.');
          window.location.reload();
        }
      });
    });
  } catch (err) {
    console.error('Invalid backup JSON or import failed', err);
    alert(`Error importing file: ${err.message}`);
  }
}