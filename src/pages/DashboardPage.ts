import { Page, expect } from '@playwright/test';
import { sel } from '../utils/selectors';

export class DashboardPage {
  constructor(private page: Page) {}
  async expectLoaded() {
    await expect(this.page.getByRole('heading', { name: sel.dashboardH1 })).toBeVisible();
  }
}
