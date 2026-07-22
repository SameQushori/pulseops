const numberFormatter = new Intl.NumberFormat('en-US');
const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const utcFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const utcTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatLatency = (value: number) =>
  `${numberFormatter.format(value)} ms`;
export const formatErrorRate = (value: number) =>
  `${decimalFormatter.format(value)}%`;
export const formatThroughput = (value: number) =>
  `${numberFormatter.format(value)} req/min`;
export const formatIncidentCount = (value: number) =>
  numberFormatter.format(value);
export const formatPercentage = (value: number) =>
  `${decimalFormatter.format(value)}%`;

export function formatUtcTimestamp(value: string) {
  return `${utcFormatter.format(new Date(value))} UTC`;
}

export function formatUtcTime(value: string) {
  return utcTimeFormatter.format(new Date(value));
}
