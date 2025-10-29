import { Page } from '@playwright/test';

export class RememberMeWidget {
  constructor(private page: Page) {}
  async enable() {
    const box = this.page.getByRole('checkbox', { name: /remember me|keep me signed in/i });
    if (await box.isVisible()) {
      if (!(await box.isChecked())) await box.check();
    }
  }
}
