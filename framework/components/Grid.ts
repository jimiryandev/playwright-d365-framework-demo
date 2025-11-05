import { Page } from '@playwright/test';
import { XrmHelper } from '../core/XrmHelper';

/**
 * Enhanced Grid Component for interacting with D365 Power Grid (AG Grid)
 * Supports grid operations, column interactions, selection, view management, and command bar
 */
export class Grid {
  readonly gridContext: string;
  readonly page: Page;
  private xrmHelper: XrmHelper;

  // Main grid selectors
  private readonly gridRootSelector = 'div.ag-root';
  private readonly rowSelector = 'div[role="row"]';

  // Popup containers (column menus, view selector)
  private readonly columnMenuSelector = 'div[data-testid="columnContextMenu"]';
  private readonly viewSelectorSelector = 'div[data-id*="ViewSelector"]';

  // Centralized checkbox selectors
  private readonly checkboxInputSelectors = {
    selectAll: [
      'div.ag-header-cell[aria-colindex="1"] input[type="checkbox"]',
      'div.ag-header-select-all input[type="checkbox"]',
      'input[type="checkbox"][aria-label*="Toggle selection of all rows"]',
      'input[type="checkbox"][aria-label*="all rows"]'
    ],
    row: (rowSelector: string) => [
      `${rowSelector} input[type="checkbox"][aria-label*="select"]`,
      `${rowSelector} input[type="checkbox"]`
    ]
  };

  private readonly checkboxWrapperSelectors = {
    selectAll: [
      'div.ag-header-select-all',
      'div.ag-checkbox.ag-header-select-all',
      'div.ag-header-cell[aria-colindex="1"] div.ms-Checkbox'
    ],
    row: [
      'div.ag-selection-checkbox',
      'div[aria-colindex="1"] div.ag-checkbox',
      'div[aria-colindex="1"] div.ms-Checkbox',
      'div.status-cell div.ms-Checkbox'
    ]
  };

  constructor(page: Page, gridContext: string = 'grid') {
    this.gridContext = gridContext;
    this.page = page;
    this.xrmHelper = new XrmHelper(page);
  }

  /* ============================================
   * CORE GRID OPERATIONS
   * ============================================ */

  /**
   * Waits for grid to be fully ready (handles both empty and populated grids)
   * Uses config defaults for most timeouts (actionTimeout: 15000ms)
   */
  async waitForGridReady(): Promise<void> {
    try {
      // Intentionally shorter timeout - progress indicator should hide quickly
      await this.page.waitForSelector('#progressIndicatorContainer', {
        state: 'hidden',
        timeout: 5000
      });
    } catch (error) {
      console.log('Progress indicator not found or already hidden, proceeding...');
    }

    // Use config defaults (actionTimeout: 15000ms)
    await this.page.waitForSelector(this.gridRootSelector, { state: 'visible' });

    // Wait for grid viewport to be present (works for both empty and populated grids)
    await this.page.waitForSelector('div.ag-center-cols-viewport, div.ag-body-viewport', { state: 'visible' });
  }

  /**
   * Gets the total number of visible rows in the grid
   * @returns The count of visible rows
   */
  async getGridRowCount(): Promise<number> {
    await this.waitForGridReady();
    const rows = await this.page.$$(`${this.rowSelector}[row-index]`);
    return rows.length;
  }

  /**
   * Opens the record in the grid at the n-th index by double-clicking the checkbox column
   * @param recordNumber Zero-based index of the record to open
   */
  async openNthRecord(recordNumber: number): Promise<void> {
    await this.waitForGridReady();

    // Try both row-index (zero-based) and aria-rowindex (one-based) attributes
    // Always use column 1 (checkbox column) - most reliable for opening main record
    const selectors = [
      `${this.rowSelector}[row-index="${recordNumber}"] div[aria-colindex="1"]`,
      `${this.rowSelector}[aria-rowindex="${recordNumber + 1}"] div[aria-colindex="1"]`
    ];

    for (const selector of selectors) {
      const targetElement = await this.page.$(selector);
      if (targetElement && await targetElement.isVisible()) {
        await targetElement.dblclick();
        await this.xrmHelper.waitForXrmReady();
        return;
      }
    }

    throw new Error(
      `Failed to find row ${recordNumber} in ${this.gridContext}. ` +
      `Grid may not have enough rows.`
    );
  }

