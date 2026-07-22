import { createAppStore } from '../../../app/store/store';
import { selectTimeRange, timeRangeChanged } from './preferencesSlice';

describe('preferencesSlice', () => {
  it('owns the global time range with a 30 minute default', () => {
    const store = createAppStore();

    expect(selectTimeRange(store.getState())).toBe('30m');
    store.dispatch(timeRangeChanged('1h'));
    expect(selectTimeRange(store.getState())).toBe('1h');
  });

  it('keeps createAppStore instances isolated', () => {
    const first = createAppStore();
    const second = createAppStore();

    first.dispatch(timeRangeChanged('6h'));

    expect(selectTimeRange(first.getState())).toBe('6h');
    expect(selectTimeRange(second.getState())).toBe('30m');
  });
});
