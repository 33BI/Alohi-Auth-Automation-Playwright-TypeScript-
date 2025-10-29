import { Locator, Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email|username/i).first();
    this.passwordInput = page.getByLabel(/password/i).first();
    this.submitButton = page.getByRole('button', { name: /sign in|log in|continue/i }).first();
  }

  async goto() {
    await this.page.goto(process.env.ID_LOGIN_URL || 'https://id.alohi.com/realms/alohi/protocol/openid-connect/auth', {
      waitUntil: 'domcontentloaded'
    });
    await this.page.waitForTimeout(1000);
  }

  async login(email: string, password: string) {
    await this.page.waitForTimeout(1000);
    
    await this.emailInput.fill(email);
    await this.page.waitForTimeout(500);
    
    await this.submitButton.click();
    await this.page.waitForTimeout(1000);
    
    const passwordVisible = await this.passwordInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (passwordVisible) {
      await this.passwordInput.fill(password);
      await this.page.waitForTimeout(500);
      await this.submitButton.click();
    }
          await this.page.waitForTimeout(2000);
  }
}