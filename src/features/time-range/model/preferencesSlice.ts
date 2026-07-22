import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type TimeRange = '30m' | '1h' | '6h';

export interface PreferencesState {
  timeRange: TimeRange;
}

const initialState: PreferencesState = {
  timeRange: '30m',
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    timeRangeChanged(state, action: PayloadAction<TimeRange>) {
      state.timeRange = action.payload;
    },
  },
});

export const { timeRangeChanged } = preferencesSlice.actions;
export const preferencesReducer = preferencesSlice.reducer;
export const selectTimeRange = (state: { preferences: PreferencesState }) =>
  state.preferences.timeRange;
