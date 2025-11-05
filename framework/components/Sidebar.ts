// components/Sidebar.ts
import { Page, expect } from '@playwright/test';

export class Sidebar {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Generic navigation methods
  async navigateByAriaLabel(ariaLabel: string): Promise<void> {
    const locator = this.page.locator(`li[role="treeitem"][aria-label="${ariaLabel}"]`);
    await locator.waitFor({ state: 'visible' });
    // Add this: wait for element to be actionable
    await locator.waitFor({ state: 'attached' });
    await expect(locator).toBeEnabled();
    await locator.click();
  }

  async navigateByText(text: string): Promise<void> {
    const locator = this.page.locator(`li[role="treeitem"][data-text="${text}"]`);
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  async navigateByDataId(dataId: string): Promise<void> {
    const locator = this.page.locator(`li[role="treeitem"][data-id="${dataId}"]`);
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  // Home menu item
  async navigateToHome(): Promise<void> {
    await this.navigateByAriaLabel('Home');
  }

  async isHomeVisible(): Promise<boolean> {
    return await this.isElementVisible('li[role="treeitem"][aria-label="Home"]');
  }

  async expandRecentMenu(): Promise<void> {
    const recentMenu = this.page.locator('li[role="treeitem"][aria-label="Recent"]');
    const isExpanded = await recentMenu.getAttribute('aria-expanded');

    if (isExpanded === 'false') {
      const expandButton = recentMenu.locator('[data-id="sitemap-area-entry-subaction-btn"]');
      await expandButton.waitFor({ state: 'visible' });
      await expandButton.waitFor({ state: 'attached' });
      // Wait for button to be clickable
      await expect(expandButton).toBeEnabled();
      await expandButton.click();
      await expect(recentMenu).toHaveAttribute('aria-expanded', 'true');
    }
  }

  async collapseRecentMenu(): Promise<void> {
    const recentMenu = this.page.locator('li[role="treeitem"][aria-label="Recent"]');
    const isExpanded = await recentMenu.getAttribute('aria-expanded');

    if (isExpanded === 'true') {
      // Fix: Be more specific - only the direct child button
      const collapseButton = recentMenu.locator('> div [data-id="sitemap-area-entry-subaction-btn"]').first();
      await collapseButton.click();
      await expect(recentMenu).toHaveAttribute('aria-expanded', 'false');
    }
  }

  async isRecentMenuExpanded(): Promise<boolean> {
    const recentMenu = this.page.locator('li[role="treeitem"][aria-label="Recent"]');
    const expandedState = await recentMenu.getAttribute('aria-expanded');
    return expandedState === 'true';
  }

  async getRecentMenuChevronDirection(): Promise<'up' | 'down'> {
    const recentMenu = this.page.locator('li[role="treeitem"][aria-label="Recent"]');
    const chevronUp = recentMenu.locator('.ChevronUp-symbol');
    const chevronDown = recentMenu.locator('.ChevronDown-symbol');

    const isUpVisible = await chevronUp.isVisible();
    const isDownVisible = await chevronDown.isVisible();

    if (isUpVisible) return 'up';
    if (isDownVisible) return 'down';

    // Fallback to aria-expanded state
    const isExpanded = await this.isRecentMenuExpanded();
    return isExpanded ? 'up' : 'down';
  }

  async getRecentItems(): Promise<string[]> {
    await this.expandRecentMenu();
    // Target the ul[role="group"] container that appears after the li[role="treeitem"]
    const recentItems = this.page.locator('ul[role="group"][aria-label="Recent"] li[data-text]');
    return await recentItems.evaluateAll(elements =>
      elements.map(el => el.getAttribute('data-text'))
        .filter((text): text is string => Boolean(text))
    );
  }

  async clickRecentItem(itemName: string): Promise<void> {
    await this.expandRecentMenu();
    const itemLocator = this.page.locator(`ul[role="group"][aria-label="Recent"] li[data-text="${itemName}"]`);
    await itemLocator.click();
  }

  async pinRecentItem(itemName: string): Promise<void> {
    await this.expandRecentMenu();
    const itemLocator = this.page.locator(`ul[role="group"][aria-label="Recent"] li[data-text="${itemName}"]`).first();

    // Hover over the item to make pin button visible
    await itemLocator.hover();

    // FIX: Wait for the pin button to actually appear after hover
    const pinButton = itemLocator.locator('button[aria-label="Add to Pinned"][data-id="sitemap-area-entry-subaction-btn"]');
    await pinButton.waitFor({ state: 'visible' }); // Wait for button to appear
    await pinButton.waitFor({ state: 'attached' }); // Wait for button to be ready

    await pinButton.click();

    // Wait for the item to appear in pinned list
    await this.page.locator(`ul[role="group"][aria-label="Pinned"] li[data-text="${itemName}"]`)
      .waitFor({ state: 'visible', timeout: 5000 });
  }

  async getRecentItemsWithPinStatus(): Promise<Array<{ name: string, isPinned: boolean }>> {
    await this.expandRecentMenu();
    const recentItems = this.page.locator('ul[role="group"][aria-label="Recent"] li[data-text]');

    const items = await recentItems.evaluateAll(elements =>
      elements.map(el => {
        const name = el.getAttribute('data-text') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const isPinned = !ariaLabel.includes('not pinned');
        return { name, isPinned };
      })
    );

    return items;
  }

  async isRecentItemPinned(itemName: string): Promise<boolean> {
    await this.expandRecentMenu();
    const itemLocator = this.page.locator(`ul[role="group"][aria-label="Recent"] li[data-text="${itemName}"]`);
    const ariaLabel = await itemLocator.getAttribute('aria-label');
    return ariaLabel ? !ariaLabel.includes('not pinned') : false;
  }

  // Pinned menu item operations
  async expandPinnedMenu(): Promise<void> {
    const pinnedMenu = this.page.locator('li[role="treeitem"][aria-label="Pinned"]');
    const isExpanded = await pinnedMenu.getAttribute('aria-expanded');

    if (isExpanded === 'false') {
      const expandButton = pinnedMenu.locator('[data-id="sitemap-area-entry-subaction-btn"]');
      await expandButton.click();
      // Wait for aria-expanded to change to 'true'
      await expect(pinnedMenu).toHaveAttribute('aria-expanded', 'true');
    }
  }

  async collapsePinnedMenu(): Promise<void> {
    const pinnedMenu = this.page.locator('li[role="treeitem"][aria-label="Pinned"]');
    const isExpanded = await pinnedMenu.getAttribute('aria-expanded');

    if (isExpanded === 'true') {
      const collapseButton = pinnedMenu.locator('[data-id="sitemap-area-entry-subaction-btn"]');
      await collapseButton.click();
      // Wait for aria-expanded to change to 'false'
      await expect(pinnedMenu).toHaveAttribute('aria-expanded', 'false');
    }
  }

  async isPinnedMenuExpanded(): Promise<boolean> {
    const pinnedMenu = this.page.locator('li[role="treeitem"][aria-label="Pinned"]');
    const expandedState = await pinnedMenu.getAttribute('aria-expanded');
    return expandedState === 'true';
  }

  async getPinnedMenuChevronDirection(): Promise<'up' | 'down'> {
    const pinnedMenu = this.page.locator('li[role="treeitem"][aria-label="Pinned"]');
    const chevronUp = pinnedMenu.locator('.ChevronUp-symbol');
    const chevronDown = pinnedMenu.locator('.ChevronDown-symbol');

    const isUpVisible = await chevronUp.isVisible();
    const isDownVisible = await chevronDown.isVisible();

    if (isUpVisible) return 'up';
    if (isDownVisible) return 'down';

    // Fallback to aria-expanded state
    const isExpanded = await this.isPinnedMenuExpanded();
    return isExpanded ? 'up' : 'down';
  }

  // Workflow methods that combine multiple operations
  async pinItemFromRecentToPinned(itemName: string): Promise<boolean> {
    try {
      // Check if item exists in Recent
      const recentItems = await this.getRecentItems();
      if (!recentItems.includes(itemName)) {
        throw new Error(`Item "${itemName}" not found in Recent list`);
      }

      // Check if already pinned
      if (await this.isRecentItemPinned(itemName)) {
        console.log(`Item "${itemName}" is already pinned`);
        return false;
      }

      // Pin the item
      await this.pinRecentItem(itemName);

      // Verify it moved to Pinned
      const pinnedItems = await this.getPinnedItems();
      return pinnedItems.includes(itemName);
    } catch (error) {
      console.error(`Failed to pin item "${itemName}":`, error);
      return false;
    }
  }

  async moveItemFromPinnedToRecent(itemName: string): Promise<boolean> {
    try {
      // Check if item exists in Pinned
      const pinnedItems = await this.getPinnedItems();
      if (!pinnedItems.includes(itemName)) {
        throw new Error(`Item "${itemName}" not found in Pinned list`);
      }

      // Unpin the item
      await this.unpinItem(itemName);

      // Verify it moved back to Recent
      const recentItems = await this.getRecentItems();
      const isInRecent = recentItems.includes(itemName);
      const isNotPinned = !(await this.isRecentItemPinned(itemName));

      return isInRecent && isNotPinned;
    } catch (error) {
      console.error(`Failed to unpin item "${itemName}":`, error);
      return false;
    }
  }

  async getPinnedItems(): Promise<string[]> {
    await this.expandPinnedMenu();
    const pinnedItems = this.page.locator('ul[role="group"][aria-label="Pinned"] li[data-text]');
    return await pinnedItems.evaluateAll(elements =>
      elements.map(el => el.getAttribute('data-text'))
        .filter((text): text is string => Boolean(text))
    );
  }

  async unpinItem(itemName: string): Promise<void> {
    await this.expandPinnedMenu();
    const itemLocator = this.page.locator(`ul[role="group"][aria-label="Pinned"] li[data-text="${itemName}"]`).first();

    // Hover over the item to make unpin button visible
    await itemLocator.hover();

    // Click the unpin button using the exact selector from the HTML
    const unpinButton = itemLocator.locator('button[aria-label="Remove from Pinned"][data-id="sitemap-area-entry-subaction-btn"]');
    await unpinButton.click();

    // Wait for the item to disappear from pinned list
    await this.page.locator(`ul[role="group"][aria-label="Pinned"] li[data-text="${itemName}"]`).waitFor({ state: 'detached', timeout: 5000 });
  }

  async unpinItemUsingKeyboard(itemName: string): Promise<void> {
    await this.expandPinnedMenu();
    const itemLocator = this.page.locator(`ul[role="group"][aria-label="Pinned"] li[data-text="${itemName}"]`);
    await itemLocator.focus();
    await this.page.keyboard.press('Space');

    // Wait for the item to disappear from pinned list
    await this.page.locator(`ul[role="group"][aria-label="Pinned"] li[data-text="${itemName}"]`).waitFor({ state: 'detached', timeout: 5000 });
  }

  async getPinnedItemsWithPinStatus(): Promise<Array<{ name: string, isPinned: boolean }>> {
    await this.expandPinnedMenu();
    const pinnedItems = this.page.locator('ul[role="group"][aria-label="Pinned"] li[data-text]');

    const items = await pinnedItems.evaluateAll(elements =>
      elements.map(el => {
        const name = el.getAttribute('data-text') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const isPinned = ariaLabel.includes('pinned') && !ariaLabel.includes('not pinned');
        return { name, isPinned };
      })
    );

    return items;
  }

  async isPinnedItemVisible(itemName: string): Promise<boolean> {
    await this.expandPinnedMenu();
    const itemLocator = this.page.locator(`ul[role="group"][aria-label="Pinned"] li[data-text="${itemName}"]`);
    return await itemLocator.isVisible();
  }

  async clickPinnedItem(itemName: string): Promise<void> {
    await this.expandPinnedMenu();
    const itemLocator = this.page.locator(`ul[role="group"][aria-label="Pinned"] li[data-text="${itemName}"]`);
    await itemLocator.click();
  }

  // Keyboard interaction methods
  async pinRecentItemUsingKeyboard(itemName: string): Promise<void> {
    await this.expandRecentMenu();
    const itemLocator = this.page.locator(`ul[role="group"][aria-label="Recent"] li[data-text="${itemName}"]`);
    await itemLocator.focus();
    await this.page.keyboard.press('Space');

    // Wait for the item to appear in pinned list
    await this.page.locator(`ul[role="group"][aria-label="Pinned"] li[data-text="${itemName}"]`).waitFor({ state: 'visible', timeout: 5000 });
  }

  async navigateToRecentItemUsingKeyboard(itemName: string): Promise<void> {
    await this.expandRecentMenu();
    const itemLocator = this.page.locator(`ul[role="group"][aria-label="Recent"] li[data-text="${itemName}"]`);
    await itemLocator.focus();
    await this.page.keyboard.press('Enter');
  }

  // Count methods
  async getRecentItemsCount(): Promise<number> {
    await this.expandRecentMenu();
    const recentItems = this.page.locator('ul[role="group"][aria-label="Recent"] li[data-text]');
    return await recentItems.count();
  }

  async getPinnedItemsCount(): Promise<number> {
    await this.expandPinnedMenu();
    const pinnedItems = this.page.locator('ul[role="group"][aria-label="Pinned"] li[data-text]');
    return await pinnedItems.count();
  }

  // Helper method to clean and standardize area names
  private cleanAreaName(areaText: string): string {
    return areaText
      .trim()
      .replace(/^[A-Z]{2}(?=[A-Z][a-z])/, '') // Remove 2-letter prefixes like "CM"
      .trim();
  }

  // 1. Update getCurrentArea to use the helper
  async getCurrentArea(): Promise<string> {
    const areaButton = this.page.locator('#areaSwitcherId');
    const areaText = await areaButton.textContent() || '';
    return this.cleanAreaName(areaText);
  }

  // 2. Update getAvailableAreas to use the helper
  async getAvailableAreas(): Promise<string[]> {
    const areaSwitcher = this.page.locator('#areaSwitcherId');
    await areaSwitcher.click();

    await this.page.locator('#__flyoutRootNode').waitFor({ state: 'attached' });

    const flyoutContent = this.page.locator('#__flyoutRootNode');
    const allText = await flyoutContent.textContent() || '';
    const areasText = allText.replace(/^Change area/, '');
    const areas = areasText.split(/(?<=[a-z])(?=[A-Z])/).filter(area => area.trim());

    await this.page.keyboard.press('Escape');

    // Apply consistent cleaning to all area names
    return areas.map(area => this.cleanAreaName(area));
  }

  // 3. changeArea stays the same since it uses the cleaned names from getAvailableAreas
  async changeArea(areaName: string): Promise<void> {
    console.log(`ATTEMPTING TO CHANGE TO: "${areaName}"`);

    const areaSwitcher = this.page.locator('#areaSwitcherId');
    await areaSwitcher.click();

    await this.page.locator('#__flyoutRootNode').waitFor({ state: 'attached' });

    const flyoutContent = this.page.locator('#__flyoutRootNode');

    const flyoutText = await flyoutContent.textContent();
    console.log('Flyout content:', flyoutText);

    const areaOption = flyoutContent.locator(`li[role="menuitemradio"]:has-text("${areaName}")`);

    const count = await areaOption.count();
    console.log(`Found ${count} elements for area "${areaName}"`);

    await areaOption.click();
    console.log(`CLICKED ON: "${areaName}"`);
  }

  async isAreaSwitcherVisible(): Promise<boolean> {
    return await this.isElementVisible('#areaSwitcherId');
  }

  // Group and Sub-area operations
  async getGroupsInCurrentArea(): Promise<string[]> {
    const groupHeaders = this.page.locator('h3[data-id*="sitemap-sitemapAreaGroup"]');
    return await groupHeaders.evaluateAll(elements =>
      elements.map(el => el.textContent?.trim())
        .filter((text): text is string => Boolean(text))
    );
  }

  async getSubAreasInGroup(groupName: string): Promise<string[]> {
    const group = this.page.locator(`h3:has-text("${groupName}")`);
    const subAreaList = group.locator('+ ul');
    const subAreas = subAreaList.locator('li[data-text]');

    return await subAreas.evaluateAll(elements =>
      elements.map(el => el.getAttribute('data-text'))
        .filter((text): text is string => Boolean(text))
    );
  }

  async navigateToSubArea(subAreaName: string): Promise<void> {
    const subAreaLocator = this.page.locator(`li[role="treeitem"][data-text="${subAreaName}"]`);
    await subAreaLocator.waitFor({ state: 'visible' });
    await subAreaLocator.click();
  }

  async getCurrentSubArea(): Promise<string> {
    const currentSubArea = this.page.locator('li[role="treeitem"][aria-selected="true"][aria-current="page"][data-text]');
    const dataText = await currentSubArea.getAttribute('data-text');
    return dataText || '';
  }

  async isSubAreaActive(subAreaName: string): Promise<boolean> {
    const subArea = this.page.locator(`li[role="treeitem"][data-text="${subAreaName}"]`);
    const isSelected = await subArea.getAttribute('aria-selected');
    return isSelected === 'true';
  }

  // Validation and state checking methods
  async isSidebarFullyLoaded(): Promise<boolean> {
    try {
      await this.waitForSidebarLoaded();
      const homeVisible = await this.isHomeVisible();
      const recentVisible = await this.isElementVisible('li[role="treeitem"][aria-label="Recent"]');
      const pinnedVisible = await this.isElementVisible('li[role="treeitem"][aria-label="Pinned"]');
      return homeVisible && recentVisible && pinnedVisible;
    } catch {
      return false;
    }
  }

  // Summary and debugging methods
  async getSidebarSummary(): Promise<{
    currentArea: string;
    currentSubArea: string;
    groups: string[];
    recentItemsCount: number;
    pinnedItemsCount: number;
    recentExpanded: boolean;
    pinnedExpanded: boolean;
  }> {
    const currentArea = await this.getCurrentArea();
    const currentSubArea = await this.getCurrentSubArea();
    const groups = await this.getGroupsInCurrentArea();
    const recentItemsCount = await this.getRecentItemsCount();
    const pinnedItemsCount = await this.getPinnedItemsCount();
    const recentExpanded = await this.isRecentMenuExpanded();
    const pinnedExpanded = await this.isPinnedMenuExpanded();

    return {
      currentArea,
      currentSubArea,
      groups,
      recentItemsCount,
      pinnedItemsCount,
      recentExpanded,
      pinnedExpanded
    };
  }

  async waitForItemInList(listType: 'recent' | 'pinned', itemName: string, shouldExist: boolean = true, timeout: number = 5000): Promise<boolean> {
    try {
      const itemLocator = listType === 'recent'
        ? this.page.locator(`ul[role="group"][aria-label="Recent"] li[data-text="${itemName}"]`)
        : this.page.locator(`ul[role="group"][aria-label="Pinned"] li[data-text="${itemName}"]`);

      if (shouldExist) {
        await itemLocator.waitFor({ state: 'visible', timeout });
      } else {
        await itemLocator.waitFor({ state: 'detached', timeout });
      }
      return true;
    } catch {
      return false;
    }
  }

  // Utility methods
  async isElementVisible(selector: string, timeout: number = 5000): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isEntityVisible(entityName: string): Promise<boolean> {
    return await this.isElementVisible(`li[role="treeitem"][aria-label="${entityName}"]`);
  }

  async navigateToEntity(entityName: string): Promise<void> {
    await this.navigateByAriaLabel(entityName);
  }

  async waitForSidebarLoaded(): Promise<void> {
    await this.page.locator('li[role="treeitem"][aria-label="Home"]').waitFor({ state: 'visible', timeout: 120000 });
    await this.page.locator('li[role="treeitem"][aria-label="Recent"]').waitFor({ state: 'visible', timeout: 60000 });
    await this.page.locator('li[role="treeitem"][aria-label="Pinned"]').waitFor({ state: 'visible', timeout: 60000 });
  }
}
