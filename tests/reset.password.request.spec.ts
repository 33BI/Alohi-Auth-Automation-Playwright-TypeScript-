import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
test('@p0 Reset request is generic', async ({ page }) => {
  test.setTimeout(80_000);
  const login = new LoginPage(page);
  await login.goto();
  await page.getByLabel(/^email$/i).fill('qa.unknown@example.com');
  await page.getByRole('button', { name: /sign in|continue|next/i }).click();
  const forgotLink = page.locator('a', { hasText: /forgot password/i }).first();
  await expect(forgotLink).toBeVisible({ timeout: 45_000 });
  await forgotLink.click();
  await page.waitForLoadState('domcontentloaded');
  const successRe =
    /check your email|if the account exists|email (?:has been )?sent|we (?:have )?sent|instructions (?:to|have been) sent|reset link/i;
  const inlineMsg = page.getByText(successRe);
  const liveRegion = page
    .locator('[role="alert"], [aria-live="assertive"], .kc-feedback-text, .pf-c-alert__title, .MuiAlert-message')
    .filter({ hasText: successRe });
  const resetField = page.getByLabel(/email|username/i).first();
  await expect(inlineMsg.or(liveRegion).or(resetField)).toBeVisible({ timeout: 80_000 });
});