  /**
  * Gets all visible column headers and their indices
  * @returns Array of objects with column index and display text
  */
  async getColumnInfo(): Promise<Array<{ index: number; text: string }>> {
    await this.waitForGridReady();

    const headerCells = await this.page.$$('div.ag-header-cell[aria-colindex]');
    const columns: Array<{ index: number; text: string }> = [];

    for (let i = 0; i < headerCells.length; i++) {
      const cell = headerCells[i];
      const clickableHeader = await cell.$('div[data-testid="columnHeader"]');
      if (!clickableHeader) continue;

      const rawText = await clickableHeader.evaluate(el => el.textContent || '');
      const text = this.cleanColumnName(rawText);
      const ariaColIndex = await cell.getAttribute('aria-colindex');

      if (ariaColIndex && text) {
        columns.push({ index: parseInt(ariaColIndex), text });
      }
    }

    console.error(`[getColumnInfo] Columns: ${JSON.stringify(columns.map(c => c.text))}`);
    return columns;
  }

  /**
   * Gets the column index by column header name
   * @param columnName The display name of the column header (e.g., "Account Name", "Status")
   * @returns The aria-colindex value for the column
   * @throws Error if column is not found in the current view
   */
  async getColumnIndexByName(columnName: string): Promise<number> {
    const columns = await this.getColumnInfo();
    const column = columns.find(c => c.text === columnName);

    if (!column) {
      throw new Error(
        `Column "${columnName}" not found in ${this.gridContext}. ` +
        `Available columns: ${columns.map(c => c.text).join(', ')}`
      );
    }

    return column.index;
  }

  /**
   * Clicks a lookup link in a specific cell to navigate to the related record
   * @param recordNumber Zero-based row index
   * @param columnNameOrIndex Column name (e.g., "Account Name") or aria-colindex number
   */
  async clickLookupLink(recordNumber: number, columnNameOrIndex: string | number): Promise<void> {
    await this.waitForGridReady();

    // Resolve column name to index if needed
    const columnIndex = typeof columnNameOrIndex === 'string'
      ? await this.getColumnIndexByName(columnNameOrIndex)
      : columnNameOrIndex;

    // Try both row-index and aria-rowindex selectors
    const lookupSelectors = [
      `${this.rowSelector}[row-index="${recordNumber}"] div[aria-colindex="${columnIndex}"] a.ms-Link`,
      `${this.rowSelector}[aria-rowindex="${recordNumber + 1}"] div[aria-colindex="${columnIndex}"] a.ms-Link`,
      `${this.rowSelector}[row-index="${recordNumber}"] div[aria-colindex="${columnIndex}"] a`,
      `${this.rowSelector}[aria-rowindex="${recordNumber + 1}"] div[aria-colindex="${columnIndex}"] a`
    ];

    for (const selector of lookupSelectors) {
      const lookupElement = await this.page.$(selector);
      if (lookupElement && await lookupElement.isVisible()) {
        await lookupElement.click();
        await this.xrmHelper.waitForXrmReady();
        return;
      }
    }

    throw new Error(
      `No lookup link found at row ${recordNumber}, column ${columnNameOrIndex} in ${this.gridContext}`
    );
  }

  /**
  * Helper method to click a checkbox with Fluent UI pointer interception handling
  * @param inputSelectors Array of input checkbox selectors to try
  * @param wrapperSelectors Array of wrapper div selectors to try
  * @param waitForCondition Function that returns a promise to wait for after clicking
  */
  private async clickCheckbox(
    inputSelectors: string[],
    wrapperSelectors: string[],
    waitForCondition: () => Promise<void>
  ): Promise<void> {
    // Priority 1: Try actual input checkboxes first
    for (const selector of inputSelectors) {
      const element = await this.page.$(selector);
      if (element && await element.isVisible()) {
        await element.click({ force: true });
        await waitForCondition();
        return;
      }
    }

    // Priority 2: Try wrapper divs if input not found
    for (const selector of wrapperSelectors) {
      const element = await this.page.$(selector);
      if (element && await element.isVisible()) {
        await element.click({ force: true });
        await waitForCondition();
        return;
      }
    }

    throw new Error('Failed to find checkbox element');
  }

