import { fillForm } from '@hermes/core';
import { getSettings } from './settings.ts';
import { ProfileData, SkippedField } from './heuristics.ts';
import { saveDataToBackground } from './storage/index.ts';

export async function runHeuristicTrainerSession(profile: ProfileData) {
  const settings = await getSettings();
  const skipped: SkippedField[] = await fillForm(profile, settings);
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
