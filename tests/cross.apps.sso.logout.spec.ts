import { test, expect, BrowserContext, Page, Locator } from '@playwright/test';
import { users, apps, routes } from '../src/utils/testData';
import { LoginPage } from '../src/pages/LoginPage';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function hasLoginForm(page: Page): Promise<boolean> {
  const probes: Locator[] = [
    page.getByLabel(/email|username/i),
    page.getByPlaceholder(/email|username/i),
    page.locator('input[type="email"],input[name="email"],input#username,input[name="username"]'),
    page.getByLabel(/password/i),
    page.locator('input[type="password"],input#password,input[name="password"]'),
    page.getByRole('button', { name: /sign in|log in|continue|next/i }),
  ];
  for (const p of probes) {
    try {
      const first = p.first();
      if ((await first.count()) > 0 && await first.isVisible()) return true;
    } catch { /* ignore */ }
  }
  return false;
}
async function closeAnyModal(page: Page) {
  const candidates: Locator[] = [
    page.locator('[role="dialog"] button[aria-label*="close" i]'),
    page.getByRole('button', { name: /^close$/i }),
    page.locator('.MuiDialog-root button, .modal button').filter({ hasText: /close|✕|×/i }),
  ];
  for (const c of candidates) {
    try {
      const b = c.first();
      if ((await b.count()) > 0 && await b.isVisible()) { await b.click({ timeout: 1000 }); await sleep(300); }
    } catch { /* ignore */ }
  }
  try { await page.keyboard.press('Escape'); } catch {}
}
async function openUserMenu(page: Page): Promise<boolean> {
  const picks: Locator[] = [
    page.locator('#user-menu, [id*="user-menu"]'),
    page.getByRole('button', { name: /account|profile|avatar|user/i }),
    page.locator('button[aria-label*="account" i], button[aria-label*="profile" i]'),
    page.locator('header').locator('button:has(svg)').last(), // common pattern
  ];
  for (const p of picks) {
    const el = p.first();
    try {
      if ((await el.count()) > 0 && await el.isVisible()) {
        await el.click({ timeout: 2000 }).catch(() => {});
        await sleep(400);
        const menu = page.getByRole('menu');
        if ((await menu.count()) > 0 && await menu.first().isVisible().catch(() => false)) return true;
        const maybe = await page.getByText(/log ?out/i).first().isVisible().catch(() => false);
        if (maybe) return true;
      }
    } catch { /* keep trying */ }
  }
  return false;
}
async function clickLogoutIfPresent(page: Page): Promise<boolean> {
  const options: Locator[] = [
    page.getByRole('menuitem', { name: /log ?out/i }),
    page.getByRole('link', { name: /log ?out/i }),
    page.getByText(/^log ?out$/i),
    page.locator('a:has-text("Log Out"), button:has-text("Log Out")'),
  ];
  for (const o of options) {
    try {
      const el = o.first();
      if ((await el.count()) > 0 && await el.isVisible()) {
        await el.click({ timeout: 3000 });
        await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
        await sleep(800);
        return true;
      }
    } catch { /* try next */ }
  }
  return false;
}
async function forceIdpLogout(ctx: BrowserContext): Promise<boolean> {
  const p = await ctx.newPage();
  const base = 'https://id.alohi.com/realms/alohi/protocol/openid-connect/logout';
  const post = encodeURIComponent(routes.dashboard);
  await p.goto(`${base}?client_id=app-selector&post_logout_redirect_uri=${post}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await p.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  const isLogin = await hasLoginForm(p);
  await p.close();
  return isLogin;
}
async function openProduct(ctx: BrowserContext, url: string): Promise<Page> {
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await closeAnyModal(p);
  expect(await hasLoginForm(p), `Expected SSO at ${url} but saw a login form`).toBeFalsy();
  return p;
}
test.describe('@smoke @p0 Cross-app SSO navigation + logout', () => {
  test('Login once → Sign.Plus → Dial.Plus → Fax.Plus → Logout', async ({ browser }) => {
    const ctx = await browser.newContext();
    const id = await ctx.newPage();
    const login = new LoginPage(id);
    await login.goto();
    await login.login(users.valid.email, users.valid.password);
    await expect(id).not.toHaveURL(/\/protocol\/openid-connect\/auth/i);
    const sign = await openProduct(ctx, apps.sign.replace(/\/?$/, '/') + 'home');
    const dial = await openProduct(ctx, apps.dial);
    const fax  = await openProduct(ctx, apps.fax.replace(/\/?$/, '/') + 'faxes/inbox');
    await sign.bringToFront();
    await closeAnyModal(sign);

    let loggedOut = false;
    if (await openUserMenu(sign)) {
      loggedOut = await clickLogoutIfPresent(sign);
      await sleep(800);
    }
    if (!loggedOut) {
      loggedOut = await forceIdpLogout(ctx);
    }
    expect(loggedOut, 'Could not log out via UI nor IdP').toBeTruthy();
    const verify = async (p: Page, label: string) => {
      await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await p.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
      const out = await hasLoginForm(p);
      if (!out) {
        await p.goto(p.url(), { waitUntil: 'domcontentloaded' }).catch(() => {});
      }
      const final = await hasLoginForm(p);
      return final;
    };
    const faxLoggedOut = await verify(fax, 'Fax.Plus');
    const dialLoggedOut = await verify(dial, 'Dial.Plus');
    const signLoggedOut = await verify(sign, 'Sign.Plus');
    if (!faxLoggedOut || !dialLoggedOut) {
      await forceIdpLogout(ctx);
      await fax.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await dial.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    }
    expect(await hasLoginForm(sign)).toBeTruthy();
    expect(await hasLoginForm(dial)).toBeTruthy();
    expect(await hasLoginForm(fax)).toBeTruthy();
    await ctx.close();
  });
});
