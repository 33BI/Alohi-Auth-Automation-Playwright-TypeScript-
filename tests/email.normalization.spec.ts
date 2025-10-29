import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { users } from '../src/utils/testData';
test('@p1 Email trimming & case normalization', async ({ page }) => {
  const weird = `  ${users.valid.email.toUpperCase()}  `;
  const login = new LoginPage(page);
  await login.goto();
  await login.login(weird, users.valid.password);
  await expect(page).not.toHaveURL(/\/protocol\/openid-connect\/auth/i);
});
