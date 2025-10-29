import { Page } from '@playwright/test';
import { sel } from '../utils/selectors';

export class Header {
  constructor(private page: Page) {}
  async logout() {
    await this.page.getByRole('button', { name: sel.logoutBtn }).click();
  }
}
