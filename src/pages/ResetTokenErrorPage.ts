import { Page, expect } from '@playwright/test';

export class ResetTokenErrorPage {
  constructor(private page: Page) {}
  async goto(url: string) { await this.page.goto(url); }
  async expectExpiredOrInvalid() {
    await expect(this.page.getByText(/expired|invalid|re-request|try again/i)).toBeVisible();
  }
}
