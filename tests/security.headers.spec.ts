import { test, expect } from '@playwright/test';
import { cacheNoStore, hstsPresent } from '../src/utils/security';
import { routes } from '../src/utils/testData';
test('@security OIDC authorize has safe cache policy (or redirect)', async ({ request }) => {
  const res = await request.get(routes.login);
  expect(res.status()).toBeLessThan(500);
  const cc = (res.headers()['cache-control'] || '').toLowerCase();
  const pragma = (res.headers()['pragma'] || '').toLowerCase();
  expect(cacheNoStore(cc) || pragma.includes('no-cache') || cc.includes('private')).toBeTruthy();
  const hsts = res.headers()['strict-transport-security'];
  if (hsts) expect(hstsPresent(hsts)).toBeTruthy();
});
