import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { visibleAny } from '../src/utils/ui';

test.describe('@a11y', () => {
  test('Errors announced to screen readers (or visible in common error regions)', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('not-a-real@example.com', 'Wrong!123');
    await page.waitForTimeout(1200);
    const alert = await visibleAny(page, [
      '[role="alert"]',
      '[role="status"]',
      '[aria-live="assertive"]',
      '[aria-live="polite"]',
      '.error, .error-message, .errors',
      '.alert, .alert-danger, .alert-error',
      '.MuiAlert-root, .MuiAlert-message',
      '.kc-feedback-text, .kc-feedback-error',
      '[data-testid*="alert"]',
      '[data-testid*="error"]',
      'text=/invalid|incorrect|wrong|failed|error/i',
      'input[aria-invalid="true"]',
      'input[aria-describedby*="error"]',
    ]);
    expect(alert, 'No accessible/visible error region found after invalid login').toBeTruthy();
  });
});
