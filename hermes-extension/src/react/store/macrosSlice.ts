// hermes-react-refactor/src/store/macrosSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { saveDataToBackground, getInitialData } from '../services/storageService';
import { MacroEvent } from '@hermes/core';

export interface MacrosState {
  macros: Record<string, MacroEvent[]>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  recordingState: 'idle' | 'recording';
}

const initialState: MacrosState = {
  macros: {},
  status: 'idle',
  recordingState: 'idle',
};

export const loadMacros = createAsyncThunk('macros/load', async () => {
  const data = await getInitialData();
  return data.macros || {};
});

export const saveMacros = createAsyncThunk('macros/save', async (_, { getState }) => {
    const state = getState() as { macros: MacrosState };
    await saveDataToBackground('hermes_macros_ext', state.macros.macros);
    return state.macros.macros;
});

const macrosSlice = createSlice({
  name: 'macros',
  initialState,
  reducers: {
    setRecordingState: (state, action: PayloadAction<'idle' | 'recording'>) => {
        state.recordingState = action.payload;
    },
    addMacro: (state, action: PayloadAction<{ name: string; events: MacroEvent[] }>) => {
      state.macros[action.payload.name] = action.payload.events;
    },
    deleteMacro: (state, action: PayloadAction<string>) => {
      delete state.macros[action.payload];
    },
    renameMacro: (state, action: PayloadAction<{ oldName: string; newName: string }>) => {
      if (state.macros[action.payload.oldName]) {
        state.macros[action.payload.newName] = state.macros[action.payload.oldName];
        delete state.macros[action.payload.oldName];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMacros.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.macros = action.payload;
      })
      .addCase(saveMacros.fulfilled, (state, action) => {
        state.macros = action.payload;
      });
  },
});

export const { setRecordingState, addMacro, deleteMacro, renameMacro } = macrosSlice.actions;
export default macrosSlice.reducer;