import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { appStore, type AppStore } from '../store/store';

interface AppProvidersProps extends PropsWithChildren {
  store?: AppStore;
}

export function AppProviders({
  children,
  store = appStore,
}: AppProvidersProps) {
  return <Provider store={store}>{children}</Provider>;
}
