// src/react/store/settingsSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { defaultSettings } from '../config/defaultSettings';
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
  return { ...defaultSettings, ...(data.settings || {}) };
});

export const saveSettings = createAsyncThunk('settings/save', async (settings: any) => {
  await saveDataToBackground('hermes_settings_v1_ext', settings);
  return settings;
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