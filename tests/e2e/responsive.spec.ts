import {
  expect,
  expectNoHorizontalOverflow,
  expectNoSeriousAxeViolations,
  test,
} from './fixtures';

const routes = [
  ['Landing', '/'],
  ['Overview', '/app/overview'],
  ['Incidents', '/app/incidents'],
  ['Incident details', '/app/incidents/incident-payments-latency'],
  ['Services', '/app/services'],
  ['Service details', '/app/services/service-payments'],
  ['404', '/missing-route'],
] as const;

for (const [name, route] of routes) {
  test(`${name} fits the required responsive viewport`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAxeViolations(page);
  });
}

test('mobile note dialog remains reachable and contained', async ({ page }) => {
  await page.goto('/app/incidents/incident-payments-latency');
  await page.getByRole('button', { name: 'Add note' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add incident note' });
  await expect(dialog).toBeInViewport();
  await expect(
    dialog.getByRole('button', { name: 'Add note' }),
  ).toBeInViewport();
  await expectNoHorizontalOverflow(page);
});
