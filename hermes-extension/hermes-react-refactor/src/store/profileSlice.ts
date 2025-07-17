// hermes-react-refactor/src/store/profileSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { saveDataToBackground, getInitialData } from '../services/storageService';
import { ProfileData } from '@hermes/core';

export interface ProfileState {
  profile: ProfileData;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ProfileState = {
  profile: {},
  status: 'idle',
};

export const loadProfile = createAsyncThunk('profile/load', async () => {
  const data = await getInitialData();
  return data.profile || {};
});

export const saveProfile = createAsyncThunk('profile/save', async (profile: ProfileData) => {
  await saveDataToBackground('hermes_profile_ext', profile);
  return profile;
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<ProfileData>) => {
      state.profile = { ...state.profile, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { updateProfile } = profileSlice.actions;
export default profileSlice.reducer;