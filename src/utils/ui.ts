import { expect, BrowserContext, Locator, Page } from '@playwright/test';
import { routes, apps } from './testData';

export async function visibleAny(
  page: Page,
  candidates: Array<string | Locator>,
  timeoutMs = 10_000
): Promise<Locator | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const c of candidates) {
      const loc = typeof c === 'string' ? page.locator(c) : c;
      const first = loc.first();
      try {
        if ((await first.count()) > 0 && (await first.isVisible())) return first;
      } catch { /* ignore */ }
    }
    await page.waitForTimeout(120);
  }
  return null;
}

export async function hasLoginForm(page: Page): Promise<boolean> {
  const probes = [
    page.getByLabel(/email|username/i),
    page.getByLabel(/password/i),
    page.getByRole('button', { name: /sign in|log in|continue|next|submit/i }),
    page.locator('input[type="email"], input#email, input[name="email"], input#username'),
    page.locator('input[type="password"], input#password, input[name="password"]'),
  ];
  for (const l of probes) {
    try {
      if ((await l.count()) > 0 && (await l.first().isVisible())) return true;
    } catch { /* ignore */ }
  }

  try {
    const host = new URL(page.url()).host.toLowerCase();
    if (host.includes('id.alohi.com')) return true;
  } catch {}
  return false;
}

export async function closeAnyModal(page: Page, attempts = 3): Promise<void> {
  const selectors = [
    '[aria-label="Close"]',
    'button:has-text("Close")',
    'button:has-text("Dismiss")',
    'button:has-text("Ok")',
    'button:has-text("Got it")',
    'button:has-text("I Understand")',
    '.modal .close, .ant-modal-close, .MuiDialog-root button[aria-label="close"]',
    '[data-testid*="close"]',
    'button:has([class*="icon-close"])',
  ];
  for (let i = 0; i < attempts; i++) {
    const hit = await visibleAny(page, selectors, 1000);
    if (!hit) break;
    await hit.click().catch(() => {});
    await page.waitForTimeout(200);
  }
}

export async function openUserMenu(page: Page): Promise<boolean> {
  const menuButton =
    (await visibleAny(page, [
      page.getByRole('button', { name: /account|profile|menu|settings/i }),
      'button[aria-label*="account" i], button[aria-label*="profile" i], button[aria-label*="menu" i]',
      '[class*="avatar"]',
      'button:has(img[alt*="avatar" i])',
      'header :is(button,div)[class*="user"], header :is(button,div)[class*="avatar"]',
      'button:has([data-testid*="avatar"])',
    ])) ||
    null;

  if (!menuButton) return false;

  await menuButton.click().catch(() => {});
  const menu = await visibleAny(page, [
    '[role="menu"]',
    'ul[role="menu"]',
    '.menu, .dropdown, .context-menu',
  ], 1500);
  return !!menu;
}

export async function clickLogoutIfPresent(page: Page): Promise<boolean> {
  const logout =
    (await visibleAny(page, [
      page.getByRole('menuitem', { name: /log ?out|sign ?out/i }),
      page.getByRole('link', { name: /log ?out|sign ?out/i }),
      'a[href*="logout"]',
      'button:has-text(/log ?out|sign ?out/i)',
    ])) || null;

  if (!logout) return false;
  await logout.click().catch(() => {});
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  return true;
}

export async function tryLogoutEndpoints(page: Page): Promise<boolean> {
  const urls = [
    '/logout',
    '/auth/logout',
    '/api/logout',
    '/user/logout',
  ];
  const origin = (() => {
    try { const u = new URL(page.url()); return `${u.origin}`; } catch { return ''; }
  })();

  for (const path of urls) {
    try {
      if (!origin) break;
      await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
      if (await hasLoginForm(page)) return true;
    } catch { /* ignore */ }
  }
  return false;
}

function buildIdpLogoutUrl(): string {
  const u = new URL(routes.login);
  u.pathname = u.pathname.replace('/protocol/openid-connect/auth', '/protocol/openid-connect/logout');
  const params = new URLSearchParams(u.search);
  if (!params.has('client_id')) params.set('client_id', 'app-selector');
  params.set('post_logout_redirect_uri', 'https://id.alohi.com/realms/alohi/app-selector');
  params.delete('response_type');
  params.delete('code_challenge');
  params.delete('code_challenge_method');
  params.delete('prompt');
  u.search = params.toString();
  return u.toString();
}

export async function forceIdpLogout(ctx: BrowserContext): Promise<boolean> {
  const p = await ctx.newPage();
  try {
    const url = buildIdpLogoutUrl();
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    const host = new URL(p.url()).host.toLowerCase();
    const ok = host.includes('id.alohi.com');
    await p.close();
    return ok;
  } catch {
    await p.close();
    return false;
  }
}

export async function purgeAppState(ctx: BrowserContext, appUrl: string) {
  const p = await ctx.newPage();
  try {
    await p.goto(appUrl, { waitUntil: 'domcontentloaded' });
  } catch {}
  try {
    await p.evaluate(() => {
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
      try {
        if (indexedDB && indexedDB.databases) {
          indexedDB.databases().then((dbs: any[]) =>
            dbs.forEach(d => d && d.name && indexedDB.deleteDatabase(d.name))
          );
        }
      } catch {}
    });
  } catch {}
  await p.close();
}

export async function verifyLoggedOut(page: Page): Promise<boolean> {
  const u = new URL(page.url());
  u.searchParams.set('_', String(Date.now()));
  await page.goto(u.toString(), { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1200);

  if (await hasLoginForm(page)) return true;

  try {
    const host = new URL(page.url()).host.toLowerCase();
    if (host.includes('id.alohi.com')) return true;
  } catch {}

  return false;
}
