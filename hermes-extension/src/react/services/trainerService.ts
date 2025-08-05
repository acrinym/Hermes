// src/react/services/trainerService.ts

import { fillForm, ProfileData, SkippedField } from '@hermes/core';
import { saveDataToBackground } from './storageService';

export async function startHeuristicTraining(profile: ProfileData): Promise<SkippedField[]> {
  // Pass default settings so fillForm doesn't expect them from callers
  const skipped = await fillForm(profile, {});
  return skipped;
}

export async function saveProfileData(profile: ProfileData): Promise<void> {
  await saveDataToBackground('hermes_profile_ext', profile);
}