  /* ============================================
   * SELECT ALL RECORDS
   * ============================================ */
  /**
    * Clicks the "select all" checkbox in the grid header to select all records
    */
  async selectAllRecords(): Promise<void> {
    await this.waitForGridReady();

    await this.clickCheckbox(
      this.checkboxInputSelectors.selectAll,
      this.checkboxWrapperSelectors.selectAll,
      async () => {
        await this.page.waitForSelector(
          'div.ag-row.ag-row-selected, div[role="row"][aria-selected="true"]',
          { state: 'attached' }
        );
      }
    );
  }

  /**
   * Deselects all records if they are currently selected
   */
  async deselectAllRecords(): Promise<void> {
    const allSelected = await this.areAllRecordsSelected();

    if (!allSelected) {
      return; // Already deselected
    }

    await this.waitForGridReady();

    await this.clickCheckbox(
      this.checkboxInputSelectors.selectAll,
      this.checkboxWrapperSelectors.selectAll,
      async () => {
        await this.page.waitForFunction(
          () => {
            const selectedRows = document.querySelectorAll(
              'div.ag-row.ag-row-selected, div[role="row"][aria-selected="true"]'
            );
            return selectedRows.length === 0;
          }
        );
      }
    );
  }


  /**
   * Checks if all records are currently selected
   * @returns true if all records are selected, false otherwise
   */
  async areAllRecordsSelected(): Promise<boolean> {
    await this.waitForGridReady();

    // Try to find the select-all element (checkbox input or wrapper)
    const selectAllSelectors = [
      'div.ag-header-cell[aria-colindex="1"] input[type="checkbox"][aria-label*="all"]',
      'input[type="checkbox"][aria-label*="Toggle selection of all rows"]',
      'div.ag-header-select-all',
      'div.ag-header-cell[aria-colindex="1"] div.ms-Checkbox'
    ];

    for (const selector of selectAllSelectors) {
      const element = await this.page.$(selector);
      if (element && await element.isVisible()) {
        // Check if it's an input element
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());

        if (tagName === 'input') {
          // For actual checkbox inputs, check the checked property
          const isChecked = await element.evaluate((el: any) => el.checked);
          return isChecked;
        } else {
          // For wrapper divs, check classes and aria attributes
          const classes = await element.getAttribute('class');
          const ariaChecked = await element.getAttribute('aria-checked');

          return (
            classes?.includes('ag-checked') ||
            classes?.includes('is-checked') ||
            ariaChecked === 'true'
          );
        }
      }
    }

