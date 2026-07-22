import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectTimeRange,
  timeRangeChanged,
  type TimeRange,
} from '../../../features/time-range/model/preferencesSlice';
import styles from '../OverviewPage.module.css';

const options: Array<{ label: string; value: TimeRange }> = [
  { label: '30 min', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '6 hours', value: '6h' },
];

export function TimeRangeControl() {
  const dispatch = useAppDispatch();
  const selectedRange = useAppSelector(selectTimeRange);

  return (
    <fieldset className={styles.timeRange}>
      <legend>Time range</legend>
      <div className={styles.timeRangeOptions}>
        {options.map(({ label, value }) => (
          <label className={styles.timeRangeOption} key={value}>
            <input
              checked={selectedRange === value}
              name="overview-time-range"
              onChange={() => dispatch(timeRangeChanged(value))}
              type="radio"
              value={value}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
