import { fillForm } from './formFiller.ts';
import { ProfileData, SkippedField } from './heuristics.ts';
import { saveDataToBackground } from './storage/index.ts';

export async function runHeuristicTrainerSession(profile: ProfileData) {
    const skipped: SkippedField[] = fillForm(profile, true);
    for (const s of skipped) {
        const chosen = prompt(`Profile key for field "${s.label}"`, s.guess || '');
        if (chosen) {
            const val = prompt(`Value for '${chosen}'`, profile[chosen] || '');
            if (val !== null) {
                profile[chosen] = val;
            }
        }
    }
    await saveDataToBackground('hermes_profile_ext', profile);
}
