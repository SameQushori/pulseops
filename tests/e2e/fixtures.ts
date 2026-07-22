import { expect, test as base, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type TestFixtures = {
  consoleAudit: void;
};

export const test = base.extend<TestFixtures>({
  consoleAudit: [
    async ({ page }, use) => {
      const messages: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') {
          messages.push(`${message.type()}: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => {
        messages.push(`pageerror: ${error.message}`);
      });
      await use();
      expect(messages, 'browser console warnings/errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function expectNoSeriousAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const seriousViolations = violations.filter(
    ({ impact }) => impact === 'critical' || impact === 'serious',
  );
  expect(seriousViolations).toEqual([]);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}
