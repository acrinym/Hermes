import { saveDataToBackground } from './storage/index.ts';

export function exportProfile(profile: Record<string, any>): void {
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hermes-profile.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importProfileFromFile(): Promise<Record<string, any> | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result as string);
          saveDataToBackground('hermes_profile_ext', obj).catch(e => console.error('BG save fail', e));
          resolve(obj);
        } catch (e) {
          console.error('Invalid profile JSON', e);
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
