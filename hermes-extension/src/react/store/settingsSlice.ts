// src/react/store/settingsSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { defaultSettings, legacySettingNameMap } from '../config/defaultSettings';
import { saveDataToBackground, getInitialData } from '../services/storageService';

export interface SettingsState {
  settings: typeof defaultSettings;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: SettingsState = {
  settings: defaultSettings,
  status: 'idle',
};

export const loadSettings = createAsyncThunk('settings/load', async () => {
  const data = await getInitialData();
  const stored = data.settings || {};

  // Translate legacy settings to the spiffy new structure 🛠️
  const translate = (settings: any) => {
    const result = { ...settings };
    const moveValue = (from: string, to: string) => {
      const fromParts = from.split('.');
      const toParts = to.split('.');

      let fromObj = result;
      for (let i = 0; i < fromParts.length - 1; i++) {
        fromObj = fromObj?.[fromParts[i]];
        if (!fromObj) return;
      }
      const val = fromObj[fromParts[fromParts.length - 1]];
      if (val === undefined) return;

      let toObj = result;
      for (let i = 0; i < toParts.length - 1; i++) {
        if (typeof toObj[toParts[i]] !== 'object' || toObj[toParts[i]] === null) {
          toObj[toParts[i]] = {};
        }
        toObj = toObj[toParts[i]];
      }
      toObj[toParts[toParts.length - 1]] = val;
      delete fromObj[fromParts[fromParts.length - 1]];
    };

    Object.entries(legacySettingNameMap).forEach(([oldName, newName]) => moveValue(oldName, newName));
    return result;
  };

  const translated = translate(stored);
  return { ...defaultSettings, ...translated };
});

export const saveSettings = createAsyncThunk('settings/save', async (settings: any) => {
  await saveDataToBackground('hermes_settings_v1_ext', settings);
  return settings;
});

export const saveScheduleSettings = createAsyncThunk('settings/saveSchedule', async (scheduleSettings: any) => {
  await saveDataToBackground('hermes_schedule_settings_ext', scheduleSettings);
  return scheduleSettings;
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<any>) => {
      state.settings = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { updateSettings } = settingsSlice.actions;
export default settingsSlice.reducer;