import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { users } from '../src/utils/testData';
test.describe('@smoke @p0 Identity login (happy path)', () => {
  test('2-step login works', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.valid.email, users.valid.password);
    await expect(page).not.toHaveURL(/\/protocol\/openid-connect\/auth/i);
  });
});
