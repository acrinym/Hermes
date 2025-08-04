const HIGH_CONTRAST_KEY = 'hermes_high_contrast_ext';
declare const chrome: any;

export function applyHighContrast(enabled: boolean) {
  if (enabled) {
    document.body.classList.add('high-contrast');
    const host = document.getElementById('hermes-shadow-host');
    if (host) host.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
    const host = document.getElementById('hermes-shadow-host');
    if (host) host.classList.remove('high-contrast');
  }
}

export function initHighContrast(): Promise<boolean> {
  return new Promise(resolve => {
    chrome.storage.local.get([HIGH_CONTRAST_KEY], data => {
      const enabled = !!data[HIGH_CONTRAST_KEY];
      applyHighContrast(enabled);
      resolve(enabled);
    });
  });
}

export function setHighContrast(enabled: boolean) {
  chrome.storage.local.set({ [HIGH_CONTRAST_KEY]: enabled });
  applyHighContrast(enabled);
}

export { HIGH_CONTRAST_KEY };
