// hermes-react-refactor/src/services/trainerService.ts

import { fillForm } from './formFillerService';
import { ProfileData, SkippedField } from './heuristicsService';
import { saveDataToBackground } from './storageService';

export async function startHeuristicTraining(profile: ProfileData): Promise<SkippedField[]> {
  const skipped = await fillForm(profile);
  return skipped;
}

export async function saveProfileData(profile: ProfileData): Promise<void> {
  await saveDataToBackground('hermes_profile_ext', profile);
}
