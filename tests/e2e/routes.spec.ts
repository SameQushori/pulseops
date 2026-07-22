import { expect, expectNoSeriousAxeViolations, test } from './fixtures';

test('application smoke routes render useful destination content', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'See an incident unfold. Resolve it before users notice.',
    }),
  ).toBeVisible();

  await page.goto('/app/services');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Services' }),
  ).toBeVisible();
  await page.getByRole('link', { name: /Payments API/i }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Payments API' }),
  ).toBeVisible();

  await page.goto('/app/incidents/incident-payments-latency');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Elevated payment authorization latency',
    }),
  ).toBeVisible();

  await page.goto('/app/not-a-route');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});

test('landing initial request graph excludes application and chart chunks', async ({
  page,
}) => {
  const scripts = new Set<string>();
  page.on('request', (request) => {
    const url = request.url();
    if (request.resourceType() === 'script') scripts.add(url);
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const requestedScripts = [...scripts].join('\n');
  expect(requestedScripts).not.toContain('OverviewPage');
  expect(requestedScripts).not.toContain('MetricPerformanceChart');
  expect(requestedScripts).not.toContain('recharts');
});
