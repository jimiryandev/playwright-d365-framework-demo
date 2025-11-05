import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nextButton: Locator;
  readonly signInButton: Locator;
  readonly noButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.nextButton = page.locator('input[type="submit"][value="Next"]');
    this.signInButton = page.locator('input[type="submit"][value="Sign in"]');
    this.noButton = page.locator('input[value="No"]');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.nextButton.click();
    await this.passwordInput.fill(password);
    await this.signInButton.click();

    // Wait for and handle "Stay signed in?" prompt
    try {
      await this.noButton.click({ timeout: 10000 });
    } catch (err) {
      // Ignore timeout errors (prompt didn't appear), but log others
      if (err instanceof Error && !err.message.includes('Timeout')) {
        console.warn('Unexpected error during Stay signed in prompt:', err);
      }
    }
  }
}
