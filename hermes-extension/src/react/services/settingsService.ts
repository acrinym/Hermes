// src/react/services/settingsService.ts

import { store } from '../store';

export async function getSettings() {
  return store.getState().settings.settings;
}
