import { expect, expectNoSeriousAxeViolations, test } from './fixtures';

test('completes the deterministic incident workflow and recovers Overview', async ({
  page,
}) => {
  await page.goto('/app/overview');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Overview' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Start simulation' }).click();
  await expect(
    page.getByText('Telemetry is moving through a fixed degradation sequence.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Begin recovery' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Payments API/i }).getByText('Degraded'),
  ).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  await page.getByRole('link', { name: 'Incidents' }).first().click();
  await page
    .getByRole('link', {
      name: 'Payments API latency and error-rate degradation',
    })
    .click();

  await page.getByLabel('Incident status').selectOption('identified');
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Status changed to identified.' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add note' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add incident note' });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel('Note')
    .fill('Confirmed deterministic E2E response context.');
  await expectNoSeriousAxeViolations(page);
  await dialog.getByRole('button', { name: 'Add note' }).click();
  await expect(
    page.getByText('Confirmed deterministic E2E response context.'),
  ).toBeVisible();

  await page.getByLabel('Incident status').selectOption('monitoring');
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Status changed to monitoring.' }),
  ).toBeVisible();
  await expect(page.getByText('Resolved').first()).toBeVisible();

  await page.getByRole('link', { name: 'Overview' }).first().click();
  await expect(
    page.getByText(
      'All monitored services are operating within their objectives.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Payments API/i }).getByText('Operational'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(
    page.getByRole('button', { name: 'Start simulation' }),
  ).toBeVisible();
});

test('critical workflow is keyboard operable and dialog restores focus', async ({
  page,
}) => {
  await page.goto('/app/incidents/incident-payments-latency');
  const addNote = page.getByRole('button', { name: 'Add note' });
  await addNote.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Add incident note' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Author')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(addNote).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(addNote).toBeFocused();
});
