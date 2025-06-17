// hermes-react-refactor/src/store/themeSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { saveDataToBackground, getInitialData } from '../services/storageService';

export interface ThemeState {
  theme: string;
}

const initialState: ThemeState = {
  theme: 'dark'
};

export const loadTheme = createAsyncThunk('theme/load', async () => {
  const data = await getInitialData();
  return data.theme || 'dark';
});

export const saveTheme = createAsyncThunk('theme/save', async (theme: string) => {
  await saveDataToBackground('hermes_theme_ext', theme);
  return theme;
});

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    }
  },
  extraReducers: builder => {
    builder.addCase(loadTheme.fulfilled, (state, action) => {
      state.theme = action.payload;
    });
    builder.addCase(saveTheme.fulfilled, (state, action) => {
      state.theme = action.payload;
    });
  }
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
