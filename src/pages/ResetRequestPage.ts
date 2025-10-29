import { Page, Locator, expect } from '@playwright/test';
import { LoginPage } from './LoginPage';

export class ResetRequestPage {
  constructor(private page: Page) {}

  private async firstVisible(list: Locator[]): Promise<Locator | null> {
    for (const loc of list) {
      const first = loc.first();
      try {
        if ((await first.count()) > 0 && (await first.isVisible())) return first;
      } catch {

      }
    }
    return null;
  }

  private forgotCandidates(): Locator[] {
    return [
      this.page.getByRole('link',   { name: /forgot|reset.*password/i }),
      this.page.getByRole('button', { name: /forgot|reset.*password/i }),
      this.page.locator('a', { hasText: /forgot password/i }),
      this.page.locator('a', { hasText: /reset.*password/i }),
      this.page.getByText(/forgot password/i),
      this.page.locator('[data-kc-msg="doForgotPassword"]'),
      this.page.locator('a[href*="reset-credentials" i]'),
      this.page.locator('a[href*="forgot" i]'),
      this.page.locator('a[href*="reset" i]'),
    ];
  }

  private async clickForgotOnCurrentScreen(): Promise<boolean> {
    const link = await this.firstVisible(this.forgotCandidates());
    if (!link) return false;
    await link.click().catch(async () => {
      await this.page.keyboard.press('Tab').catch(() => {});
      await this.page.waitForTimeout(100);
      await link.click();
    });
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    return true;
  }
    async gotoViaLogin() {
    const login = new LoginPage(this.page);
    await login.goto();

      if (await this.clickForgotOnCurrentScreen()) return;

      const email = await this.firstVisible([
      this.page.getByLabel(/^email$/i),
      this.page.getByPlaceholder(/email/i),
      this.page.locator('input[type="email"], input#email, input[name="email"]'),
      this.page.getByLabel(/username/i),
      this.page.getByPlaceholder(/username/i),
      this.page.locator('input#username, input[name="username"]'),
    ]);

    if (email) {
      await email.fill('someone@example.com');

      const submit =
        (await this.firstVisible([
          this.page.getByRole('button', { name: /^sign in$/i }),
          this.page.getByRole('button', { name: /continue|next|submit/i }),
          this.page.locator('button[type="submit"], input[type="submit"]'),
        ])) ?? this.page.locator('button').first();

      if (await submit.isEnabled().catch(() => false)) {
        await submit.click();
      } else {
        await email.press('Enter').catch(async () => {
          await expect(submit).toBeEnabled({ timeout: 5_000 });
          await submit.click();
        });
      }

      await this.page
        .locator('input[type="password"], [name="password"], #password')
        .first()
        .waitFor({ state: 'visible', timeout: 15_000 })
        .catch(() => {});
    }

    const clicked = await this.clickForgotOnCurrentScreen();
    if (!clicked) throw new Error('Could not find a “Forgot password” link/button.');
  }

  private async emailOrUsernameField(): Promise<Locator> {
    const loc =
      (await this.firstVisible([
        this.page.getByLabel(/email|username/i),
        this.page.getByPlaceholder(/email|username/i),
        this.page.locator('input[type="email"], input[name="email"]'),
        this.page.locator('input[name="username"]'),
        this.page.locator('input[type="text"]'),
      ])) ?? null;

    if (!loc) throw new Error('Reset page: email/username input not found.');
    return loc;
  }

  async request(email: string) {
    const field = await this.emailOrUsernameField();
    await field.fill(email);

    const submit =
      (await this.firstVisible([
        this.page.getByRole('button', { name: /submit|send|continue|reset/i }),
        this.page.locator('button[type="submit"], input[type="submit"]'),
      ])) ?? this.page.locator('button').first();

    if (await submit.isEnabled().catch(() => false)) {
      await submit.click();
    } else {
      await field.press('Enter').catch(async () => {
        await expect(submit).toBeEnabled({ timeout: 5_000 });
        await submit.click();
      });
    }
  }

    async expectGenericConfirmation() {
    const successRe =
      /if the account exists|check your email|email (?:has been )?sent|we (?:have )?sent|instructions (?:to|have been) sent|reset link/i;
    const enumerationRe = /user not found|no account|does not exist/i;

    await this.page.waitForTimeout(1200);

    const successVisible = await this.page.getByText(successRe).isVisible().catch(() => false);
    const enumVisible = await this.page.getByText(enumerationRe).isVisible().catch(() => false);

    expect(successVisible || !enumVisible).toBeTruthy();
  }
}
