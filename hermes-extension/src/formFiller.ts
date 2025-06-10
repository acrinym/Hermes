import { ProfileData, SkippedField, matchProfileKey, getAssociatedLabelText } from './heuristics.ts';

export function fillForm(profile: ProfileData, collectSkipped = false): SkippedField[] {
    const skipped: SkippedField[] = [];
    const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
    fields.forEach(field => {
        const fieldType = (field as HTMLInputElement).type ? (field as HTMLInputElement).type.toLowerCase() : (field.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text');
        const match = matchProfileKey(profile, field);
        const key = match.key;
        if (key && profile[key] !== undefined) {
            if (fieldType === 'checkbox') {
                (field as HTMLInputElement).checked = profile[key].toLowerCase() === 'true' || profile[key] === (field as HTMLInputElement).value;
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
            skipped.push({ field, label, guess: key, score: match.score, reason: match.reason });
        }
    });
    return skipped;
}
