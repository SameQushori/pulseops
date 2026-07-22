import { configureStore } from '@reduxjs/toolkit';

import { preferencesReducer } from '../../features/time-range/model/preferencesSlice';
import { createSimulationListenerMiddleware } from '../../features/incident-simulation/model/simulationListeners';
import { simulationReducer } from '../../features/incident-simulation/model/simulationSlice';
import { baseApi } from '../../shared/api/baseApi';

export function createAppStore() {
  const simulationListenerMiddleware = createSimulationListenerMiddleware();
  return configureStore({
    reducer: {
      preferences: preferencesReducer,
      simulation: simulationReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        simulationListenerMiddleware.middleware,
        baseApi.middleware,
      ),
  });
}

export const appStore = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
