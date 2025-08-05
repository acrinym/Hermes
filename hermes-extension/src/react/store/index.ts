// src/react/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './settingsSlice';
import macrosReducer from './macrosSlice';
import profileReducer from './profileSlice';
import themeReducer from './themeSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    macros: macrosReducer,
    profile: profileReducer,
    theme: themeReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;