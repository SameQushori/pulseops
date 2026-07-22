import { expect, expectNoSeriousAxeViolations, test } from './fixtures';

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
  test(`${name} has one h1 and no serious axe violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expectNoSeriousAxeViolations(page);
  });
}

test('reduced motion keeps the simulation functional without active CSS motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/app/overview');
  await page.getByRole('button', { name: 'Start simulation' }).click();
  await expect(
    page.getByRole('button', { name: 'Begin recovery' }),
  ).toBeVisible();

  const animatedElements = await page.locator('*').evaluateAll(
    (elements) =>
      elements.filter((element) => {
        const style = getComputedStyle(element);
        return (
          style.animationName !== 'none' &&
          Number.parseFloat(style.animationDuration) > 0.01
        );
      }).length,
  );
  expect(animatedElements).toBe(0);
  await expectNoSeriousAxeViolations(page);
});
