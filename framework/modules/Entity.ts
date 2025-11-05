import { XrmHelper } from '../core/XrmHelper';

/**
 * Entity - Handles record/entity operations in D365
 */
export class Entity {
  constructor(private xrmHelper: XrmHelper) {}

  /**
   * Get the current record's ID
   */
  async getRecordId(): Promise<string> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(() => {
      return window.Xrm.Page.data.entity.getId();
    });
  }

  /**
   * Get the logical name of the current entity
   */
  async getEntityName(): Promise<string> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(() => {
      return window.Xrm.Page.data.entity.getEntityName();
    });
  }

  /**
   * Save the current record
   */
  async save(): Promise<void> {
    await this.xrmHelper.waitForXrmReady();
    await this.xrmHelper.page.evaluate(() => {
      return window.Xrm.Page.data.entity.save();
    });
  }

  /**
   * Check if the record has unsaved changes
   */
  async isDirty(): Promise<boolean> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(() => {
      return window.Xrm.Page.data.entity.getIsDirty();
    });
  }

  /**
   * Get the primary attribute value (usually the name)
   */
  async getPrimaryAttributeValue(): Promise<string> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(() => {
      return window.Xrm.Page.data.entity.getPrimaryAttributeValue();
    });
  }

  /**
   * Check if the entity data is valid
   */
  async isValid(): Promise<boolean> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(() => {
      return window.Xrm.Page.data.entity.isValid();
    });
  }

  /**
   * Get the form type
   * @returns 0=Undefined, 1=Create, 2=Update, 3=Read Only, 4=Disabled, 6=Bulk Edit
   */
  async getFormType(): Promise<number> {
    await this.xrmHelper.waitForXrmReady();
    return this.xrmHelper.page.evaluate(() => {
      return window.Xrm.Page.ui.getFormType();
    });
  }

  /**
   * Refresh the record data from the server
   */
  async refresh(save: boolean = false): Promise<void> {
    await this.xrmHelper.waitForXrmReady();
    await this.xrmHelper.page.evaluate((shouldSave) => {
      return window.Xrm.Page.data.refresh(shouldSave);
    }, save);
  }
}
