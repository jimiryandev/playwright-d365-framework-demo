import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { XrmHelper } from '../../framework/core/XrmHelper';
import { testConfig, validateConfig } from './test-config';
import * as fs from 'fs';

const authFile = 'auth/user.json';

setup('authenticate', async ({ page }) => {
  validateConfig();

  if (!fs.existsSync('auth')) {
    fs.mkdirSync('auth', { recursive: true });
  }

  const loginPage = new LoginPage(page);
  const xrmHelper = new XrmHelper(page);
  let authSuccess = false;
  let attempts = 0;
  const maxAttempts = 3;

  while (!authSuccess && attempts < maxAttempts) {
    try {
      attempts++;

      await page.goto(testConfig.mdaUrl, { waitUntil: 'load', timeout: 60000 });
      await loginPage.login(testConfig.username, testConfig.password);

      // Check if we landed on an error page
      const currentUrl = page.url();
      if (currentUrl.includes('error/errorhandler.aspx')) {
        throw new Error(`Authentication failed - landed on error page`);
      }

      // Verify we're on Dynamics
      await expect(page).toHaveURL(/dynamics\.com/, { timeout: 10000 });

      // Wait for Xrm to be ready - this is the key indicator that D365 is loaded
      await xrmHelper.waitForXrmReady();

      authSuccess = true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Authentication attempt ${attempts} failed: ${errorMessage}`);

      if (attempts === maxAttempts) {
        throw new Error(`Authentication failed after ${maxAttempts} attempts: ${errorMessage}`);
      }

      await page.goto(testConfig.mdaUrl, { waitUntil: 'load' });
    }
  }

  await page.context().storageState({ path: authFile });
  console.log('Authentication successful, session saved');
});
