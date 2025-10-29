import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { Header } from '../pages/Header';

type AuthFx = {
  loginAs: (email: string, password: string) => Promise<void>;
  dashboard: DashboardPage;
  header: Header;
};

export const test = base.extend<AuthFx>({
  loginAs: async ({ page }, use) => {
    await use(async (email: string, password: string) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.login(email, password);
      const dash = new DashboardPage(page);
      await dash.expectLoaded();
    });
  },
  dashboard: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  header: async ({ page }, use) => {
    await use(new Header(page));
  },
});