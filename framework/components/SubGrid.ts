import { XrmHelper } from '../core/XrmHelper';

/**
 * SubGrid - Handles D365 form subgrid operations via Xrm Client API
 */
export class SubGrid {
  constructor(private xrmHelper: XrmHelper) {}

  /**
   * Gets the record count of the specified subgrid
   * @param subgridName The control name of the subgrid
   * @returns Promise which resolves with the total record count
   */
  async getRecordCount(subgridName: string): Promise<number | undefined> {
    await this.xrmHelper.waitForXrmReady();

    return this.xrmHelper.page.evaluate((name: string) => {
      const control = window.Xrm.Page.getControl<Xrm.Controls.GridControl>(name);

      if (!control) {
        return undefined;
      }

      return control.getGrid().getTotalRecordCount();
    }, subgridName);
  }

  /**
   * Gets the visible record count of the specified subgrid (records currently loaded in view)
   * @param subgridName The control name of the subgrid
   * @returns Promise which resolves with the visible record count
   */
  async getVisibleRecordCount(subgridName: string): Promise<number | undefined> {
    await this.xrmHelper.waitForXrmReady();

    return this.xrmHelper.page.evaluate((name: string) => {
      const control = window.Xrm.Page.getControl<Xrm.Controls.GridControl>(name);

      if (!control) {
        return undefined;
      }

      return control.getGrid().getRows().getLength();
    }, subgridName);
  }

  /**
   * Opens the record in the subgrid at the n-th index
   * @param subgridName The control name of the subgrid
   * @param recordNumber Index of the record to open (zero-based)
   * @returns Promise which resolves with the entity reference of the opened record
   */
  async openNthRecord(subgridName: string, recordNumber: number): Promise<{ id: string; entityType: string }> {
    await this.xrmHelper.waitForXrmReady();

    const recordReference = await this.xrmHelper.page.evaluate(
      ({ name, position }: { name: string; position: number }) => {
        const control = window.Xrm.Page.getControl<Xrm.Controls.GridControl>(name);

        if (!control) {
          throw new Error(`Subgrid control '${name}' not found on form`);
        }

        const grid = control.getGrid();
        const rows = grid.getRows();

        if (position >= rows.getLength()) {
          throw new Error(`Record index ${position} is out of range. Subgrid has ${rows.getLength()} records.`);
        }

        const record = rows.get(position).getData();
        const entityRef = record.getEntity().getEntityReference();

        return {
          id: entityRef.id,
          entityType: entityRef.entityType
        };
      },
      { name: subgridName, position: recordNumber }
    );

    // Navigate to the record
    const entityFormUrl = `${this.xrmHelper.page.url().split('/main.aspx')[0]}/main.aspx?etn=${recordReference.entityType}&id=${recordReference.id}&pagetype=entityrecord`;
    await this.xrmHelper.page.goto(entityFormUrl);
    await this.xrmHelper.waitForXrmReady();

    return recordReference;
  }

  /**
   * Gets the entity name (logical name) that the subgrid displays
   * @param subgridName The control name of the subgrid
   * @returns Promise which resolves with the entity logical name
   */
  async getEntityName(subgridName: string): Promise<string | undefined> {
    await this.xrmHelper.waitForXrmReady();

    return this.xrmHelper.page.evaluate((name: string) => {
      const control = window.Xrm.Page.getControl<Xrm.Controls.GridControl>(name);

      if (!control) {
        return undefined;
      }

      return control.getEntityName();
    }, subgridName);
  }

  /**
   * Refreshes the specified subgrid
   * @param subgridName The control name of the subgrid to refresh
   * @returns Promise which resolves once refreshing is done
   */
  async refresh(subgridName: string): Promise<void> {
    await this.xrmHelper.waitForXrmReady();

    await this.xrmHelper.page.evaluate((name: string) => {
      const control = window.Xrm.Page.getControl<Xrm.Controls.GridControl>(name);

      if (!control) {
        throw new Error(`Subgrid control '${name}' not found on form`);
      }

      return control.refresh();
    }, subgridName);
  }

  /**
   * Gets all record IDs from the subgrid
   * @param subgridName The control name of the subgrid
   * @returns Promise which resolves with array of record IDs (normalized to lowercase without braces)
   */
  async getRecordIds(subgridName: string): Promise<string[]> {
    await this.xrmHelper.waitForXrmReady();

    return this.xrmHelper.page.evaluate((name: string) => {
      const control = window.Xrm.Page.getControl<Xrm.Controls.GridControl>(name);

      if (!control) {
        return [];
      }

      const grid = control.getGrid();
      const rows = grid.getRows();
      const ids: string[] = [];

      for (let i = 0; i < rows.getLength(); i++) {
        const row = rows.get(i);
        const entity = row.getData().getEntity();
        const rawId = entity.getId();
        // Normalize ID: remove curly braces and convert to lowercase
        const normalizedId = rawId.replace(/[{}]/g, '').toLowerCase();
        ids.push(normalizedId);
      }

      return ids;
    }, subgridName);
  }

  /**
   * Checks if the subgrid control is visible on the form
   * @param subgridName The control name of the subgrid
   * @returns Promise which resolves with visibility status
   */
  async isVisible(subgridName: string): Promise<boolean> {
    await this.xrmHelper.waitForXrmReady();

    return this.xrmHelper.page.evaluate((name: string) => {
      const control = window.Xrm.Page.getControl<Xrm.Controls.GridControl>(name);

      if (!control) {
        return false;
      }

      return control.getVisible();
    }, subgridName);
  }
}
