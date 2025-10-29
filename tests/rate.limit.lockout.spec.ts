import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { users, routes, LOCKOUT_N } from '../src/utils/testData';
const WRONG = 'Wrong!123';
const genericErr = /invalid|incorrect|wrong (?:email|username|password)|try again|error/i;
const lockoutErr = /locked|too many attempts|try again later|temporarily disabled/i;
test.describe('@p0 Rate limit & lockout (resilient)', () => {
  test('After N wrong attempts show generic or lockout (no enumeration)', async ({ page }) => {
    let email: string;
    try { 
      email = users.valid.email; 
    } catch (e: any) { 
      test.skip(true, e?.message ?? 'Missing creds'); 
      return; 
    }
    const login = new LoginPage(page);
    const N = Number.isFinite(LOCKOUT_N) ? LOCKOUT_N : 5;
    for (let i = 0; i < N; i++) {
      await login.goto();
      await login.login(email, WRONG);
      await page.waitForTimeout(1000);
      const onIdp = /id\.alohi\.com/i.test(page.url());
      const stillOnLogin = await page.getByLabel(/password/i).first().isVisible().catch(() => false);
      const seenGeneric = await page.getByText(genericErr).isVisible().catch(() => false);
      const seenLockout = await page.getByText(lockoutErr).isVisible().catch(() => false);
      
      const isValidState = seenGeneric || seenLockout || (onIdp && stillOnLogin);
      expect(isValidState, `After attempt ${i + 1}, expected generic error, lockout message, or login form`).toBeTruthy();
    }
    await page.goto(routes.login, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(1000);
    await login.login(email, WRONG);
    await page.waitForTimeout(1500);
    const locked = await page.getByText(lockoutErr).isVisible().catch(() => false);
    const generic = await page.getByText(genericErr).isVisible().catch(() => false);
    const enumeration = await page.getByText(/user not found|no account|does not exist|unknown user/i).isVisible().catch(() => false);
    expect(locked || generic, `Expected lockout or generic error but got neither`).toBeTruthy();
    expect(enumeration, `Should not show user enumeration`).toBeFalsy();
  });
});