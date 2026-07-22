import { expect, test } from './fixtures';

test('incident filters survive reload through the canonical URL', async ({
  page,
}) => {
  await page.goto('/app/incidents');
  await page.getByLabel('Severity').selectOption('sev1');
  await page.getByLabel('Status').selectOption('resolved');

  await expect(page).toHaveURL(
    /\/app\/incidents\?status=resolved&severity=sev1$/,
  );
  await expect(
    page.getByRole('link', { name: 'Login rate limit saturation' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Checkout submission errors' }),
  ).not.toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Severity')).toHaveValue('sev1');
  await expect(page.getByLabel('Status')).toHaveValue('resolved');
  await expect(
    page.getByRole('link', { name: 'Login rate limit saturation' }),
  ).toBeVisible();
});