    return false;
  }

  /* ============================================
   * INDIVIDUAL ROW SELECTION
   * ============================================ */

  /**
    * Selects a specific record by clicking its checkbox (single click)
    * @param recordNumber Zero-based index of the record
    */
  async selectNthRecord(recordNumber: number): Promise<void> {
    await this.waitForGridReady();

    const rowSelectors = [
      `${this.rowSelector}[row-index="${recordNumber}"]`,
      `${this.rowSelector}[aria-rowindex="${recordNumber + 1}"]`
    ];

    // Try each row selector pattern
    for (const rowSelector of rowSelectors) {
      try {
        const inputSelectors = this.checkboxInputSelectors.row(rowSelector);
        const wrapperSelectors = this.checkboxWrapperSelectors.row.map(
          wrapper => `${rowSelector} ${wrapper}`
        );

        await this.clickCheckbox(
          inputSelectors,
          wrapperSelectors,
          async () => {
            await this.page.waitForSelector(
              `${this.rowSelector}[row-index="${recordNumber}"][aria-selected="true"], ` +
              `${this.rowSelector}[row-index="${recordNumber}"].ag-row-selected`,
              { state: 'attached' }
            );
          }
        );
        return; // Success!
      } catch (error) {
        // Try next row selector pattern
        continue;
      }
    }

    throw new Error(`Failed to select record ${recordNumber} in ${this.gridContext}`);
  }

  /**
   * Checks if a specific record is selected
   * @param recordNumber Zero-based index of the record
   * @returns true if the record is selected, false otherwise
   */
  async isRecordSelected(recordNumber: number): Promise<boolean> {
    await this.waitForGridReady();

    // Try both row-index and aria-rowindex (aria-rowindex is 1-based)
    const rowSelectors = [
      `${this.rowSelector}[row-index="${recordNumber}"]`,
      `${this.rowSelector}[aria-rowindex="${recordNumber + 1}"]`
    ];

    for (const selector of rowSelectors) {
      const row = await this.page.$(selector);
      if (row) {
        const classes = await row.getAttribute('class');
        const ariaSelected = await row.getAttribute('aria-selected');

        if (classes?.includes('ag-row-selected') || ariaSelected === 'true') {
          return true;
        }

        // Also check if the checkbox within the row is checked
        const checkbox = await row.$('input[type="checkbox"][aria-label*="select"]');
        if (checkbox) {
          const isChecked = await checkbox.evaluate((el: any) => el.checked);
          if (isChecked) return true;
        }

        return false;
      }
    }

    return false;
  }

  /* ============================================
   * COLUMN HEADER MENU INTERACTIONS
   * ============================================ */

  private cleanColumnName(columnText: string): string {
    const trimmed = columnText.trim();

    // Find where the text starts repeating
    for (let i = 1; i <= trimmed.length / 2; i++) {
      const firstPart = trimmed.substring(0, i);
      const secondPart = trimmed.substring(i, i * 2);

      if (firstPart === secondPart) {
        return firstPart;
      }
    }

    return trimmed;
  }

  /**
  * Clicks on a column header to open its context menu
  */
  async openColumnHeaderMenu(columnName: string): Promise<void> {
    await this.waitForGridReady();
    console.error(`[openColumnHeaderMenu] Looking for: "${columnName}"`);

    const headerCells = await this.page.$$('div.ag-header-cell[aria-colindex]');

    for (let i = 0; i < headerCells.length; i++) {
      const cell = headerCells[i];
      const clickableHeader = await cell.$('div[data-testid="columnHeader"]');
      if (!clickableHeader) continue;

      const rawText = await clickableHeader.evaluate(el => el.textContent || '');
      const text = this.cleanColumnName(rawText);

      console.error(`[openColumnHeaderMenu] Checking: "${text}"`);

      if (text === columnName) {
        console.error(`[openColumnHeaderMenu] ✓ MATCH! Clicking: "${text}"`);
        await clickableHeader.click();
        await this.page.waitForSelector(this.columnMenuSelector, { state: 'visible' });
        return;
      }
    }

    throw new Error(`Column header "${columnName}" not found in ${this.gridContext}`);
  }

  /**
   * Closes the column header menu if it's open
   */
  async closeColumnMenu(): Promise<void> {
    const menu = await this.page.$(this.columnMenuSelector);
    if (menu && await menu.isVisible()) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForSelector(this.columnMenuSelector, { state: 'hidden' });
    }
  }

  /**
   * Sorts a column A to Z (ascending)
   * @param columnName The display name of the column to sort
   */
  async sortColumnAtoZ(columnName: string): Promise<void> {
    await this.openColumnHeaderMenu(columnName);
    await this.clickColumnMenuOption('A to Z');
    await this.page.waitForSelector(this.columnMenuSelector, { state: 'hidden' });
    await this.waitForGridReady();
    await this.page.waitForSelector('div.ag-header-cell[aria-sort="ascending"]', { state: 'attached', timeout: 5000 });
  }

  async sortColumnZtoA(columnName: string): Promise<void> {
    // Get col-id before we do anything
    const colId = await this.getColIdByName(columnName);

    await this.openColumnHeaderMenu(columnName);
    await this.clickColumnMenuOption('Z to A');
    await this.page.waitForSelector(this.columnMenuSelector, { state: 'hidden' });

    // Wait for THIS specific column by col-id to update
    await this.page.waitForSelector(`div.ag-header-cell[col-id="${colId}"][aria-sort="descending"]`);
  }

  // Helper method
  private async getColIdByName(columnName: string): Promise<string> {
    const headers = await this.page.$$('div.ag-header-cell[aria-colindex]');
    for (const cell of headers) {
      const clickableHeader = await cell.$('div[data-testid="columnHeader"]');
      if (!clickableHeader) continue;

      const rawText = await clickableHeader.evaluate(element => element.textContent?.trim() || '');
      const text = this.cleanColumnName(rawText);

      if (text === columnName) {
        return await cell.getAttribute('col-id') || '';
      }
    }
    throw new Error(`Column ${columnName} not found`);
  }

  /**
   * Opens the filter menu for a column
   * @param columnName The display name of the column to filter
   */
  async openFilterMenu(columnName: string): Promise<void> {
    await this.openColumnHeaderMenu(columnName);
    await this.clickColumnMenuOption('Filter by');
    // Filter panel should now be visible
    await this.page.waitForSelector('div[role="dialog"], div.ms-Panel', { state: 'visible' });
  }

  /**
 * Gets the current sort state of a column
 */
  async getColumnSortState(columnName: string): Promise<'asc' | 'desc' | null> {
    await this.waitForGridReady();
    console.error(`[getColumnSortState] Looking for: "${columnName}"`);

    const headerCells = await this.page.$$('div.ag-header-cell[aria-colindex]');

    for (let i = 0; i < headerCells.length; i++) {
      const cell = headerCells[i];
      const clickableHeader = await cell.$('div[data-testid="columnHeader"]');
      if (!clickableHeader) continue;

      const rawText = await clickableHeader.evaluate(el => el.textContent || '');
      const text = this.cleanColumnName(rawText);
      const ariaSort = await cell.getAttribute('aria-sort');

      console.error(`[getColumnSortState] Column "${text}": aria-sort="${ariaSort}"`);

      if (text === columnName) {
        const result = ariaSort === 'ascending' ? 'asc' : ariaSort === 'descending' ? 'desc' : null;
        console.error(`[getColumnSortState] ✓ MATCH! Returning: ${result}`);
        return result;
      }
    }

    console.error(`[getColumnSortState] ✗ No match found`);
    return null;
  }

  /**
   * Helper method to click a menu option in the column context menu
   * @param optionName The name of the menu option (e.g., "A to Z", "Filter by")
   * @private
   */
  private async clickColumnMenuOption(optionName: string): Promise<void> {
    await this.page.waitForSelector(this.columnMenuSelector, { state: 'visible' });

    const menuItems = await this.page.$$(
      `${this.columnMenuSelector} button[role="menuitem"], ` +
      `${this.columnMenuSelector} button[role="menuitemradio"]`
    );

    for (const item of menuItems) {
      const nameAttr = await item.getAttribute('name');
      const text = await item.textContent();

      if (nameAttr === optionName || text?.includes(optionName)) {
        await item.click();
        return;
      }
    }

    throw new Error(`Menu option "${optionName}" not found in column context menu`);
  }

  /* ============================================
   * COMMAND BAR INTERACTIONS
   * ============================================ */

  /**
   * Searches for records using the grid search box
   * @param searchTerm The text to search for
   */
  async searchGrid(searchTerm: string): Promise<void> {
    await this.waitForGridReady();

    const searchBoxSelectors = [
      'input[aria-label*="Search"], input[placeholder*="Search"]',
      'input[type="search"]',
      'div.ms-SearchBox input'
    ];

    for (const selector of searchBoxSelectors) {
      const searchBox = await this.page.$(selector);
      if (searchBox) {
        await searchBox.fill(searchTerm);
        await this.page.keyboard.press('Enter');
        // Wait for grid to refresh with search results
        await this.page.waitForSelector(this.gridRootSelector, { state: 'visible' });
        await this.waitForGridReady();
        return;
      }
    }

    throw new Error('Search box not found in grid');
  }

  /**
   * Clears the grid search
   */
  async clearGridSearch(): Promise<void> {
    const searchBoxSelectors = [
      'input[aria-label*="Search"], input[placeholder*="Search"]',
      'input[type="search"]',
      'div.ms-SearchBox input'
    ];

    for (const selector of searchBoxSelectors) {
      const searchBox = await this.page.$(selector);
      if (searchBox) {
        await searchBox.fill('');
        await this.page.keyboard.press('Enter');
        await this.waitForGridReady();
        return;
      }
    }
  }

  /**
   * Clicks a button in the command bar by aria-label
   * @param buttonLabel The aria-label of the button to click
   */
  async clickCommandBarButton(buttonLabel: string): Promise<void> {
    await this.waitForGridReady();

    const button = await this.page.$(
      `button[aria-label="${buttonLabel}"], ` +
      `button[aria-label*="${buttonLabel}"]`
    );

    if (!button) {
      throw new Error(`Command bar button "${buttonLabel}" not found`);
    }

    await button.click();
  }

  /**
   * Opens the Edit Columns panel
   */
  async openEditColumns(): Promise<void> {
    await this.clickCommandBarButton('Edit columns');
    // Wait for the panel/dialog to appear
    await this.page.waitForSelector('div[role="dialog"], div.ms-Panel', { state: 'visible' });
  }

  /**
   * Opens the Edit Filters panel
   */
  async openEditFilters(): Promise<void> {
    await this.clickCommandBarButton('Edit filters');
    // Wait for the panel/dialog to appear
    await this.page.waitForSelector('div[role="dialog"], div.ms-Panel', { state: 'visible' });
  }

  /* ============================================
   * VIEW SELECTOR INTERACTIONS
   * ============================================ */

  /**
   * Opens the view selector dropdown
   */
  async openViewSelector(): Promise<void> {
    await this.waitForGridReady();

    const viewSelectorButtons = [
      'button[aria-label*="Change view"]',
      'button[aria-label*="Select view"]',
      'button[data-id*="viewSelector"]',
      'button[aria-label*="View"]'
    ];

    for (const selector of viewSelectorButtons) {
      const button = await this.page.$(selector);
      if (button) {
        await button.click();
        // Wait for view selector popup
        await this.page.waitForSelector(this.viewSelectorSelector, { state: 'visible' });
        return;
      }
    }

    throw new Error('View selector button not found');
  }

  /**
   * Selects a view by name (uses search if needed)
   * @param viewName The display name of the view (e.g., "My Active Accounts")
   */
  async selectView(viewName: string): Promise<void> {
    await this.openViewSelector();

    // Try to find the view directly first
    const viewButtons = await this.page.$$(
      `${this.viewSelectorSelector} button[role="menuitemradio"]`
    );

    for (const button of viewButtons) {
      const label = await button.$('label.viewName, label.ms-Label');
      if (label) {
        const text = await label.textContent();
        if (text?.trim() === viewName) {
          await button.click();
          // Wait for grid to reload with new view
          await this.waitForGridReady();
          return;
        }
      }
    }

    // If not found, try searching
    await this.searchViews(viewName);

    // Try again after search
    const searchedButtons = await this.page.$$(
      `${this.viewSelectorSelector} button[role="menuitemradio"]`
    );

    for (const button of searchedButtons) {
      const label = await button.$('label.viewName, label.ms-Label');
      if (label) {
        const text = await label.textContent();
        if (text?.trim() === viewName) {
          await button.click();
          await this.waitForGridReady();
          return;
        }
      }
    }

    throw new Error(`View "${viewName}" not found in view selector`);
  }

  /**
   * Gets the currently selected view name
   * @returns The name of the currently active view
   */
  async getCurrentView(): Promise<string> {
    await this.openViewSelector();

    const selectedButton = await this.page.$(
      `${this.viewSelectorSelector} button[role="menuitemradio"][aria-checked="true"]`
    );

    if (!selectedButton) {
      throw new Error('No view currently selected');
    }

    const label = await selectedButton.$('label.viewName, label.ms-Label');
    if (!label) {
      throw new Error('Could not find view name label');
    }

    const viewName = await label.textContent();

    // Close the selector
    await this.page.keyboard.press('Escape');

    return viewName?.trim() || '';
  }

  /**
   * Gets all available view names
   * @returns Array of view names
   */
  async getAvailableViews(): Promise<string[]> {
    await this.openViewSelector();

    const viewButtons = await this.page.$$(
      `${this.viewSelectorSelector} button[role="menuitemradio"]`
    );

    const viewNames: string[] = [];

    for (const button of viewButtons) {
      const label = await button.$('label.viewName, label.ms-Label');
      if (label) {
        const text = await label.textContent();
        if (text) {
          viewNames.push(text.trim());
        }
      }
    }

    // Close the selector
    await this.page.keyboard.press('Escape');

    return viewNames;
  }

  /**
   * Searches for views using the view selector search box
   * @param searchTerm The text to search for in view names
   */
  async searchViews(searchTerm: string): Promise<void> {
    // View selector should already be open
    await this.page.waitForSelector(this.viewSelectorSelector, { state: 'visible' });

    const searchBox = await this.page.$(
      `${this.viewSelectorSelector} input[role="searchbox"], ` +
      `${this.viewSelectorSelector} input[placeholder*="Search views"]`
    );

    if (!searchBox) {
      throw new Error('View search box not found');
    }

    await searchBox.fill(searchTerm);
    // Wait for search results to update
    await this.page.waitForSelector(
      `${this.viewSelectorSelector} button[role="menuitemradio"]`,
      { state: 'visible' }
    );
  }
}
