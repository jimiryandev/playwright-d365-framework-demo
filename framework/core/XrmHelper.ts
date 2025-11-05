import { Page } from '@playwright/test';

// TypeScript interface for Xrm
declare global {
  interface Window {
    Xrm: Xrm.XrmStatic;
  }
}

/**
 * XrmHelper - Minimal core utility for D365/Xrm interactions
 */
export class XrmHelper {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for Xrm to be available in the page context
   */
  async waitForXrmReady(): Promise<void> {
    await this.page.waitForFunction(
      () => typeof window.Xrm !== 'undefined' && window.Xrm.Page,
      { timeout: 60000 }
    );
  }
}
