// hermes-react-refactor/src/services/formFillerService.ts

import { ProfileData, SkippedField, matchProfileKey, getAssociatedLabelText } from './heuristicsService';
import { getSettings } from './settingsService';

export async function fillForm(profile: ProfileData): Promise<SkippedField[]> {
  const settings = await getSettings();

  const skipped: SkippedField[] = [];
  const collectSkipped = settings.collectSkipped ?? false;
  const overwriteExisting = settings.overwriteExisting ?? true;
  const logSkipped = settings.logSkipped ?? false;

  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');

  fields.forEach(field => {
    const fieldType = (field as HTMLInputElement).type
      ? (field as HTMLInputElement).type.toLowerCase()
      : (field.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text');

    const match = matchProfileKey(profile, field);
    const key = match.key;

    if (key && profile[key] !== undefined) {
      if (!overwriteExisting && (field as HTMLInputElement).value) return;

      if (fieldType === 'checkbox') {
        (field as HTMLInputElement).checked =
          profile[key].toLowerCase() === 'true' ||
          profile[key] === (field as HTMLInputElement).value;
      } else if (fieldType === 'radio') {
        if ((field as HTMLInputElement).value === profile[key]) {
          (field as HTMLInputElement).checked = true;
        }
      } else {
        (field as HTMLInputElement).value = profile[key];
      }

      field.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (collectSkipped) {
      const label = getAssociatedLabelText(field) || field.name || field.id || 'field';
      const skipData = {
        field,
        label,
        guess: key,
        score: match.score,
        reason: match.reason
      };
      skipped.push(skipData);
      if (logSkipped) console.warn('[formFiller] Skipped:', skipData);
    }
  });

  return skipped;
}
