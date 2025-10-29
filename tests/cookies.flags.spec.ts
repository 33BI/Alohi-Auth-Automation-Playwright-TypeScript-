import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { users } from '../src/utils/testData';
import { findSessionCookie, isSecure } from '../src/utils/cookies';
test('@security Cookie flags & domain', async ({ page, context }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(users.valid.email, users.valid.password);
  const c = await findSessionCookie(context);
  if (c) {
    expect(isSecure(c)).toBeTruthy();
    expect(c.domain).toMatch(/alohi\.com$/i);
  }
  const docCookie = await page.evaluate(() => document.cookie || '');
  expect(/\b(token|idtoken|access|refresh|jwt)\b/i.test(docCookie)).toBeFalsy();
});
